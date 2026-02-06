/**
 * Auto-Reorder System
 * Handles automatic reorder suggestions based on inventory levels and demand
 */

import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/workflow/notifications';
import {
  evaluateRules,
  enrichContextData,
  DEFAULT_RULES,
  type AutomationRule,
  type RuleEvaluationContext,
} from './rules-engine';

export interface ReorderSuggestion {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  category: string;
  brand: string;
  currentStock: number;
  avgDailyDemand: number;
  daysOfStock: number;
  reorderQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: number;
  reason: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
}

export interface ReorderResult {
  success: boolean;
  suggestionsCreated: number;
  criticalItems: number;
  totalReorderValue: number;
  suggestions: ReorderSuggestion[];
}

/**
 * Process inventory and create auto-reorder suggestions
 */
export async function processAutoReorders(
  customRules?: AutomationRule[]
): Promise<ReorderResult> {
  const suggestions: ReorderSuggestion[] = [];
  const rules = customRules || (DEFAULT_RULES.map((r, i) => ({
    ...r,
    id: `default-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as AutomationRule[]);

  try {
    // Get SKU items with stock information
    // In production, this would come from inventory system
    const skuItems = await prisma.sKUItem.findMany({
      where: {
        proposal: {
          status: 'APPROVED',
        },
      },
      include: {
        proposal: {
          include: {
            brand: { select: { id: true, name: true } },
            season: { select: { id: true, name: true } },
          },
        },
        category: { select: { id: true, name: true } },
      },
      take: 500,
    });

    for (const item of skuItems) {
      // Simulate inventory data (in production, fetch from inventory system)
      const inventoryData = simulateInventoryData(item);

      // Build evaluation context
      const context: RuleEvaluationContext = enrichContextData({
        entityType: 'inventory',
        entityId: item.id,
        data: {
          skuCode: item.skuCode,
          productName: item.styleName,
          category: item.category?.name || 'Unknown',
          brand: item.proposal.brand.name,
          currentStock: inventoryData.currentStock,
          avgDailyDemand: inventoryData.avgDailyDemand,
          demandTrend: inventoryData.demandTrend,
          leadTime: item.leadTime || 14,
          moq: item.moq || 1,
          retailPrice: Number(item.retailPrice),
          costPrice: Number(item.costPrice),
        },
      });

      // Evaluate reorder rules
      const ruleResults = evaluateRules(
        rules.filter(r => r.type === 'AUTO_REORDER'),
        context
      );

      const matchingRule = ruleResults.find(r => r.matched);

      if (matchingRule) {
        const reorderAction = matchingRule.actions.find(a => a.type === 'create_reorder');
        const urgency = (reorderAction?.config?.urgency as string) || 'medium';
        const targetDays = (reorderAction?.config?.targetDaysOfStock as number) || 30;

        const daysOfStock = context.data.daysOfStock as number;
        const avgDailyDemand = context.data.avgDailyDemand as number;
        const currentStock = context.data.currentStock as number;

        // Calculate reorder quantity
        const targetStock = avgDailyDemand * targetDays;
        const reorderQuantity = Math.max(
          Math.ceil(targetStock - currentStock),
          item.moq || 1
        );

        const suggestion: ReorderSuggestion = {
          id: `reorder-${item.id}-${Date.now()}`,
          skuId: item.id,
          skuCode: item.skuCode,
          productName: item.styleName,
          category: item.category?.name || 'Unknown',
          brand: item.proposal.brand.name,
          currentStock,
          avgDailyDemand,
          daysOfStock,
          reorderQuantity,
          urgency: urgency as ReorderSuggestion['urgency'],
          estimatedCost: reorderQuantity * Number(item.costPrice),
          reason: `Low stock: ${daysOfStock.toFixed(1)} days remaining. Rule: ${matchingRule.ruleName}`,
          createdAt: new Date(),
          status: 'pending',
        };

        suggestions.push(suggestion);

        // Save as AI suggestion
        await saveReorderSuggestion(suggestion);

        // Send notifications if configured
        const notifyAction = matchingRule.actions.find(a => a.type === 'notify');
        if (notifyAction) {
          await sendReorderNotifications(suggestion, notifyAction.config);
        }
      }
    }

    // Calculate summary
    const criticalItems = suggestions.filter(s => s.urgency === 'critical').length;
    const totalReorderValue = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

    return {
      success: true,
      suggestionsCreated: suggestions.length,
      criticalItems,
      totalReorderValue,
      suggestions,
    };
  } catch (error) {
    console.error('[AutoReorder] Error processing auto-reorders:', error);
    return {
      success: false,
      suggestionsCreated: 0,
      criticalItems: 0,
      totalReorderValue: 0,
      suggestions: [],
    };
  }
}

/**
 * Simulate inventory data for SKU items
 * In production, this would fetch from actual inventory system
 */
function simulateInventoryData(item: {
  orderQuantity: number;
  aiDemandScore?: number | null;
}): {
  currentStock: number;
  avgDailyDemand: number;
  demandTrend: 'growing' | 'stable' | 'declining';
} {
  // Simulate based on order quantity and AI demand score
  const baseStock = Math.floor(Math.random() * 200);
  const avgDailyDemand = Math.max(1, Math.floor(item.orderQuantity / 30));

  // Determine trend based on AI demand score
  let demandTrend: 'growing' | 'stable' | 'declining' = 'stable';
  if (item.aiDemandScore) {
    if (item.aiDemandScore > 70) demandTrend = 'growing';
    else if (item.aiDemandScore < 30) demandTrend = 'declining';
  }

  return {
    currentStock: baseStock,
    avgDailyDemand,
    demandTrend,
  };
}

// System user ID for auto-reorder suggestions
const SYSTEM_USER_ID = 'system-auto-reorder';

/**
 * Save reorder suggestion to database
 */
async function saveReorderSuggestion(suggestion: ReorderSuggestion): Promise<void> {
  try {
    // Get or create system user for suggestions
    let systemUser = await prisma.user.findUnique({
      where: { id: SYSTEM_USER_ID },
    });

    if (!systemUser) {
      // Find first admin user as fallback
      systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
    }

    if (!systemUser) {
      console.warn('[AutoReorder] No user found for saving suggestion');
      return;
    }

    await prisma.aISuggestion.create({
      data: {
        type: 'REORDER_RECOMMENDATION',
        title: `Reorder: ${suggestion.skuCode}`,
        description: suggestion.reason,
        confidence: suggestion.urgency === 'critical' ? 0.95 : 0.85,
        priority: suggestion.urgency === 'critical' ? 'HIGH' : suggestion.urgency === 'high' ? 'MEDIUM' : 'LOW',
        impact: 'MEDIUM',
        status: 'PENDING',
        userId: systemUser.id,
        data: {
          skuId: suggestion.skuId,
          skuCode: suggestion.skuCode,
          productName: suggestion.productName,
          category: suggestion.category,
          brand: suggestion.brand,
          currentStock: suggestion.currentStock,
          avgDailyDemand: suggestion.avgDailyDemand,
          daysOfStock: suggestion.daysOfStock,
          reorderQuantity: suggestion.reorderQuantity,
          estimatedCost: suggestion.estimatedCost,
          urgency: suggestion.urgency,
        },
        reasoning: `Stock level critically low with only ${suggestion.daysOfStock.toFixed(1)} days of supply remaining. Based on average daily demand of ${suggestion.avgDailyDemand} units.`,
        metrics: {
          currentStock: suggestion.currentStock,
          targetStock: suggestion.avgDailyDemand * 30,
          reorderQuantity: suggestion.reorderQuantity,
          estimatedCost: suggestion.estimatedCost,
        },
      },
    });
  } catch (error) {
    console.error('[AutoReorder] Error saving suggestion:', error);
  }
}

/**
 * Send notifications for reorder suggestions
 */
async function sendReorderNotifications(
  suggestion: ReorderSuggestion,
  config: Record<string, unknown>
): Promise<void> {
  try {
    const usersToNotify: string[] = [];

    // Get procurement and manager users
    if (config.notifyProcurement || config.notifyManagers) {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MERCHANDISE_LEAD', 'BRAND_MANAGER'] },
        },
        select: { id: true },
      });
      usersToNotify.push(...users.map(u => u.id));
    }

    // Create notifications
    const uniqueUsers = Array.from(new Set(usersToNotify));
    for (const userId of uniqueUsers) {
      await createNotification({
        userId,
        type: 'SYSTEM_ALERT',
        priority: suggestion.urgency === 'critical' ? 'CRITICAL' : 'HIGH',
        title: `Reorder Alert: ${suggestion.skuCode}`,
        message: `${suggestion.productName} has only ${suggestion.daysOfStock.toFixed(1)} days of stock. Recommended reorder: ${suggestion.reorderQuantity} units.`,
        referenceType: 'SKU_ITEM',
        referenceId: suggestion.skuId,
      });
    }
  } catch (error) {
    console.error('[AutoReorder] Error sending notifications:', error);
  }
}

/**
 * Get pending reorder suggestions
 */
export async function getPendingReorders(): Promise<ReorderSuggestion[]> {
  const suggestions = await prisma.aISuggestion.findMany({
    where: {
      type: 'REORDER_RECOMMENDATION',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  return suggestions.map(s => {
    const data = s.data as Record<string, unknown>;
    return {
      id: s.id,
      skuId: (data.skuId as string) || '',
      skuCode: (data.skuCode as string) || '',
      productName: (data.productName as string) || '',
      category: (data.category as string) || '',
      brand: (data.brand as string) || '',
      currentStock: (data.currentStock as number) || 0,
      avgDailyDemand: (data.avgDailyDemand as number) || 0,
      daysOfStock: (data.daysOfStock as number) || 0,
      reorderQuantity: (data.reorderQuantity as number) || 0,
      urgency: (data.urgency as string) || (s.priority === 'HIGH' ? 'critical' : s.priority === 'MEDIUM' ? 'high' : 'medium'),
      estimatedCost: (data.estimatedCost as number) || 0,
      reason: s.description,
      createdAt: s.createdAt,
      status: 'pending',
    } as ReorderSuggestion;
  });
}

/**
 * Approve or reject a reorder suggestion
 */
export async function processReorderSuggestion(
  suggestionId: string,
  action: 'approve' | 'reject',
  userId: string,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.aISuggestion.update({
      where: { id: suggestionId },
      data: {
        status: action === 'approve' ? 'ACCEPTED' : 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: userId,
        reviewNotes: comment || `${action === 'approve' ? 'Approved' : 'Rejected'} via automation dashboard`,
      },
    });

    // Get user email for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: action === 'approve' ? 'REORDER_APPROVED' : 'REORDER_REJECTED',
        tableName: 'ai_suggestions',
        recordId: suggestionId,
        userId,
        userEmail: user?.email || '',
        newValue: { action, comment },
        changedFields: ['status', 'reviewedAt', 'reviewedById', 'reviewNotes'],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[AutoReorder] Error processing suggestion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
