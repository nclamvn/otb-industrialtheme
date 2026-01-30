import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GapAnalysisService } from './gap-analysis.service';
import {
  GenerateSuggestionsDto,
  ApplySuggestionDto,
  DismissSuggestionDto,
  BudgetSuggestionType,
  BudgetSuggestionStatus,
  SuggestionPriority,
  GapSeverity,
  GapType,
  BudgetSuggestionResponse,
  SuggestionActionResponse,
} from '../dto/gap-analysis.dto';

@Injectable()
export class BudgetSuggestionsService {
  constructor(
    private prisma: PrismaService,
    private gapAnalysisService: GapAnalysisService,
  ) {}

  /**
   * Generate AI suggestions based on gap analysis
   */
  async generateSuggestions(
    budgetId: string,
    options: GenerateSuggestionsDto = {},
    userId: string,
  ): Promise<BudgetSuggestionResponse[]> {
    // Run gap analysis first
    const gapAnalysis = await this.gapAnalysisService.analyzeGaps(budgetId);

    if (!gapAnalysis || gapAnalysis.results.length === 0) {
      return [];
    }

    // Filter to significant gaps
    const significantGaps = gapAnalysis.results.filter(
      r => r.severity === GapSeverity.WARNING || r.severity === GapSeverity.CRITICAL
    );

    if (significantGaps.length === 0) {
      return [];
    }

    // Generate suggestions
    const suggestions: Omit<BudgetSuggestionResponse, 'id' | 'createdAt'>[] = [];

    // 1. Generate reallocation suggestions (transfer from under to over)
    const underAllocated = significantGaps.filter(g => g.type === GapType.UNDER);
    const overAllocated = significantGaps.filter(g => g.type === GapType.OVER);

    if (underAllocated.length > 0 && overAllocated.length > 0) {
      const reallocationSuggestion = this.generateReallocationSuggestion(
        budgetId,
        underAllocated,
        overAllocated,
      );
      if (reallocationSuggestion) {
        suggestions.push(reallocationSuggestion);
      }
    }

    // 2. Generate auto-balance suggestion for critical nodes
    const criticalNodes = significantGaps.filter(g => g.severity === GapSeverity.CRITICAL);
    if (criticalNodes.length > 0) {
      const balanceSuggestion = this.generateAutoBalanceSuggestion(budgetId, criticalNodes);
      if (balanceSuggestion) {
        suggestions.push(balanceSuggestion);
      }
    }

    // 3. Generate individual node suggestions
    for (const gap of significantGaps) {
      if (gap.type === GapType.OVER && gap.severity === GapSeverity.CRITICAL) {
        const suggestion = this.generateIncreasebudgetSuggestion(budgetId, gap);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      if (gap.type === GapType.UNDER && gap.severity === GapSeverity.CRITICAL) {
        const suggestion = this.generateDecreaseBudgetSuggestion(budgetId, gap);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    // Filter by options
    let filteredSuggestions = suggestions;

    if (options.types && options.types.length > 0) {
      filteredSuggestions = filteredSuggestions.filter(s => options.types!.includes(s.type));
    }

    if (options.minConfidence !== undefined) {
      filteredSuggestions = filteredSuggestions.filter(s => s.confidence >= options.minConfidence!);
    }

    if (options.focusNodeIds && options.focusNodeIds.length > 0) {
      filteredSuggestions = filteredSuggestions.filter(s =>
        s.affectedNodes.some(n => options.focusNodeIds!.includes(n.nodeId))
      );
    }

    // Limit results
    const maxSuggestions = options.maxSuggestions || 10;
    filteredSuggestions = filteredSuggestions
      .sort((a, b) => this.priorityOrder(b.priority) - this.priorityOrder(a.priority))
      .slice(0, maxSuggestions);

    // Save suggestions to database
    const savedSuggestions: BudgetSuggestionResponse[] = [];

    for (const suggestion of filteredSuggestions) {
      const saved = await this.prisma.budgetSuggestion.create({
        data: {
          budgetId,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          reasoning: suggestion.reasoning,
          impactAmount: new Prisma.Decimal(suggestion.impactAmount),
          impactPercent: new Prisma.Decimal(suggestion.impactPercent),
          affectedNodes: suggestion.affectedNodes as any,
          confidence: suggestion.confidence,
          priority: suggestion.priority,
          actions: suggestion.actions as any,
          status: BudgetSuggestionStatus.PENDING,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      savedSuggestions.push(this.formatSuggestion(saved));
    }

    return savedSuggestions;
  }

  /**
   * Get all pending suggestions for a budget
   */
  async getPendingSuggestions(budgetId: string): Promise<BudgetSuggestionResponse[]> {
    const suggestions = await this.prisma.budgetSuggestion.findMany({
      where: {
        budgetId,
        status: BudgetSuggestionStatus.PENDING,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { confidence: 'desc' }],
    });

    return suggestions.map(s => this.formatSuggestion(s));
  }

  /**
   * Get a specific suggestion
   */
  async getSuggestion(budgetId: string, suggestionId: string): Promise<BudgetSuggestionResponse> {
    const suggestion = await this.prisma.budgetSuggestion.findFirst({
      where: { id: suggestionId, budgetId },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }

    return this.formatSuggestion(suggestion);
  }

  /**
   * Apply a suggestion
   */
  async applySuggestion(
    budgetId: string,
    suggestionId: string,
    data: ApplySuggestionDto,
    userId: string,
  ): Promise<{ success: boolean; appliedActions: number }> {
    const suggestion = await this.prisma.budgetSuggestion.findFirst({
      where: { id: suggestionId, budgetId, status: BudgetSuggestionStatus.PENDING },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found or already processed');
    }

    const actions = suggestion.actions as SuggestionActionResponse[];
    let actionsToApply = actions;

    // Filter to specific nodes if requested
    if (data.applyToNodeIds && data.applyToNodeIds.length > 0) {
      actionsToApply = actions.filter(a => data.applyToNodeIds!.includes(a.nodeId));
    }

    if (actionsToApply.length === 0) {
      throw new BadRequestException('No actions to apply');
    }

    // Apply actions in transaction
    await this.prisma.$transaction(async (tx) => {
      for (const action of actionsToApply) {
        const updateData: Prisma.BudgetTreeNodeUpdateInput = {};

        if (action.field === 'budgetValue' || action.field === 'budget') {
          updateData.budgetValue = new Prisma.Decimal(action.newValue);
        } else if (action.field === 'allocatedValue' || action.field === 'allocated') {
          updateData.allocatedValue = new Prisma.Decimal(action.newValue);
        }

        await tx.budgetTreeNode.update({
          where: { id: action.nodeId },
          data: updateData,
        });
      }

      // Update suggestion status
      await tx.budgetSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: BudgetSuggestionStatus.APPLIED,
          appliedAt: new Date(),
          appliedById: userId,
        },
      });
    });

    return {
      success: true,
      appliedActions: actionsToApply.length,
    };
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(
    budgetId: string,
    suggestionId: string,
    data: DismissSuggestionDto,
    userId: string,
  ): Promise<{ success: boolean }> {
    const suggestion = await this.prisma.budgetSuggestion.findFirst({
      where: { id: suggestionId, budgetId, status: BudgetSuggestionStatus.PENDING },
    });

    if (!suggestion) {
      throw new NotFoundException('Suggestion not found or already processed');
    }

    await this.prisma.budgetSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: BudgetSuggestionStatus.DISMISSED,
        dismissedAt: new Date(),
        dismissedById: userId,
        dismissReason: data.reason,
      },
    });

    return { success: true };
  }

  /**
   * Generate reallocation suggestion
   */
  private generateReallocationSuggestion(
    budgetId: string,
    underAllocated: any[],
    overAllocated: any[],
  ): Omit<BudgetSuggestionResponse, 'id' | 'createdAt'> | null {
    // Find the best pair for reallocation
    const source = underAllocated.sort((a, b) => b.gap - a.gap)[0]; // Highest under-allocation
    const target = overAllocated.sort((a, b) => a.gap - b.gap)[0]; // Highest over-allocation

    if (!source || !target) return null;

    const transferAmount = Math.min(Math.abs(source.gap), Math.abs(target.gap));
    const totalBudget = source.budgetValue + target.budgetValue;
    const impactPercent = totalBudget > 0 ? (transferAmount / totalBudget) * 100 : 0;

    const actions: SuggestionActionResponse[] = [
      {
        nodeId: source.nodeId,
        nodeName: source.nodeName,
        field: 'budgetValue',
        currentValue: source.budgetValue,
        newValue: source.budgetValue - transferAmount,
        change: -transferAmount,
      },
      {
        nodeId: target.nodeId,
        nodeName: target.nodeName,
        field: 'budgetValue',
        currentValue: target.budgetValue,
        newValue: target.budgetValue + transferAmount,
        change: transferAmount,
      },
    ];

    return {
      budgetId,
      type: BudgetSuggestionType.REALLOCATE,
      title: `Reallocate from ${source.nodeName} to ${target.nodeName}`,
      description: `Transfer $${transferAmount.toLocaleString()} from under-utilized "${source.nodeName}" (gap: ${source.gapPercent.toFixed(1)}%) to over-allocated "${target.nodeName}" (gap: ${target.gapPercent.toFixed(1)}%)`,
      reasoning: `Analysis shows "${source.nodeName}" has significant under-allocation while "${target.nodeName}" is over-committed. Transferring budget will help balance both nodes and improve overall allocation efficiency.`,
      impactAmount: transferAmount,
      impactPercent: Math.round(impactPercent * 100) / 100,
      affectedNodes: [
        { nodeId: source.nodeId, nodeName: source.nodeName, change: -transferAmount },
        { nodeId: target.nodeId, nodeName: target.nodeName, change: transferAmount },
      ],
      confidence: 85,
      priority: SuggestionPriority.HIGH,
      actions,
      status: BudgetSuggestionStatus.PENDING,
    };
  }

  /**
   * Generate auto-balance suggestion
   */
  private generateAutoBalanceSuggestion(
    budgetId: string,
    criticalNodes: any[],
  ): Omit<BudgetSuggestionResponse, 'id' | 'createdAt'> | null {
    if (criticalNodes.length < 2) return null;

    const totalGap = criticalNodes.reduce((sum, n) => sum + Math.abs(n.gap), 0);
    const avgGap = totalGap / criticalNodes.length;

    const actions: SuggestionActionResponse[] = criticalNodes.map(node => {
      const adjustment = node.type === GapType.UNDER
        ? -avgGap / criticalNodes.length
        : avgGap / criticalNodes.length;

      return {
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        field: 'budgetValue',
        currentValue: node.budgetValue,
        newValue: node.budgetValue + adjustment,
        change: adjustment,
      };
    });

    return {
      budgetId,
      type: BudgetSuggestionType.AUTO_BALANCE,
      title: `Auto-balance ${criticalNodes.length} critical nodes`,
      description: `Redistribute budget across ${criticalNodes.length} nodes with critical gaps to achieve better balance. Total gap being addressed: $${totalGap.toLocaleString()}`,
      reasoning: `Multiple nodes have critical allocation gaps. This suggestion redistributes budget proportionally to reduce the overall imbalance. The adjustment is calculated to minimize disruption while addressing the most severe issues.`,
      impactAmount: totalGap,
      impactPercent: Math.round((totalGap / criticalNodes.reduce((s, n) => s + n.budgetValue, 0)) * 10000) / 100,
      affectedNodes: criticalNodes.map(n => ({
        nodeId: n.nodeId,
        nodeName: n.nodeName,
        change: n.type === GapType.UNDER ? -avgGap / criticalNodes.length : avgGap / criticalNodes.length,
      })),
      confidence: 75,
      priority: SuggestionPriority.URGENT,
      actions,
      status: BudgetSuggestionStatus.PENDING,
    };
  }

  /**
   * Generate increase budget suggestion for over-allocated node
   */
  private generateIncreasebudgetSuggestion(
    budgetId: string,
    gap: any,
  ): Omit<BudgetSuggestionResponse, 'id' | 'createdAt'> | null {
    const increaseAmount = Math.abs(gap.gap);

    return {
      budgetId,
      type: BudgetSuggestionType.INCREASE_BUDGET,
      title: `Increase budget for ${gap.nodeName}`,
      description: `"${gap.nodeName}" is over-allocated by $${increaseAmount.toLocaleString()} (${Math.abs(gap.gapPercent).toFixed(1)}%). Consider increasing the budget to cover current allocations.`,
      reasoning: `The allocated amount exceeds the budget by ${Math.abs(gap.gapPercent).toFixed(1)}%. This could indicate strong demand in this category. Increasing the budget will align it with actual allocation needs.`,
      impactAmount: increaseAmount,
      impactPercent: Math.abs(gap.gapPercent),
      affectedNodes: [{ nodeId: gap.nodeId, nodeName: gap.nodeName, change: increaseAmount }],
      confidence: 70,
      priority: SuggestionPriority.HIGH,
      actions: [{
        nodeId: gap.nodeId,
        nodeName: gap.nodeName,
        field: 'budgetValue',
        currentValue: gap.budgetValue,
        newValue: gap.budgetValue + increaseAmount,
        change: increaseAmount,
      }],
      status: BudgetSuggestionStatus.PENDING,
    };
  }

  /**
   * Generate decrease budget suggestion for under-allocated node
   */
  private generateDecreaseBudgetSuggestion(
    budgetId: string,
    gap: any,
  ): Omit<BudgetSuggestionResponse, 'id' | 'createdAt'> | null {
    const decreaseAmount = gap.gap;

    return {
      budgetId,
      type: BudgetSuggestionType.DECREASE_BUDGET,
      title: `Review budget for ${gap.nodeName}`,
      description: `"${gap.nodeName}" has $${decreaseAmount.toLocaleString()} unallocated (${gap.gapPercent.toFixed(1)}% of budget). Consider reducing the budget or allocating to sub-items.`,
      reasoning: `Significant budget remains unallocated in this category. This could indicate over-budgeting or pending allocations. Reviewing this node will help optimize overall budget distribution.`,
      impactAmount: decreaseAmount,
      impactPercent: gap.gapPercent,
      affectedNodes: [{ nodeId: gap.nodeId, nodeName: gap.nodeName, change: -decreaseAmount }],
      confidence: 65,
      priority: SuggestionPriority.MEDIUM,
      actions: [{
        nodeId: gap.nodeId,
        nodeName: gap.nodeName,
        field: 'budgetValue',
        currentValue: gap.budgetValue,
        newValue: gap.budgetValue - decreaseAmount,
        change: -decreaseAmount,
      }],
      status: BudgetSuggestionStatus.PENDING,
    };
  }

  /**
   * Format suggestion for response
   */
  private formatSuggestion(suggestion: any): BudgetSuggestionResponse {
    return {
      id: suggestion.id,
      budgetId: suggestion.budgetId,
      type: suggestion.type as BudgetSuggestionType,
      title: suggestion.title,
      description: suggestion.description,
      reasoning: suggestion.reasoning,
      impactAmount: Number(suggestion.impactAmount),
      impactPercent: Number(suggestion.impactPercent),
      affectedNodes: suggestion.affectedNodes as any[],
      confidence: suggestion.confidence,
      priority: suggestion.priority as SuggestionPriority,
      actions: suggestion.actions as SuggestionActionResponse[],
      status: suggestion.status as BudgetSuggestionStatus,
      appliedAt: suggestion.appliedAt,
      appliedById: suggestion.appliedById,
      dismissedAt: suggestion.dismissedAt,
      dismissedById: suggestion.dismissedById,
      dismissReason: suggestion.dismissReason,
      createdAt: suggestion.createdAt,
      expiresAt: suggestion.expiresAt,
    };
  }

  /**
   * Get priority order for sorting
   */
  private priorityOrder(priority: SuggestionPriority): number {
    const order = {
      [SuggestionPriority.URGENT]: 4,
      [SuggestionPriority.HIGH]: 3,
      [SuggestionPriority.MEDIUM]: 2,
      [SuggestionPriority.LOW]: 1,
    };
    return order[priority] || 0;
  }
}
