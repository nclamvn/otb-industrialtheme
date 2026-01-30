import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AnalyzeGapsDto,
  GapSeverity,
  GapType,
  GapAnalysisResultResponse,
  GapAnalysisSummaryResponse,
} from '../dto/gap-analysis.dto';

@Injectable()
export class GapAnalysisService {
  constructor(private prisma: PrismaService) {}

  // Severity thresholds (percentage)
  private readonly SEVERITY_THRESHOLDS = {
    CRITICAL: 20, // gap > 20%
    WARNING: 10,  // gap > 10%
    INFO: 5,      // gap > 5%
    OK: 0,        // gap <= 5%
  };

  /**
   * Run gap analysis on a budget tree
   */
  async analyzeGaps(budgetId: string, options: AnalyzeGapsDto = {}): Promise<GapAnalysisSummaryResponse> {
    // Verify budget exists
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Get all nodes for analysis
    const whereClause: Prisma.BudgetTreeNodeWhereInput = { budgetId };

    if (options.levels && options.levels.length > 0) {
      whereClause.level = { in: options.levels };
    }

    const nodes = await this.prisma.budgetTreeNode.findMany({
      where: whereClause,
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    });

    // Clear previous analysis results
    await this.prisma.gapAnalysisResult.deleteMany({
      where: { budgetId },
    });

    // Analyze each node
    const results: GapAnalysisResultResponse[] = [];

    for (const node of nodes) {
      const analysis = this.analyzeNode(node, nodes);

      // Skip nodes below minimum gap threshold if specified
      if (options.minGapPercent !== undefined) {
        if (Math.abs(analysis.gapPercent) < options.minGapPercent) {
          continue;
        }
      }

      // Save to database
      const savedResult = await this.prisma.gapAnalysisResult.create({
        data: {
          budgetId,
          nodeId: node.id,
          nodeName: node.name,
          nodePath: analysis.nodePath,
          nodeLevel: node.level,
          budgetValue: new Prisma.Decimal(analysis.budgetValue),
          allocatedValue: new Prisma.Decimal(analysis.allocatedValue),
          gap: new Prisma.Decimal(analysis.gap),
          gapPercent: new Prisma.Decimal(analysis.gapPercent),
          severity: analysis.severity,
          type: analysis.type,
          childrenWithGaps: analysis.childrenWithGaps,
          totalChildren: analysis.totalChildren,
        },
      });

      results.push({
        ...analysis,
        id: savedResult.id,
        budgetId,
        analyzedAt: savedResult.analyzedAt,
      });
    }

    // Calculate summary statistics
    const summary = this.calculateSummary(results);

    return {
      ...summary,
      results,
    };
  }

  /**
   * Get the latest gap analysis results for a budget
   */
  async getLatestAnalysis(budgetId: string): Promise<GapAnalysisSummaryResponse | null> {
    const results = await this.prisma.gapAnalysisResult.findMany({
      where: { budgetId },
      orderBy: [{ analyzedAt: 'desc' }, { nodeLevel: 'asc' }],
    });

    if (results.length === 0) {
      return null;
    }

    const formattedResults: GapAnalysisResultResponse[] = results.map(r => ({
      id: r.id,
      budgetId: r.budgetId,
      nodeId: r.nodeId,
      nodeName: r.nodeName,
      nodePath: r.nodePath as string[],
      nodeLevel: r.nodeLevel,
      budgetValue: Number(r.budgetValue),
      allocatedValue: Number(r.allocatedValue),
      gap: Number(r.gap),
      gapPercent: Number(r.gapPercent),
      severity: r.severity as GapSeverity,
      type: r.type as GapType,
      childrenWithGaps: r.childrenWithGaps,
      totalChildren: r.totalChildren,
      analyzedAt: r.analyzedAt,
    }));

    const summary = this.calculateSummary(formattedResults);

    return {
      ...summary,
      results: formattedResults,
    };
  }

  /**
   * Get nodes with gaps above a threshold
   */
  async getNodesWithSignificantGaps(
    budgetId: string,
    minGapPercent: number = 10
  ): Promise<GapAnalysisResultResponse[]> {
    const results = await this.prisma.gapAnalysisResult.findMany({
      where: {
        budgetId,
        OR: [
          { gapPercent: { gte: minGapPercent } },
          { gapPercent: { lte: -minGapPercent } },
        ],
      },
      orderBy: [{ severity: 'desc' }, { gapPercent: 'desc' }],
    });

    return results.map(r => ({
      id: r.id,
      budgetId: r.budgetId,
      nodeId: r.nodeId,
      nodeName: r.nodeName,
      nodePath: r.nodePath as string[],
      nodeLevel: r.nodeLevel,
      budgetValue: Number(r.budgetValue),
      allocatedValue: Number(r.allocatedValue),
      gap: Number(r.gap),
      gapPercent: Number(r.gapPercent),
      severity: r.severity as GapSeverity,
      type: r.type as GapType,
      childrenWithGaps: r.childrenWithGaps,
      totalChildren: r.totalChildren,
      analyzedAt: r.analyzedAt,
    }));
  }

  /**
   * Analyze a single node
   */
  private analyzeNode(
    node: any,
    allNodes: any[]
  ): Omit<GapAnalysisResultResponse, 'id' | 'budgetId' | 'analyzedAt'> {
    const budgetValue = Number(node.budgetValue);
    const allocatedValue = Number(node.allocatedValue);
    const gap = budgetValue - allocatedValue;
    const gapPercent = budgetValue > 0 ? (gap / budgetValue) * 100 : 0;

    // Build node path
    const nodePath = this.buildNodePath(node, allNodes);

    // Determine severity
    const severity = this.determineSeverity(Math.abs(gapPercent));

    // Determine type
    const type = this.determineType(gap);

    // Count children with gaps
    const children = allNodes.filter(n => n.parentId === node.id);
    const childrenWithGaps = children.filter(child => {
      const childGap = Number(child.budgetValue) - Number(child.allocatedValue);
      const childGapPercent = Number(child.budgetValue) > 0
        ? Math.abs(childGap / Number(child.budgetValue)) * 100
        : 0;
      return childGapPercent > this.SEVERITY_THRESHOLDS.INFO;
    }).length;

    return {
      nodeId: node.id,
      nodeName: node.name,
      nodePath,
      nodeLevel: node.level,
      budgetValue,
      allocatedValue,
      gap,
      gapPercent: Math.round(gapPercent * 100) / 100,
      severity,
      type,
      childrenWithGaps,
      totalChildren: children.length,
    };
  }

  /**
   * Build the path from root to node
   */
  private buildNodePath(node: any, allNodes: any[]): string[] {
    const path: string[] = [];
    let current = node;

    while (current) {
      path.unshift(current.name);
      if (current.parentId) {
        current = allNodes.find(n => n.id === current.parentId);
      } else {
        current = null;
      }
    }

    return path;
  }

  /**
   * Determine severity based on gap percentage
   */
  private determineSeverity(absGapPercent: number): GapSeverity {
    if (absGapPercent >= this.SEVERITY_THRESHOLDS.CRITICAL) {
      return GapSeverity.CRITICAL;
    }
    if (absGapPercent >= this.SEVERITY_THRESHOLDS.WARNING) {
      return GapSeverity.WARNING;
    }
    if (absGapPercent >= this.SEVERITY_THRESHOLDS.INFO) {
      return GapSeverity.INFO;
    }
    return GapSeverity.OK;
  }

  /**
   * Determine gap type
   */
  private determineType(gap: number): GapType {
    if (gap > 0) {
      return GapType.UNDER; // Under-allocated
    }
    if (gap < 0) {
      return GapType.OVER; // Over-allocated
    }
    return GapType.BALANCED;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    results: Omit<GapAnalysisResultResponse, 'id' | 'budgetId' | 'analyzedAt'>[]
  ): Omit<GapAnalysisSummaryResponse, 'results'> {
    const totalNodes = results.length;
    const nodesWithGaps = results.filter(r => r.severity !== GapSeverity.OK).length;

    const totalBudget = results.reduce((sum, r) => sum + r.budgetValue, 0);
    const totalAllocated = results.reduce((sum, r) => sum + r.allocatedValue, 0);
    const totalGap = totalBudget - totalAllocated;

    const avgGapPercent = totalNodes > 0
      ? results.reduce((sum, r) => sum + Math.abs(r.gapPercent), 0) / totalNodes
      : 0;

    const bySeverity = {
      ok: results.filter(r => r.severity === GapSeverity.OK).length,
      info: results.filter(r => r.severity === GapSeverity.INFO).length,
      warning: results.filter(r => r.severity === GapSeverity.WARNING).length,
      critical: results.filter(r => r.severity === GapSeverity.CRITICAL).length,
    };

    const byType = {
      balanced: results.filter(r => r.type === GapType.BALANCED).length,
      under: results.filter(r => r.type === GapType.UNDER).length,
      over: results.filter(r => r.type === GapType.OVER).length,
    };

    return {
      totalNodes,
      nodesWithGaps,
      totalBudget,
      totalAllocated,
      totalGap,
      avgGapPercent: Math.round(avgGapPercent * 100) / 100,
      bySeverity,
      byType,
    };
  }
}
