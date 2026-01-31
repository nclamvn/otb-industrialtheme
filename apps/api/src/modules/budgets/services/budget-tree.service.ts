import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateBudgetTreeNodeDto,
  UpdateBudgetTreeNodeDto,
  InitializeTreeDto,
  BatchUpdateNodesDto,
  BudgetNodeType,
  CardStatus,
  BudgetTreeNodeResponse,
} from '../dto/budget-tree.dto';

@Injectable()
export class BudgetTreeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get the full budget tree hierarchy
   */
  async getTree(budgetId: string) {
    // First verify budget exists
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
      include: {
        season: true,
        brand: true,
        location: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Get all nodes for this budget
    const nodes = await this.prisma.budgetTreeNode.findMany({
      where: { budgetId },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build hierarchical tree
    const tree = this.buildTree(nodes);

    return {
      budget: {
        id: budget.id,
        totalBudget: Number(budget.totalBudget),
        seasonalBudget: budget.seasonalBudget ? Number(budget.seasonalBudget) : null,
        replenishmentBudget: budget.replenishmentBudget ? Number(budget.replenishmentBudget) : null,
        status: budget.status,
        season: budget.season,
        brand: budget.brand,
        location: budget.location,
      },
      tree,
      nodeCount: nodes.length,
    };
  }

  /**
   * Get a single node by ID
   */
  async getNode(budgetId: string, nodeId: string) {
    const node = await this.prisma.budgetTreeNode.findFirst({
      where: { id: nodeId, budgetId },
      include: {
        parent: true,
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return this.formatNode(node);
  }

  /**
   * Create a new tree node
   */
  async createNode(budgetId: string, data: CreateBudgetTreeNodeDto, userId: string) {
    // Verify budget exists
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // If parentId provided, verify parent exists
    if (data.parentId) {
      const parent = await this.prisma.budgetTreeNode.findFirst({
        where: { id: data.parentId, budgetId },
      });
      if (!parent) {
        throw new BadRequestException('Parent node not found');
      }
    }

    const node = await this.prisma.budgetTreeNode.create({
      data: {
        budgetId,
        parentId: data.parentId || null,
        level: data.level,
        name: data.name,
        nodeType: data.nodeType,
        budgetValue: new Prisma.Decimal(data.budgetValue),
        allocatedValue: new Prisma.Decimal(data.allocatedValue || 0),
        percentage: new Prisma.Decimal(data.percentage || 0),
        status: data.status || CardStatus.DRAFT,
        brandId: data.brandId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        gender: data.gender,
        sortOrder: data.sortOrder || 0,
        metadata: data.metadata || {},
      },
    });

    // Update parent's allocated value if applicable
    if (data.parentId) {
      await this.recalculateParentAllocations(data.parentId);
    }

    return this.formatNode(node);
  }

  /**
   * Update a single node
   */
  async updateNode(budgetId: string, nodeId: string, data: UpdateBudgetTreeNodeDto, userId: string) {
    const node = await this.prisma.budgetTreeNode.findFirst({
      where: { id: nodeId, budgetId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    if (node.isLocked && !data.isLocked) {
      throw new BadRequestException('Cannot modify a locked node');
    }

    const updateData: Prisma.BudgetTreeNodeUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.budgetValue !== undefined) updateData.budgetValue = new Prisma.Decimal(data.budgetValue);
    if (data.allocatedValue !== undefined) updateData.allocatedValue = new Prisma.Decimal(data.allocatedValue);
    if (data.percentage !== undefined) updateData.percentage = new Prisma.Decimal(data.percentage);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updatedNode = await this.prisma.budgetTreeNode.update({
      where: { id: nodeId },
      data: updateData,
    });

    // Recalculate parent allocations if budget changed
    if (data.budgetValue !== undefined && node.parentId) {
      await this.recalculateParentAllocations(node.parentId);
    }

    // Recalculate children percentages if budget changed
    if (data.budgetValue !== undefined) {
      await this.recalculateChildrenPercentages(nodeId);
    }

    return this.formatNode(updatedNode);
  }

  /**
   * Delete a node
   */
  async deleteNode(budgetId: string, nodeId: string) {
    const node = await this.prisma.budgetTreeNode.findFirst({
      where: { id: nodeId, budgetId },
      include: { children: true },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    if (node.isLocked) {
      throw new BadRequestException('Cannot delete a locked node');
    }

    if (node.children.length > 0) {
      throw new BadRequestException('Cannot delete a node with children. Delete children first.');
    }

    const parentId = node.parentId;

    await this.prisma.budgetTreeNode.delete({
      where: { id: nodeId },
    });

    // Recalculate parent allocations
    if (parentId) {
      await this.recalculateParentAllocations(parentId);
    }

    return { deleted: true };
  }

  /**
   * Batch update multiple nodes
   */
  async batchUpdateNodes(budgetId: string, data: BatchUpdateNodesDto, userId: string) {
    const results: BudgetTreeNodeResponse[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const update of data.updates) {
        const node = await tx.budgetTreeNode.findFirst({
          where: { id: update.nodeId, budgetId },
        });

        if (!node) {
          throw new NotFoundException(`Node ${update.nodeId} not found`);
        }

        if (node.isLocked) {
          throw new BadRequestException(`Node ${update.nodeId} is locked`);
        }

        const updatedNode = await tx.budgetTreeNode.update({
          where: { id: update.nodeId },
          data: {
            budgetValue: new Prisma.Decimal(update.budgetValue),
          },
        });

        results.push(this.formatNode(updatedNode));
      }
    });

    // Recalculate all allocations after batch update
    await this.recalculateAllAllocations(budgetId);

    return results;
  }

  /**
   * Initialize tree from master data
   */
  async initializeTree(budgetId: string, options: InitializeTreeDto, userId: string) {
    const budget = await this.prisma.budgetAllocation.findUnique({
      where: { id: budgetId },
      include: {
        season: true,
        brand: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Check if tree already exists
    const existingNodes = await this.prisma.budgetTreeNode.count({
      where: { budgetId },
    });

    if (existingNodes > 0) {
      throw new BadRequestException('Tree already initialized. Delete existing nodes first.');
    }

    const totalBudget = Number(budget.totalBudget);
    const createdNodes = [];

    await this.prisma.$transaction(async (tx) => {
      // Level 0: Season root
      const rootNode = await tx.budgetTreeNode.create({
        data: {
          budgetId,
          level: 0,
          name: budget.season.name,
          nodeType: BudgetNodeType.SEASON,
          budgetValue: new Prisma.Decimal(totalBudget),
          allocatedValue: new Prisma.Decimal(0),
          percentage: new Prisma.Decimal(100),
          status: CardStatus.DRAFT,
        },
      });
      createdNodes.push(rootNode);

      // Level 1: Brand node (since budget is already for specific brand)
      if (options.includeBrands !== false) {
        const brandNode = await tx.budgetTreeNode.create({
          data: {
            budgetId,
            parentId: rootNode.id,
            level: 1,
            name: budget.brand.name,
            nodeType: BudgetNodeType.BRAND,
            brandId: budget.brandId,
            budgetValue: new Prisma.Decimal(totalBudget),
            allocatedValue: new Prisma.Decimal(0),
            percentage: new Prisma.Decimal(100),
            status: CardStatus.DRAFT,
          },
        });
        createdNodes.push(brandNode);

        // Level 2: Gender breakdown
        if (options.includeGenders !== false) {
          const genders = ['MEN', 'WOMEN', 'KIDS'] as const;
          const genderPercentages = options.defaultPercentages?.gender || { MEN: 40, WOMEN: 45, KIDS: 15 };

          for (let i = 0; i < genders.length; i++) {
            const gender = genders[i];
            const percentage = (genderPercentages as Record<string, number>)[gender] || 33.33;
            const genderBudget = totalBudget * (percentage / 100);

            const genderNode = await tx.budgetTreeNode.create({
              data: {
                budgetId,
                parentId: brandNode.id,
                level: 2,
                name: gender,
                nodeType: BudgetNodeType.GENDER,
                gender: gender as any,
                budgetValue: new Prisma.Decimal(genderBudget),
                allocatedValue: new Prisma.Decimal(0),
                percentage: new Prisma.Decimal(percentage),
                status: CardStatus.DRAFT,
                sortOrder: i,
              },
            });
            createdNodes.push(genderNode);

            // Level 3: Categories
            if (options.includeCategories !== false) {
              const categories = await tx.category.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              });

              const categoryPercentage = 100 / categories.length;

              for (let j = 0; j < categories.length; j++) {
                const category = categories[j];
                const categoryBudget = genderBudget * (categoryPercentage / 100);

                const categoryNode = await tx.budgetTreeNode.create({
                  data: {
                    budgetId,
                    parentId: genderNode.id,
                    level: 3,
                    name: category.name,
                    nodeType: BudgetNodeType.CATEGORY,
                    categoryId: category.id,
                    budgetValue: new Prisma.Decimal(categoryBudget),
                    allocatedValue: new Prisma.Decimal(0),
                    percentage: new Prisma.Decimal(categoryPercentage),
                    status: CardStatus.DRAFT,
                    sortOrder: j,
                  },
                });
                createdNodes.push(categoryNode);

                // Level 4: Subcategories
                if (options.includeSubcategories !== false) {
                  const subcategories = await tx.subcategory.findMany({
                    where: { categoryId: category.id, isActive: true },
                    orderBy: { sortOrder: 'asc' },
                  });

                  const subcategoryPercentage = subcategories.length > 0 ? 100 / subcategories.length : 0;

                  for (let k = 0; k < subcategories.length; k++) {
                    const subcategory = subcategories[k];
                    const subcategoryBudget = categoryBudget * (subcategoryPercentage / 100);

                    const subcategoryNode = await tx.budgetTreeNode.create({
                      data: {
                        budgetId,
                        parentId: categoryNode.id,
                        level: 4,
                        name: subcategory.name,
                        nodeType: BudgetNodeType.SUBCATEGORY,
                        subcategoryId: subcategory.id,
                        budgetValue: new Prisma.Decimal(subcategoryBudget),
                        allocatedValue: new Prisma.Decimal(0),
                        percentage: new Prisma.Decimal(subcategoryPercentage),
                        status: CardStatus.DRAFT,
                        sortOrder: k,
                      },
                    });
                    createdNodes.push(subcategoryNode);
                  }
                }
              }
            }
          }
        }
      }
    });

    // Recalculate all allocations
    await this.recalculateAllAllocations(budgetId);

    return {
      message: 'Tree initialized successfully',
      nodeCount: createdNodes.length,
    };
  }

  /**
   * Helper: Build hierarchical tree from flat nodes
   */
  private buildTree(nodes: any[]): any[] {
    const nodeMap = new Map();
    const roots: any[] = [];

    // First pass: create map of all nodes
    for (const node of nodes) {
      nodeMap.set(node.id, {
        ...this.formatNode(node),
        children: [],
      });
    }

    // Second pass: build hierarchy
    for (const node of nodes) {
      const formattedNode = nodeMap.get(node.id);
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(formattedNode);
        }
      } else {
        roots.push(formattedNode);
      }
    }

    return roots;
  }

  /**
   * Helper: Format node for response
   */
  private formatNode(node: any) {
    return {
      id: node.id,
      budgetId: node.budgetId,
      parentId: node.parentId,
      level: node.level,
      name: node.name,
      nodeType: node.nodeType,
      budgetValue: Number(node.budgetValue),
      allocatedValue: Number(node.allocatedValue),
      percentage: Number(node.percentage),
      status: node.status,
      brandId: node.brandId,
      categoryId: node.categoryId,
      subcategoryId: node.subcategoryId,
      gender: node.gender,
      sortOrder: node.sortOrder,
      isLocked: node.isLocked,
      metadata: node.metadata,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }

  /**
   * Helper: Recalculate parent's allocated value based on children
   */
  private async recalculateParentAllocations(parentId: string) {
    const children = await this.prisma.budgetTreeNode.findMany({
      where: { parentId },
    });

    const totalAllocated = children.reduce(
      (sum, child) => sum + Number(child.budgetValue),
      0
    );

    await this.prisma.budgetTreeNode.update({
      where: { id: parentId },
      data: { allocatedValue: new Prisma.Decimal(totalAllocated) },
    });

    // Recursively update parent's parent
    const parent = await this.prisma.budgetTreeNode.findUnique({
      where: { id: parentId },
    });

    if (parent?.parentId) {
      await this.recalculateParentAllocations(parent.parentId);
    }
  }

  /**
   * Helper: Recalculate children percentages based on parent budget
   */
  private async recalculateChildrenPercentages(parentId: string) {
    const parent = await this.prisma.budgetTreeNode.findUnique({
      where: { id: parentId },
    });

    if (!parent) return;

    const children = await this.prisma.budgetTreeNode.findMany({
      where: { parentId },
    });

    const parentBudget = Number(parent.budgetValue);

    for (const child of children) {
      const percentage = parentBudget > 0
        ? (Number(child.budgetValue) / parentBudget) * 100
        : 0;

      await this.prisma.budgetTreeNode.update({
        where: { id: child.id },
        data: { percentage: new Prisma.Decimal(percentage) },
      });
    }
  }

  /**
   * Helper: Recalculate all allocations in the tree
   */
  private async recalculateAllAllocations(budgetId: string) {
    // Get all nodes ordered by level descending (leaves first)
    const nodes = await this.prisma.budgetTreeNode.findMany({
      where: { budgetId },
      orderBy: { level: 'desc' },
    });

    // Process from leaves to root
    for (const node of nodes) {
      const children = await this.prisma.budgetTreeNode.findMany({
        where: { parentId: node.id },
      });

      if (children.length > 0) {
        const totalAllocated = children.reduce(
          (sum, child) => sum + Number(child.budgetValue),
          0
        );

        await this.prisma.budgetTreeNode.update({
          where: { id: node.id },
          data: { allocatedValue: new Prisma.Decimal(totalAllocated) },
        });
      }

      // Update percentage relative to parent
      if (node.parentId) {
        const parent = await this.prisma.budgetTreeNode.findUnique({
          where: { id: node.parentId },
        });

        if (parent) {
          const parentBudget = Number(parent.budgetValue);
          const percentage = parentBudget > 0
            ? (Number(node.budgetValue) / parentBudget) * 100
            : 0;

          await this.prisma.budgetTreeNode.update({
            where: { id: node.id },
            data: { percentage: new Prisma.Decimal(percentage) },
          });
        }
      }
    }
  }
}
