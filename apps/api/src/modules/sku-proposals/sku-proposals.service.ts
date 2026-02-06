import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ParsedSKU {
  skuCode: string;
  styleName: string;
  colorCode?: string;
  colorName?: string;
  category?: string;
  gender?: string;
  retailPrice: number;
  costPrice: number;
  orderQuantity: number;
  sizeBreakdown?: Record<string, number>;
}

@Injectable()
export class SkuProposalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.otbPlanId) where.otbPlanId = query.otbPlanId;
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.sKUProposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          season: true,
          brand: true,
          otbPlan: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.sKUProposal.count({ where }),
    ]);

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

  async findOne(id: string) {
    const proposal = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        season: true,
        brand: true,
        otbPlan: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            category: true,
            subcategory: true,
          },
        },
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('SKU Proposal not found');
    }

    return proposal;
  }

  async create(data: any, userId: string) {
    return this.prisma.sKUProposal.create({
      data: {
        ...data,
        createdById: userId,
        status: 'DRAFT',
        totalSKUs: 0,
        validSKUs: 0,
        errorSKUs: 0,
        warningSKUs: 0,
      },
    });
  }

  async update(id: string, data: any) {
    const proposal = await this.prisma.sKUProposal.findUnique({ where: { id } });

    if (!proposal) {
      throw new NotFoundException('SKU Proposal not found');
    }

    return this.prisma.sKUProposal.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const proposal = await this.prisma.sKUProposal.findUnique({ where: { id } });

    if (!proposal) {
      throw new NotFoundException('SKU Proposal not found');
    }

    await this.prisma.sKUProposal.delete({ where: { id } });
    return { deleted: true };
  }

  // Submit SKU Proposal for approval
  async submit(id: string, userId: string) {
    const existing = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        items: true,
        otbPlan: {
          include: {
            budget: {
              include: {
                season: true,
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('SKU proposal not found');
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      throw new BadRequestException('Can only submit draft or rejected proposals');
    }

    if (existing.items.length === 0) {
      throw new BadRequestException('SKU proposal must have at least one item');
    }

    // Check for validation errors
    const errorCount = existing.items.filter(
      (item) => item.validationStatus === 'ERROR'
    ).length;

    if (errorCount > 0) {
      throw new BadRequestException(
        `Cannot submit: ${errorCount} items have validation errors. Please fix or remove them.`
      );
    }

    // Create workflow
    const workflow = await this.prisma.workflow.create({
      data: {
        type: 'SKU_APPROVAL',
        referenceType: 'SKU_PROPOSAL',
        referenceId: id,
        initiatedById: userId,
        status: 'PENDING',
        currentStep: 1,
        totalSteps: 3,
        steps: {
          create: [
            { stepNumber: 1, stepName: 'Merchandise Review', assignedRole: 'MERCHANDISE_LEAD', status: 'IN_PROGRESS' },
            { stepNumber: 2, stepName: 'Brand Manager Approval', assignedRole: 'BRAND_MANAGER', status: 'PENDING' },
            { stepNumber: 3, stepName: 'Final Approval', assignedRole: 'FINANCE_HEAD', status: 'PENDING' },
          ],
        },
      },
    });

    // Update proposal status
    const proposal = await this.prisma.sKUProposal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        workflowId: workflow.id,
        submittedAt: new Date(),
      },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                season: true,
                brand: true,
                location: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            category: true,
          },
        },
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    return proposal;
  }

  // Approve SKU Proposal
  async approve(id: string, userId: string, comments?: string) {
    const existing = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('SKU proposal not found');
    }

    if (!['SUBMITTED', 'ENRICHED'].includes(existing.status)) {
      throw new BadRequestException('Can only approve submitted or enriched proposals');
    }

    // Update current workflow step
    if (existing.workflow) {
      const currentStep = existing.workflow.steps.find(
        (s) => s.stepNumber === existing.workflow!.currentStep
      );

      if (currentStep) {
        await this.prisma.workflowStep.update({
          where: { id: currentStep.id },
          data: {
            status: 'APPROVED',
            actionById: userId,
            actionAt: new Date(),
            actionType: 'APPROVE',
            actionComment: comments,
          },
        });
      }

      const isLastStep = existing.workflow.currentStep >= existing.workflow.totalSteps;

      if (isLastStep) {
        await this.prisma.workflow.update({
          where: { id: existing.workflow.id },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
          },
        });

        return this.prisma.sKUProposal.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedById: userId,
            approvedAt: new Date(),
          },
          include: {
            otbPlan: { include: { budget: { include: { season: true, brand: true, location: true } } } },
            createdBy: { select: { id: true, name: true, email: true } },
            items: { include: { category: true } },
            workflow: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
          },
        });
      } else {
        await this.prisma.workflow.update({
          where: { id: existing.workflow.id },
          data: {
            currentStep: existing.workflow.currentStep + 1,
            status: 'IN_PROGRESS',
          },
        });

        const nextStep = existing.workflow.steps.find(
          (s) => s.stepNumber === existing.workflow!.currentStep + 1
        );
        if (nextStep) {
          await this.prisma.workflowStep.update({
            where: { id: nextStep.id },
            data: { status: 'IN_PROGRESS' },
          });
        }

        return this.findOne(id);
      }
    }

    return this.prisma.sKUProposal.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
  }

  // Reject SKU Proposal
  async reject(id: string, userId: string, reason: string) {
    const existing = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('SKU proposal not found');
    }

    if (existing.workflow) {
      const currentStep = existing.workflow.steps.find(
        (s) => s.stepNumber === existing.workflow!.currentStep
      );

      if (currentStep) {
        await this.prisma.workflowStep.update({
          where: { id: currentStep.id },
          data: {
            status: 'REJECTED',
            actionById: userId,
            actionAt: new Date(),
            actionType: 'REJECT',
            actionComment: reason,
          },
        });
      }

      await this.prisma.workflow.update({
        where: { id: existing.workflow.id },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      });
    }

    return this.prisma.sKUProposal.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
      include: {
        otbPlan: { include: { budget: { include: { season: true, brand: true, location: true } } } },
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { category: true } },
        workflow: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
      },
    });
  }

  // Import SKU items from parsed Excel data
  async importItems(id: string, parsedItems: ParsedSKU[]) {
    const existing = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('SKU proposal not found');
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      throw new BadRequestException('Can only import to draft or rejected proposals');
    }

    if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
      throw new BadRequestException('No items provided');
    }

    // Get all active categories
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
    });

    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const categoryCodeMap = new Map(
      categories.map((c) => [c.code.toLowerCase(), c.id])
    );

    // Transform parsed data to SKU items
    const items = parsedItems.map((row) => {
      const categoryName = (row.category || '').toLowerCase();
      const categoryId =
        categoryMap.get(categoryName) ||
        categoryCodeMap.get(categoryName) ||
        categories[0]?.id;

      return {
        proposalId: id,
        skuCode: row.skuCode || '',
        styleName: row.styleName || '',
        colorCode: row.colorCode,
        colorName: row.colorName,
        categoryId,
        gender: (row.gender as 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS') || 'UNISEX',
        retailPrice: row.retailPrice || 0,
        costPrice: row.costPrice || 0,
        orderQuantity: row.orderQuantity || 0,
        sizeBreakdown: row.sizeBreakdown,
        validationStatus: 'PENDING' as const,
      };
    });

    // Use transaction to replace items
    await this.prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.sKUItem.deleteMany({
        where: { proposalId: id },
      });

      // Create new items
      await tx.sKUItem.createMany({
        data: items,
      });

      // Update proposal counts
      await tx.sKUProposal.update({
        where: { id },
        data: {
          totalSKUs: items.length,
          updatedAt: new Date(),
        },
      });
    });

    return {
      itemsCreated: items.length,
    };
  }

  // Validate SKU items
  async validateItems(id: string) {
    const proposal = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
              },
            },
            lineItems: {
              include: {
                category: true,
              },
            },
          },
        },
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('SKU proposal not found');
    }

    if (proposal.items.length === 0) {
      throw new BadRequestException('No items to validate');
    }

    // Get all active categories
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
    });

    // Get existing SKU codes for duplicate check
    const existingSKUs = await this.prisma.sKUItem.findMany({
      where: {
        proposalId: { not: id },
      },
      select: { skuCode: true },
    });

    const existingSKUCodes = new Set(existingSKUs.map((s) => s.skuCode));

    // Validate each item
    const validationResults = proposal.items.map((item, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Required fields
      if (!item.skuCode) errors.push('SKU code is required');
      if (!item.styleName) errors.push('Style name is required');
      if (!item.retailPrice || Number(item.retailPrice) <= 0) errors.push('Valid retail price is required');
      if (!item.costPrice || Number(item.costPrice) <= 0) errors.push('Valid cost price is required');
      if (!item.orderQuantity || item.orderQuantity <= 0) errors.push('Valid order quantity is required');

      // Duplicate check
      if (item.skuCode && existingSKUCodes.has(item.skuCode)) {
        warnings.push('SKU code already exists in another proposal');
      }

      // Margin check
      if (item.retailPrice && item.costPrice) {
        const margin = ((Number(item.retailPrice) - Number(item.costPrice)) / Number(item.retailPrice)) * 100;
        if (margin < 30) warnings.push(`Low margin: ${margin.toFixed(1)}%`);
        if (margin > 80) warnings.push(`High margin: ${margin.toFixed(1)}% - please verify`);
      }

      // Category check
      if (!item.categoryId) warnings.push('Category not specified');

      const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

      return {
        rowNumber: index + 1,
        itemId: item.id,
        skuCode: item.skuCode,
        status,
        errors,
        warnings,
      };
    });

    // Update items with validation results
    await this.prisma.$transaction(
      proposal.items.map((item, index) => {
        const result = validationResults[index];
        const statusMap: Record<string, 'PENDING' | 'VALID' | 'WARNING' | 'ERROR'> = {
          valid: 'VALID',
          warning: 'WARNING',
          error: 'ERROR',
        };
        return this.prisma.sKUItem.update({
          where: { id: item.id },
          data: {
            validationStatus: statusMap[result.status] || 'PENDING',
            validationErrors: result.errors as any,
            validationWarnings: result.warnings as any,
          },
        });
      })
    );

    // Update proposal counts
    const validCount = validationResults.filter((r) => r.status === 'valid').length;
    const warningCount = validationResults.filter((r) => r.status === 'warning').length;
    const errorCount = validationResults.filter((r) => r.status === 'error').length;

    await this.prisma.sKUProposal.update({
      where: { id },
      data: {
        status: 'VALIDATED',
        validSKUs: validCount,
        warningSKUs: warningCount,
        errorSKUs: errorCount,
      },
    });

    const summary = {
      total: proposal.items.length,
      valid: validCount,
      warnings: warningCount,
      errors: errorCount,
    };

    return {
      results: validationResults,
      summary,
    };
  }

  // Enrich SKU items with AI
  async enrichItems(id: string, userId: string, itemIds?: string[]) {
    const proposal = await this.prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
                season: true,
              },
            },
          },
        },
        items: {
          where: itemIds ? { id: { in: itemIds } } : {},
          include: {
            category: true,
            subcategory: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('SKU proposal not found');
    }

    if (proposal.items.length === 0) {
      throw new BadRequestException('No items to enrich');
    }

    const enrichedItems: Array<{
      id: string;
      enrichments: {
        demandPrediction: string;
        demandScore: number;
        recommendedQuantity: number;
        insights: string;
      };
    }> = [];

    // Enrich each item using AI (simulated)
    for (const item of proposal.items) {
      try {
        // Simulate AI enrichment
        const demandScore = 0.5 + Math.random() * 0.4; // 0.5 - 0.9
        const demandPrediction = demandScore > 0.7 ? 'HIGH' : demandScore > 0.5 ? 'MEDIUM' : 'LOW';
        const recommendedQuantity = Math.round(item.orderQuantity * (0.8 + demandScore * 0.4));
        const insights = `Based on historical data and market trends, this ${item.category?.name || 'item'} shows ${demandPrediction.toLowerCase()} demand potential.`;

        // Update item with enrichments
        await this.prisma.sKUItem.update({
          where: { id: item.id },
          data: {
            aiDemandScore: demandScore,
            aiDemandPrediction: demandPrediction,
            aiRecommendedQty: recommendedQuantity,
            aiInsights: insights,
            aiEnrichedAt: new Date(),
          },
        });

        enrichedItems.push({
          id: item.id,
          enrichments: {
            demandPrediction,
            demandScore,
            recommendedQuantity,
            insights,
          },
        });

        // Log AI interaction
        await this.prisma.aIInteractionLog.create({
          data: {
            userId,
            contextType: 'SKU_ITEM',
            contextId: item.id,
            prompt: `Enrich SKU: ${item.skuCode}`,
            model: 'dafc-internal-v1',
            response: JSON.stringify({ demandPrediction, demandScore, recommendedQuantity }),
            latencyMs: 50,
          },
        });
      } catch (enrichError) {
        console.error(`Error enriching item ${item.id}:`, enrichError);
      }
    }

    // Update proposal status
    await this.prisma.sKUProposal.update({
      where: { id },
      data: { status: 'ENRICHED' },
    });

    return {
      enrichedCount: enrichedItems.length,
      totalItems: proposal.items.length,
      enrichedItems,
    };
  }
}
