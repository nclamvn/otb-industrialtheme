import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BudgetTreeService } from './budget-tree.service';
import {
  CreateBudgetVersionDto,
  UpdateBudgetVersionDto,
  SubmitBudgetVersionDto,
  ApproveBudgetVersionDto,
  RejectBudgetVersionDto,
  CompareVersionsDto,
  RollbackVersionDto,
  ListVersionsQueryDto,
  BudgetVersionStatus,
  BudgetChangeType,
  BudgetVersionResponse,
  BudgetVersionChangeResponse,
  VersionComparisonResponse,
  VersionComparisonNodeChange,
  VersionListResponse,
} from '../dto/budget-version.dto';

@Injectable()
export class BudgetVersionsService {
  constructor(
    private prisma: PrismaService,
    private budgetTreeService: BudgetTreeService,
  ) {}

  /**
   * Create a new version (snapshot) of the budget tree
   */
  async createVersion(
    budgetId: string,
    data: CreateBudgetVersionDto,
    userId: string,
  ): Promise<BudgetVersionResponse> {
    // Verify budget exists
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Get current tree state
    const treeData = await this.budgetTreeService.getTree(budgetId);

    // Get next version number
    const lastVersion = await this.prisma.budgetVersion.findFirst({
      where: { budgetId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Calculate totals
    const totalBudget = Number(budget.totalBudget);
    const totalAllocated = this.calculateTotalAllocated(treeData.tree);
    const nodeCount = treeData.nodeCount;

    // Detect changes from previous version
    const changes = lastVersion
      ? await this.detectChanges(budgetId, lastVersion.snapshotData as any, treeData.tree)
      : [];

    // Create version
    const version = await this.prisma.budgetVersion.create({
      data: {
        budgetId,
        versionNumber,
        name: data.name,
        description: data.description,
        status: BudgetVersionStatus.DRAFT,
        snapshotData: treeData.tree as any,
        totalBudget: new Prisma.Decimal(totalBudget),
        totalAllocated: new Prisma.Decimal(totalAllocated),
        nodeCount,
        tags: data.tags || [],
        createdById: userId,
        changes: {
          create: changes.map(change => ({
            nodeId: change.nodeId,
            nodeName: change.nodeName,
            nodePath: change.nodePath,
            changeType: change.changeType,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            diff: change.diff ? new Prisma.Decimal(change.diff) : null,
            diffPercent: change.diffPercent ? new Prisma.Decimal(change.diffPercent) : null,
          })),
        },
      },
      include: {
        changes: true,
      },
    });

    return this.formatVersion(version);
  }

  /**
   * List all versions for a budget
   */
  async listVersions(
    budgetId: string,
    query: ListVersionsQueryDto = {},
  ): Promise<VersionListResponse> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.BudgetVersionWhereInput = { budgetId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    const [versions, total] = await Promise.all([
      this.prisma.budgetVersion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { versionNumber: 'desc' },
        include: {
          changes: true,
        },
      }),
      this.prisma.budgetVersion.count({ where }),
    ]);

    // Get creator info for each version
    const userIds = [...new Set(versions.map(v => v.createdById))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatar: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const data = versions.map(v => {
      const formatted = this.formatVersion(v);
      formatted.createdBy = userMap.get(v.createdById);
      return formatted;
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific version
   */
  async getVersion(budgetId: string, versionId: string): Promise<BudgetVersionResponse> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: {
        id: versionId,
        budgetId,
      },
      include: {
        changes: true,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // Get creator info
    const user = await this.prisma.user.findUnique({
      where: { id: version.createdById },
      select: { id: true, name: true, email: true, avatar: true },
    });

    const formatted = this.formatVersion(version);
    formatted.createdBy = user || undefined;

    return formatted;
  }

  /**
   * Get version by number
   */
  async getVersionByNumber(budgetId: string, versionNumber: number): Promise<BudgetVersionResponse> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: {
        budgetId,
        versionNumber,
      },
      include: {
        changes: true,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.formatVersion(version);
  }

  /**
   * Submit a version for approval
   */
  async submitVersion(
    budgetId: string,
    versionId: string,
    data: SubmitBudgetVersionDto,
    userId: string,
  ): Promise<BudgetVersionResponse> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, budgetId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status !== BudgetVersionStatus.DRAFT) {
      throw new BadRequestException('Only draft versions can be submitted');
    }

    const updated = await this.prisma.budgetVersion.update({
      where: { id: versionId },
      data: {
        status: BudgetVersionStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedById: userId,
      },
      include: { changes: true },
    });

    return this.formatVersion(updated);
  }

  /**
   * Approve a version
   */
  async approveVersion(
    budgetId: string,
    versionId: string,
    data: ApproveBudgetVersionDto,
    userId: string,
  ): Promise<BudgetVersionResponse> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, budgetId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status !== BudgetVersionStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted versions can be approved');
    }

    // Mark current version as archived if exists
    await this.prisma.budgetVersion.updateMany({
      where: { budgetId, status: BudgetVersionStatus.CURRENT },
      data: { status: BudgetVersionStatus.ARCHIVED },
    });

    const updated = await this.prisma.budgetVersion.update({
      where: { id: versionId },
      data: {
        status: BudgetVersionStatus.CURRENT,
        approvedAt: new Date(),
        approvedById: userId,
        approvalComments: data.comments,
      },
      include: { changes: true },
    });

    return this.formatVersion(updated);
  }

  /**
   * Reject a version
   */
  async rejectVersion(
    budgetId: string,
    versionId: string,
    data: RejectBudgetVersionDto,
    userId: string,
  ): Promise<BudgetVersionResponse> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, budgetId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status !== BudgetVersionStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted versions can be rejected');
    }

    const updated = await this.prisma.budgetVersion.update({
      where: { id: versionId },
      data: {
        status: BudgetVersionStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: userId,
        rejectionReason: data.reason,
      },
      include: { changes: true },
    });

    return this.formatVersion(updated);
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    budgetId: string,
    data: CompareVersionsDto,
  ): Promise<VersionComparisonResponse> {
    // Get both versions
    const [v1, v2] = await Promise.all([
      this.getVersionByIdOrNumber(budgetId, data.version1),
      this.getVersionByIdOrNumber(budgetId, data.version2),
    ]);

    // Build node maps from snapshots
    const nodes1 = this.flattenTree(v1.snapshotData as any);
    const nodes2 = this.flattenTree(v2.snapshotData as any);

    const nodeMap1 = new Map(nodes1.map(n => [n.id, n]));
    const nodeMap2 = new Map(nodes2.map(n => [n.id, n]));

    // Compare nodes
    const changes: VersionComparisonNodeChange[] = [];
    const processedIds = new Set<string>();

    // Check nodes in version 2
    for (const [id, node2] of nodeMap2) {
      processedIds.add(id);
      const node1 = nodeMap1.get(id);

      if (!node1) {
        // Node added in v2
        changes.push({
          nodeId: id,
          nodeName: node2.name,
          nodePath: this.getNodePath(node2, nodes2),
          status: 'added',
          value2: node2.budgetValue,
        });
      } else {
        // Check for modifications
        const value1 = node1.budgetValue;
        const value2 = node2.budgetValue;

        if (value1 !== value2) {
          const diff = value2 - value1;
          const diffPercent = value1 > 0 ? (diff / value1) * 100 : 0;

          changes.push({
            nodeId: id,
            nodeName: node2.name,
            nodePath: this.getNodePath(node2, nodes2),
            status: 'modified',
            value1,
            value2,
            diff,
            diffPercent: Math.round(diffPercent * 100) / 100,
          });
        } else {
          changes.push({
            nodeId: id,
            nodeName: node2.name,
            nodePath: this.getNodePath(node2, nodes2),
            status: 'unchanged',
            value1,
            value2,
          });
        }
      }
    }

    // Check for nodes removed in v2
    for (const [id, node1] of nodeMap1) {
      if (!processedIds.has(id)) {
        changes.push({
          nodeId: id,
          nodeName: node1.name,
          nodePath: this.getNodePath(node1, nodes1),
          status: 'removed',
          value1: node1.budgetValue,
        });
      }
    }

    // Calculate summary
    const totalBudgetDiff = Number(v2.totalBudget) - Number(v1.totalBudget);
    const totalBudgetDiffPercent = Number(v1.totalBudget) > 0
      ? (totalBudgetDiff / Number(v1.totalBudget)) * 100
      : 0;

    const totalAllocatedDiff = Number(v2.totalAllocated) - Number(v1.totalAllocated);
    const totalAllocatedDiffPercent = Number(v1.totalAllocated) > 0
      ? (totalAllocatedDiff / Number(v1.totalAllocated)) * 100
      : 0;

    return {
      version1: v1,
      version2: v2,
      summary: {
        totalBudgetDiff,
        totalBudgetDiffPercent: Math.round(totalBudgetDiffPercent * 100) / 100,
        totalAllocatedDiff,
        totalAllocatedDiffPercent: Math.round(totalAllocatedDiffPercent * 100) / 100,
        nodesAdded: changes.filter(c => c.status === 'added').length,
        nodesRemoved: changes.filter(c => c.status === 'removed').length,
        nodesModified: changes.filter(c => c.status === 'modified').length,
        nodesUnchanged: changes.filter(c => c.status === 'unchanged').length,
      },
      changes,
    };
  }

  /**
   * Rollback to a previous version
   */
  async rollback(
    budgetId: string,
    versionId: string,
    data: RollbackVersionDto,
    userId: string,
  ): Promise<{ success: boolean; newVersionId?: string }> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, budgetId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const snapshotData = version.snapshotData as any[];

    // Optionally create backup of current state
    if (data.createBackup) {
      await this.createVersion(budgetId, {
        name: `Backup before rollback to v${version.versionNumber}`,
        description: data.reason || 'Automatic backup before rollback',
        tags: ['backup', 'pre-rollback'],
      }, userId);
    }

    // Delete current tree nodes
    await this.prisma.budgetTreeNode.deleteMany({
      where: { budgetId },
    });

    // Restore nodes from snapshot
    const flatNodes = this.flattenTree(snapshotData);

    // Create nodes in order (parents first)
    const nodeIdMap = new Map<string, string>(); // old id -> new id

    for (const node of flatNodes.sort((a, b) => a.level - b.level)) {
      const newNode = await this.prisma.budgetTreeNode.create({
        data: {
          budgetId,
          parentId: node.parentId ? nodeIdMap.get(node.parentId) : null,
          level: node.level,
          name: node.name,
          nodeType: node.nodeType,
          budgetValue: new Prisma.Decimal(node.budgetValue),
          allocatedValue: new Prisma.Decimal(node.allocatedValue || 0),
          percentage: new Prisma.Decimal(node.percentage || 0),
          status: node.status || 'DRAFT',
          brandId: node.brandId,
          categoryId: node.categoryId,
          subcategoryId: node.subcategoryId,
          gender: node.gender,
          sortOrder: node.sortOrder || 0,
          isLocked: node.isLocked || false,
          metadata: node.metadata || {},
        },
      });

      nodeIdMap.set(node.id, newNode.id);
    }

    // Create new version to mark the rollback
    const newVersion = await this.createVersion(budgetId, {
      name: `Rollback to v${version.versionNumber}`,
      description: data.reason || `Rolled back to version ${version.versionNumber}`,
      tags: ['rollback'],
    }, userId);

    return {
      success: true,
      newVersionId: newVersion.id,
    };
  }

  /**
   * Get current (active) version
   */
  async getCurrentVersion(budgetId: string): Promise<BudgetVersionResponse | null> {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { budgetId, status: BudgetVersionStatus.CURRENT },
      include: { changes: true },
    });

    if (!version) {
      return null;
    }

    return this.formatVersion(version);
  }

  // Helper methods

  private async getVersionByIdOrNumber(budgetId: string, idOrNumber: string): Promise<BudgetVersionResponse> {
    // Try as version number first
    const versionNumber = parseInt(idOrNumber, 10);

    if (!isNaN(versionNumber)) {
      const byNumber = await this.prisma.budgetVersion.findFirst({
        where: { budgetId, versionNumber },
        include: { changes: true },
      });
      if (byNumber) return this.formatVersion(byNumber);
    }

    // Try as ID
    const byId = await this.prisma.budgetVersion.findFirst({
      where: { id: idOrNumber, budgetId },
      include: { changes: true },
    });

    if (!byId) {
      throw new NotFoundException(`Version ${idOrNumber} not found`);
    }

    return this.formatVersion(byId);
  }

  private formatVersion(version: any): BudgetVersionResponse {
    return {
      id: version.id,
      budgetId: version.budgetId,
      versionNumber: version.versionNumber,
      name: version.name,
      description: version.description,
      status: version.status as BudgetVersionStatus,
      snapshotData: version.snapshotData,
      totalBudget: Number(version.totalBudget),
      totalAllocated: Number(version.totalAllocated),
      nodeCount: version.nodeCount,
      tags: version.tags,
      changes: version.changes?.map((c: any) => this.formatChange(c)),
      createdAt: version.createdAt,
      createdById: version.createdById,
      submittedAt: version.submittedAt,
      submittedById: version.submittedById,
      approvedAt: version.approvedAt,
      approvedById: version.approvedById,
      approvalComments: version.approvalComments,
      rejectedAt: version.rejectedAt,
      rejectedById: version.rejectedById,
      rejectionReason: version.rejectionReason,
    };
  }

  private formatChange(change: any): BudgetVersionChangeResponse {
    return {
      id: change.id,
      nodeId: change.nodeId,
      nodeName: change.nodeName,
      nodePath: change.nodePath,
      changeType: change.changeType as BudgetChangeType,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      diff: change.diff ? Number(change.diff) : undefined,
      diffPercent: change.diffPercent ? Number(change.diffPercent) : undefined,
      changedAt: change.changedAt,
    };
  }

  private calculateTotalAllocated(tree: any[]): number {
    let total = 0;

    const traverse = (nodes: any[]) => {
      for (const node of nodes) {
        // Only count leaf nodes to avoid double counting
        if (!node.children || node.children.length === 0) {
          total += node.budgetValue || 0;
        } else {
          traverse(node.children);
        }
      }
    };

    traverse(tree);
    return total;
  }

  private flattenTree(tree: any[]): any[] {
    const result: any[] = [];

    const traverse = (nodes: any[], parentId?: string) => {
      for (const node of nodes) {
        result.push({ ...node, parentId });
        if (node.children && node.children.length > 0) {
          traverse(node.children, node.id);
        }
      }
    };

    traverse(tree);
    return result;
  }

  private getNodePath(node: any, allNodes: any[]): string[] {
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

  private async detectChanges(
    budgetId: string,
    oldTree: any[],
    newTree: any[],
  ): Promise<Omit<BudgetVersionChangeResponse, 'id' | 'changedAt'>[]> {
    const changes: Omit<BudgetVersionChangeResponse, 'id' | 'changedAt'>[] = [];

    const oldNodes = this.flattenTree(oldTree);
    const newNodes = this.flattenTree(newTree);

    const oldMap = new Map(oldNodes.map(n => [n.id, n]));
    const newMap = new Map(newNodes.map(n => [n.id, n]));

    // Check for new and modified nodes
    for (const [id, newNode] of newMap) {
      const oldNode = oldMap.get(id);

      if (!oldNode) {
        changes.push({
          nodeId: id,
          nodeName: newNode.name,
          nodePath: this.getNodePath(newNode, newNodes),
          changeType: BudgetChangeType.CREATE,
          field: 'budgetValue',
          newValue: String(newNode.budgetValue),
        });
      } else if (newNode.budgetValue !== oldNode.budgetValue) {
        const diff = newNode.budgetValue - oldNode.budgetValue;
        const diffPercent = oldNode.budgetValue > 0
          ? (diff / oldNode.budgetValue) * 100
          : 0;

        changes.push({
          nodeId: id,
          nodeName: newNode.name,
          nodePath: this.getNodePath(newNode, newNodes),
          changeType: BudgetChangeType.UPDATE,
          field: 'budgetValue',
          oldValue: String(oldNode.budgetValue),
          newValue: String(newNode.budgetValue),
          diff,
          diffPercent: Math.round(diffPercent * 100) / 100,
        });
      }
    }

    // Check for deleted nodes
    for (const [id, oldNode] of oldMap) {
      if (!newMap.has(id)) {
        changes.push({
          nodeId: id,
          nodeName: oldNode.name,
          nodePath: this.getNodePath(oldNode, oldNodes),
          changeType: BudgetChangeType.DELETE,
          field: 'budgetValue',
          oldValue: String(oldNode.budgetValue),
        });
      }
    }

    return changes;
  }
}
