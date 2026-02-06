/**
 * Auto-Approval System
 * Handles automatic approval of workflows based on rules
 */

import prisma from '@/lib/prisma';
import { processWorkflowAction } from '@/lib/workflow/engine';
import { createNotification } from '@/lib/workflow/notifications';
import {
  evaluateRules,
  enrichContextData,
  DEFAULT_RULES,
  type AutomationRule,
  type RuleEvaluationContext,
  type RuleEvaluationResult,
} from './rules-engine';

export interface AutoApprovalResult {
  success: boolean;
  workflowId: string;
  entityType: string;
  entityId: string;
  action: 'approved' | 'skipped' | 'error';
  ruleApplied?: string;
  reason: string;
  timestamp: Date;
}

export interface AutoApprovalStats {
  totalProcessed: number;
  autoApproved: number;
  skipped: number;
  errors: number;
  byType: {
    budget: number;
    otb: number;
    sku: number;
  };
}

// System user ID for auto-approvals
const SYSTEM_USER_ID = 'system-auto-approver';

/**
 * Process pending workflows and auto-approve eligible ones
 */
export async function processAutoApprovals(
  customRules?: AutomationRule[]
): Promise<AutoApprovalResult[]> {
  const results: AutoApprovalResult[] = [];
  const rules = customRules || (DEFAULT_RULES.map((r, i) => ({
    ...r,
    id: `default-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as AutomationRule[]);

  try {
    // Get pending workflows
    const pendingWorkflows = await prisma.workflow.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      include: {
        steps: {
          where: { status: 'PENDING' },
          orderBy: { stepNumber: 'asc' },
          take: 1,
        },
      },
    });

    for (const workflow of pendingWorkflows) {
      if (!workflow.steps[0]) continue;

      const currentStep = workflow.steps[0];

      // Get entity data based on workflow type
      const entityData = await getEntityData(workflow.type, workflow.referenceId);
      if (!entityData) {
        results.push({
          success: false,
          workflowId: workflow.id,
          entityType: workflow.type.toLowerCase(),
          entityId: workflow.referenceId,
          action: 'error',
          reason: 'Entity not found',
          timestamp: new Date(),
        });
        continue;
      }

      // Build evaluation context
      const context: RuleEvaluationContext = enrichContextData({
        entityType: getEntityType(workflow.type),
        entityId: workflow.referenceId,
        data: entityData,
        metadata: {
          currentStep: currentStep.stepNumber,
        },
      });

      // Evaluate rules
      const ruleResults = evaluateRules(
        rules.filter(r => r.type.includes('AUTO_APPROVE')),
        context
      );

      const matchingRule = ruleResults.find(r => r.matched);

      if (matchingRule) {
        // Execute auto-approval
        const approvalResult = await executeAutoApproval(
          workflow.id,
          currentStep.stepNumber,
          matchingRule
        );

        results.push({
          success: approvalResult.success,
          workflowId: workflow.id,
          entityType: workflow.type.toLowerCase(),
          entityId: workflow.referenceId,
          action: approvalResult.success ? 'approved' : 'error',
          ruleApplied: matchingRule.ruleName,
          reason: approvalResult.reason,
          timestamp: new Date(),
        });

        // Log the auto-approval
        await logAutoApproval(workflow, matchingRule, approvalResult.success);
      } else {
        results.push({
          success: true,
          workflowId: workflow.id,
          entityType: workflow.type.toLowerCase(),
          entityId: workflow.referenceId,
          action: 'skipped',
          reason: 'No matching rules',
          timestamp: new Date(),
        });
      }
    }
  } catch (error) {
    console.error('[AutoApprover] Error processing auto-approvals:', error);
  }

  return results;
}

/**
 * Execute auto-approval for a specific workflow
 */
async function executeAutoApproval(
  workflowId: string,
  stepNumber: number,
  ruleResult: RuleEvaluationResult
): Promise<{ success: boolean; reason: string }> {
  try {
    const approveAction = ruleResult.actions.find(a => a.type === 'approve');
    const comment = (approveAction?.config?.comment as string) ||
      `Auto-approved by rule: ${ruleResult.ruleName}`;

    // Process the workflow action
    const result = await processWorkflowAction({
      workflowId,
      stepNumber,
      actionById: SYSTEM_USER_ID,
      action: 'approve',
      comment: `[AUTO] ${comment}`,
    });

    // Check if the approval was successful (status is 'approved' or 'in_progress' means moving to next step)
    const isSuccess = result.status === 'approved' || result.status === 'in_progress' || result.status === 'completed';

    if (isSuccess) {
      // Send notifications if configured
      const notifyAction = ruleResult.actions.find(a => a.type === 'notify');
      if (notifyAction) {
        await sendAutoApprovalNotifications(workflowId, ruleResult.ruleName, notifyAction.config);
      }
    }

    return {
      success: isSuccess,
      reason: isSuccess ? 'Auto-approved successfully' : `Workflow status: ${result.status}`,
    };
  } catch (error) {
    console.error('[AutoApprover] Error executing auto-approval:', error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Execution error',
    };
  }
}

/**
 * Get entity data for rule evaluation
 */
async function getEntityData(
  workflowType: string,
  referenceId: string
): Promise<Record<string, unknown> | null> {
  try {
    switch (workflowType) {
      case 'BUDGET_APPROVAL': {
        const budget = await prisma.budgetAllocation.findUnique({
          where: { id: referenceId },
          include: {
            brand: { select: { name: true } },
            season: { select: { name: true } },
          },
        });
        if (!budget) return null;
        return {
          totalBudget: Number(budget.totalBudget),
          seasonalBudget: Number(budget.seasonalBudget || 0),
          replenishmentBudget: Number(budget.replenishmentBudget || 0),
          brandName: budget.brand.name,
          seasonName: budget.season.name,
          status: budget.status,
          version: budget.version,
        };
      }

      case 'OTB_APPROVAL': {
        const otbPlan = await prisma.oTBPlan.findUnique({
          where: { id: referenceId },
          include: {
            brand: { select: { name: true } },
            season: { select: { name: true } },
            budget: { select: { totalBudget: true } },
          },
        });
        if (!otbPlan) return null;
        const budgetTotal = Number(otbPlan.budget?.totalBudget || 0);
        const otbTotal = Number(otbPlan.totalOTBValue || 0);
        return {
          totalBudget: budgetTotal,
          totalOTB: otbTotal,
          totalSKUCount: otbPlan.totalSKUCount,
          brandName: otbPlan.brand.name,
          seasonName: otbPlan.season.name,
          status: otbPlan.status,
          budgetUtilization: budgetTotal > 0
            ? (otbTotal / budgetTotal) * 100
            : 0,
          variancePercent: 0, // Calculate from historical data if available
        };
      }

      case 'SKU_APPROVAL': {
        const skuProposal = await prisma.sKUProposal.findUnique({
          where: { id: referenceId },
          include: {
            brand: { select: { name: true } },
            season: { select: { name: true } },
          },
        });
        if (!skuProposal) return null;
        return {
          totalSKUs: skuProposal.totalSKUs,
          validSKUs: skuProposal.validSKUs,
          errorSKUs: skuProposal.errorSKUs,
          warningSKUs: skuProposal.warningSKUs,
          totalValue: Number(skuProposal.totalValue || 0),
          totalUnits: skuProposal.totalUnits || 0,
          brandName: skuProposal.brand.name,
          seasonName: skuProposal.season.name,
          status: skuProposal.status,
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('[AutoApprover] Error fetching entity data:', error);
    return null;
  }
}

/**
 * Map workflow type to entity type
 */
function getEntityType(workflowType: string): 'budget' | 'otb' | 'sku' | 'inventory' {
  const mapping: Record<string, 'budget' | 'otb' | 'sku' | 'inventory'> = {
    'BUDGET_APPROVAL': 'budget',
    'OTB_APPROVAL': 'otb',
    'SKU_APPROVAL': 'sku',
  };
  return mapping[workflowType] || 'budget';
}

/**
 * Send notifications for auto-approval
 */
async function sendAutoApprovalNotifications(
  workflowId: string,
  ruleName: string,
  config: Record<string, unknown>
): Promise<void> {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        initiatedBy: { select: { id: true, name: true } },
      },
    });

    if (!workflow) return;

    const usersToNotify: string[] = [];

    // Notify originator if configured
    if (config.notifyOriginator && workflow.initiatedById) {
      usersToNotify.push(workflow.initiatedById);
    }

    // Notify managers if configured
    if (config.notifyManagers || config.notifyFinance) {
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'FINANCE_HEAD', 'MERCHANDISE_LEAD'] },
        },
        select: { id: true },
      });
      usersToNotify.push(...managers.map(m => m.id));
    }

    // Create notifications
    const uniqueUsers = Array.from(new Set(usersToNotify));
    for (const userId of uniqueUsers) {
      await createNotification({
        userId,
        type: 'SYSTEM_ALERT',
        priority: 'LOW',
        title: 'Auto-Approval Completed',
        message: `Workflow was automatically approved by rule: ${ruleName}`,
        referenceType: workflow.referenceType,
        referenceId: workflow.referenceId,
      });
    }
  } catch (error) {
    console.error('[AutoApprover] Error sending notifications:', error);
  }
}

/**
 * Log auto-approval to audit log
 */
async function logAutoApproval(
  workflow: { id: string; type: string; referenceId: string },
  ruleResult: RuleEvaluationResult,
  success: boolean
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'AUTO_APPROVE',
        tableName: workflow.type.toLowerCase(),
        recordId: workflow.referenceId,
        userId: SYSTEM_USER_ID,
        userEmail: 'system@automation.local',
        newValue: JSON.parse(JSON.stringify({
          workflowId: workflow.id,
          ruleId: ruleResult.ruleId,
          ruleName: ruleResult.ruleName,
          success,
          conditionResults: ruleResult.conditionResults.map(c => ({
            field: c.condition.field,
            operator: c.condition.operator,
            expected: c.condition.value,
            actual: c.actualValue,
            passed: c.passed,
          })),
        })),
        changedFields: ['status', 'auto_approved'],
      },
    });
  } catch (error) {
    console.error('[AutoApprover] Error logging auto-approval:', error);
  }
}

/**
 * Get auto-approval statistics
 */
export async function getAutoApprovalStats(
  startDate?: Date,
  endDate?: Date
): Promise<AutoApprovalStats> {
  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };

  const logs = await prisma.auditLog.findMany({
    where: {
      action: 'AUTO_APPROVE',
      ...(startDate || endDate ? { createdAt: dateFilter } : {}),
    },
    select: {
      tableName: true,
      newValue: true,
    },
  });

  const stats: AutoApprovalStats = {
    totalProcessed: logs.length,
    autoApproved: logs.filter(l => (l.newValue as Record<string, unknown>)?.success === true).length,
    skipped: 0,
    errors: logs.filter(l => (l.newValue as Record<string, unknown>)?.success === false).length,
    byType: {
      budget: logs.filter(l => l.tableName === 'budget_approval').length,
      otb: logs.filter(l => l.tableName === 'otb_approval').length,
      sku: logs.filter(l => l.tableName === 'sku_approval').length,
    },
  };

  return stats;
}
