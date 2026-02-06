import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtbPlansService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.seasonId) where.seasonId = query.seasonId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.budgetId) where.budgetId = query.budgetId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.oTBPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          season: true,
          brand: true,
          budget: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.oTBPlan.count({ where }),
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
    const plan = await this.prisma.oTBPlan.findUnique({
      where: { id },
      include: {
        season: true,
        brand: true,
        budget: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        lineItems: {
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

    if (!plan) {
      throw new NotFoundException('OTB Plan not found');
    }

    return plan;
  }

  async create(data: any, userId: string) {
    return this.prisma.oTBPlan.create({
      data: {
        ...data,
        createdById: userId,
        status: 'DRAFT',
        version: 1,
        versionType: 'V0_SYSTEM',
        totalOTBValue: 0,
        totalSKUCount: 0,
      },
    });
  }

  async update(id: string, data: any) {
    const plan = await this.prisma.oTBPlan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('OTB Plan not found');
    }

    return this.prisma.oTBPlan.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const plan = await this.prisma.oTBPlan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('OTB Plan not found');
    }

    await this.prisma.oTBPlan.delete({ where: { id } });
    return { deleted: true };
  }

  // Submit OTB Plan for approval
  async submit(id: string, userId: string) {
    const existing = await this.prisma.oTBPlan.findUnique({
      where: { id },
      include: {
        lineItems: true,
        budget: {
          include: {
            season: true,
            brand: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('OTB plan not found');
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      throw new BadRequestException('Can only submit draft or rejected plans');
    }

    if (existing.lineItems.length === 0) {
      throw new BadRequestException('OTB plan must have at least one line item');
    }

    // Calculate total buy value
    const totalPlannedAmount = existing.lineItems.reduce(
      (sum, item) => sum + Number(item.userBuyValue),
      0
    );

    // Validate against budget
    if (totalPlannedAmount > Number(existing.budget.totalBudget)) {
      throw new BadRequestException(
        `Total planned amount ($${totalPlannedAmount.toLocaleString()}) exceeds budget ($${Number(existing.budget.totalBudget).toLocaleString()})`
      );
    }

    // Create workflow
    const workflow = await this.prisma.workflow.create({
      data: {
        type: 'OTB_APPROVAL',
        referenceType: 'OTB_PLAN',
        referenceId: id,
        initiatedById: userId,
        status: 'PENDING',
        currentStep: 1,
        totalSteps: 3,
        steps: {
          create: [
            { stepNumber: 1, stepName: 'Brand Manager Review', assignedRole: 'BRAND_MANAGER', status: 'IN_PROGRESS' },
            { stepNumber: 2, stepName: 'Finance Review', assignedRole: 'FINANCE_HEAD', status: 'PENDING' },
            { stepNumber: 3, stepName: 'BOD Approval', assignedRole: 'BOD_MEMBER', status: 'PENDING' },
          ],
        },
      },
    });

    // Update plan status
    const plan = await this.prisma.oTBPlan.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        workflowId: workflow.id,
        submittedAt: new Date(),
      },
      include: {
        budget: {
          include: {
            season: true,
            brand: true,
            location: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        lineItems: {
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

    return plan;
  }

  // Approve OTB Plan
  async approve(id: string, userId: string, comments?: string) {
    const existing = await this.prisma.oTBPlan.findUnique({
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
      throw new NotFoundException('OTB plan not found');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      throw new BadRequestException('Can only approve submitted or under review plans');
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

      // Check if all steps are complete
      const isLastStep = existing.workflow.currentStep >= existing.workflow.totalSteps;

      if (isLastStep) {
        // Complete workflow
        await this.prisma.workflow.update({
          where: { id: existing.workflow.id },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
          },
        });

        // Update plan to approved
        return this.prisma.oTBPlan.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedById: userId,
            approvedAt: new Date(),
          },
          include: {
            budget: { include: { season: true, brand: true, location: true } },
            createdBy: { select: { id: true, name: true, email: true } },
            lineItems: { include: { category: true } },
            workflow: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
          },
        });
      } else {
        // Move to next step
        await this.prisma.workflow.update({
          where: { id: existing.workflow.id },
          data: {
            currentStep: existing.workflow.currentStep + 1,
            status: 'IN_PROGRESS',
          },
        });

        // Mark next step as in progress
        const nextStep = existing.workflow.steps.find(
          (s) => s.stepNumber === existing.workflow!.currentStep + 1
        );
        if (nextStep) {
          await this.prisma.workflowStep.update({
            where: { id: nextStep.id },
            data: { status: 'IN_PROGRESS' },
          });
        }

        return this.prisma.oTBPlan.update({
          where: { id },
          data: { status: 'UNDER_REVIEW' },
          include: {
            budget: { include: { season: true, brand: true, location: true } },
            createdBy: { select: { id: true, name: true, email: true } },
            lineItems: { include: { category: true } },
            workflow: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
          },
        });
      }
    }

    // No workflow, just approve directly
    return this.prisma.oTBPlan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
  }

  // Reject OTB Plan
  async reject(id: string, userId: string, reason: string) {
    const existing = await this.prisma.oTBPlan.findUnique({
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
      throw new NotFoundException('OTB plan not found');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      throw new BadRequestException('Can only reject submitted or under review plans');
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
            status: 'REJECTED',
            actionById: userId,
            actionAt: new Date(),
            actionType: 'REJECT',
            actionComment: reason,
          },
        });
      }

      // Complete workflow as rejected
      await this.prisma.workflow.update({
        where: { id: existing.workflow.id },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      });
    }

    return this.prisma.oTBPlan.update({
      where: { id },
      data: {
        status: 'REJECTED',
        comments: reason,
      },
      include: {
        budget: { include: { season: true, brand: true, location: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        lineItems: { include: { category: true } },
        workflow: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
      },
    });
  }

  // Get sizing data for OTB plan
  async getSizing(id: string) {
    const plan = await this.prisma.oTBPlan.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            category: true,
          },
        },
        sizingAnalysis: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('OTB plan not found');
    }

    // Map sizing analysis by category and gender for easier lookup
    const sizingMap = new Map(
      plan.sizingAnalysis.map((sa) => [`${sa.categoryId}-${sa.gender}`, sa])
    );

    const sizingData = plan.lineItems.map((item) => {
      const sizing = item.categoryId && item.gender
        ? sizingMap.get(`${item.categoryId}-${item.gender}`)
        : null;

      return {
        lineItemId: item.id,
        category: item.category?.name ?? 'Unknown',
        gender: item.gender,
        userUnits: item.userUnits,
        sizing: sizing
          ? {
              id: sizing.id,
              sizeData: sizing.sizeData as Record<string, number>,
              aiInsight: sizing.aiInsight,
              aiRecommendation: sizing.aiRecommendation,
            }
          : null,
      };
    });

    return sizingData;
  }

  // Save sizing data for OTB plan
  async saveSizing(id: string, data: { categoryId: string; gender: string; sizeData: Record<string, number> }) {
    const { categoryId, gender, sizeData } = data;

    // Verify plan exists
    const plan = await this.prisma.oTBPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('OTB plan not found');
    }

    // Validate size data sums to 100%
    const total = Object.values(sizeData).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Size data must sum to 100%');
    }

    // Check for existing sizing analysis for this plan/category/gender combination
    const existing = await this.prisma.sizingAnalysis.findFirst({
      where: {
        otbPlanId: id,
        categoryId,
        gender: gender as any,
      },
    });

    if (existing) {
      return this.prisma.sizingAnalysis.update({
        where: { id: existing.id },
        data: {
          sizeData,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.sizingAnalysis.create({
      data: {
        otbPlanId: id,
        categoryId,
        gender: gender as any,
        sizeData,
      },
    });
  }

  // Generate AI proposal for OTB plan
  async generateAIProposal(id: string, userId: string) {
    const plan = await this.prisma.oTBPlan.findUnique({
      where: { id },
      include: {
        budget: {
          include: {
            season: true,
            brand: true,
            location: true,
          },
        },
        lineItems: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('OTB plan not found');
    }

    // Get categories
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get historical data (previous season OTB plans)
    const historicalPlans = await this.prisma.oTBPlan.findMany({
      where: {
        budget: {
          brandId: plan.budget.brandId,
          seasonId: { not: plan.budget.seasonId },
        },
        status: 'APPROVED',
      },
      include: {
        budget: {
          include: { season: true },
        },
        lineItems: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Prepare historical data for AI
    const historicalData = historicalPlans.map((hp) => ({
      season: hp.budget.season.code,
      totalBudget: Number(hp.budget.totalBudget),
      lineItems: hp.lineItems.map((li) => ({
        category: li.category?.name ?? 'Unknown',
        gender: li.gender,
        units: li.userUnits,
        buyValue: Number(li.userBuyValue),
        buyPct: Number(li.userBuyPct),
      })),
    }));

    // Generate AI proposal based on historical data
    const totalBudget = Number(plan.budget.totalBudget);
    const proposals = categories.map((category) => {
      // Find historical data for this category
      const categoryHistory = historicalData.flatMap((hp) =>
        hp.lineItems.filter((li) => li.category === category.name)
      );

      // Calculate average percentage from history
      const avgPct = categoryHistory.length > 0
        ? categoryHistory.reduce((sum, li) => sum + Number(li.buyPct), 0) / categoryHistory.length
        : 100 / categories.length;

      const proposedValue = (avgPct / 100) * totalBudget;
      const confidence = categoryHistory.length > 0 ? 0.7 + (categoryHistory.length * 0.1) : 0.5;

      return {
        categoryId: category.id,
        categoryName: category.name,
        historicalPct: avgPct,
        proposedPct: avgPct,
        proposedValue: Math.round(proposedValue),
        confidence: Math.min(confidence, 0.95),
        reasoning: categoryHistory.length > 0
          ? `Based on ${categoryHistory.length} historical season(s) with average allocation of ${avgPct.toFixed(1)}%`
          : 'No historical data available, using equal distribution',
      };
    });

    // Log AI interaction
    await this.prisma.aIInteractionLog.create({
      data: {
        userId,
        contextType: 'OTB_PLAN',
        contextId: id,
        prompt: `Generate OTB proposal for budget ${totalBudget}`,
        model: 'dafc-internal-v1',
        response: JSON.stringify({ proposals }),
        latencyMs: 100,
      },
    });

    return {
      proposals,
      overallConfidence: proposals.reduce((sum, p) => sum + p.confidence, 0) / proposals.length,
      executiveSummary: `AI-generated proposal for ${plan.budget.brand.name} ${plan.budget.season.code} season with total budget of $${totalBudget.toLocaleString()}. Based on analysis of ${historicalPlans.length} historical season(s).`,
    };
  }
}
