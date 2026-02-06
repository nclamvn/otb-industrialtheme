import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  // Get all pending approvals
  async getApprovals(query: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, status, page = 1, limit = 20 } = query;

    const where: any = {};
    if (status === 'completed') {
      where.status = 'APPROVED';
    } else {
      where.status = { in: ['PENDING', 'IN_PROGRESS'] };
    }

    if (type) {
      const typeMap: Record<string, string> = {
        budget: 'BUDGET_APPROVAL',
        otb: 'OTB_APPROVAL',
        sku: 'SKU_APPROVAL',
      };
      where.type = typeMap[type] || type;
    }

    const [workflows, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        include: {
          steps: {
            include: {
              actionBy: { select: { id: true, name: true } },
            },
            orderBy: { stepNumber: 'asc' },
          },
          initiatedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.workflow.count({ where }),
    ]);

    // Enrich workflows with entity details
    const enrichedWorkflows = await Promise.all(
      workflows.map(async (workflow) => {
        let entityDetails = null;

        if (workflow.referenceType === 'BUDGET') {
          entityDetails = await this.prisma.budgetAllocation.findUnique({
            where: { id: workflow.referenceId },
            include: {
              season: true,
              brand: true,
              location: true,
            },
          });
        } else if (workflow.referenceType === 'OTB_PLAN') {
          entityDetails = await this.prisma.oTBPlan.findUnique({
            where: { id: workflow.referenceId },
            include: {
              budget: {
                include: {
                  season: true,
                  brand: true,
                  location: true,
                },
              },
            },
          });
        } else if (workflow.referenceType === 'SKU_PROPOSAL') {
          entityDetails = await this.prisma.sKUProposal.findUnique({
            where: { id: workflow.referenceId },
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
            },
          });
        }

        const currentStep = workflow.steps.find(
          (s) => s.stepNumber === workflow.currentStep
        );

        return {
          ...workflow,
          entityType: workflow.referenceType,
          entityId: workflow.referenceId,
          entityDetails,
          currentStepDetails: currentStep,
        };
      })
    );

    // Group by type for summary
    const allWorkflows = await this.prisma.workflow.findMany({
      where: status === 'completed' ? { status: 'APPROVED' } : { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      select: { type: true },
    });

    const summary = {
      budget: allWorkflows.filter((w) => w.type === 'BUDGET_APPROVAL').length,
      otb: allWorkflows.filter((w) => w.type === 'OTB_APPROVAL').length,
      sku: allWorkflows.filter((w) => w.type === 'SKU_APPROVAL').length,
      total: allWorkflows.length,
    };

    return {
      data: enrichedWorkflows,
      summary,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get workflow by ID
  async getWorkflow(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            actionBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { stepNumber: 'asc' },
        },
        initiatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  // Get my pending approvals (assigned to me)
  async getMyPendingApprovals(userId: string, userRole: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        steps: {
          some: {
            status: 'IN_PROGRESS',
            OR: [
              { assignedUserId: userId },
              { assignedRole: userRole as any },
            ],
          },
        },
      },
      include: {
        steps: {
          include: {
            actionBy: { select: { id: true, name: true } },
          },
          orderBy: { stepNumber: 'asc' },
        },
        initiatedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with entity details
    const enrichedWorkflows = await Promise.all(
      workflows.map(async (workflow) => {
        let entityDetails = null;

        if (workflow.referenceType === 'BUDGET') {
          entityDetails = await this.prisma.budgetAllocation.findUnique({
            where: { id: workflow.referenceId },
            include: { season: true, brand: true, location: true },
          });
        } else if (workflow.referenceType === 'OTB_PLAN') {
          entityDetails = await this.prisma.oTBPlan.findUnique({
            where: { id: workflow.referenceId },
            include: { budget: { include: { season: true, brand: true, location: true } } },
          });
        } else if (workflow.referenceType === 'SKU_PROPOSAL') {
          entityDetails = await this.prisma.sKUProposal.findUnique({
            where: { id: workflow.referenceId },
            include: { otbPlan: { include: { budget: { include: { season: true, brand: true, location: true } } } } },
          });
        }

        const currentStep = workflow.steps.find((s) => s.stepNumber === workflow.currentStep);

        return {
          ...workflow,
          entityType: workflow.referenceType,
          entityId: workflow.referenceId,
          entityDetails,
          currentStepDetails: currentStep,
        };
      })
    );

    return enrichedWorkflows;
  }

  // Action on workflow step (approve/reject)
  async actionWorkflowStep(
    workflowId: string,
    userId: string,
    action: 'APPROVE' | 'REJECT',
    comment?: string,
  ) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const currentStep = workflow.steps.find(
      (s) => s.stepNumber === workflow.currentStep
    );

    if (!currentStep) {
      throw new NotFoundException('Current workflow step not found');
    }

    // Update current step
    await this.prisma.workflowStep.update({
      where: { id: currentStep.id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        actionById: userId,
        actionAt: new Date(),
        actionType: action,
        actionComment: comment,
      },
    });

    if (action === 'REJECT') {
      // Workflow rejected
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      });

      // Update referenced entity status
      await this.updateEntityStatus(workflow.referenceType, workflow.referenceId, 'REJECTED');
    } else {
      // Check if this is the last step
      const isLastStep = workflow.currentStep >= workflow.totalSteps;

      if (isLastStep) {
        // Workflow approved
        await this.prisma.workflow.update({
          where: { id: workflowId },
          data: {
            status: 'APPROVED',
            completedAt: new Date(),
          },
        });

        // Update referenced entity status
        await this.updateEntityStatus(workflow.referenceType, workflow.referenceId, 'APPROVED', userId);
      } else {
        // Move to next step
        await this.prisma.workflow.update({
          where: { id: workflowId },
          data: {
            currentStep: workflow.currentStep + 1,
            status: 'IN_PROGRESS',
          },
        });

        // Activate next step
        const nextStep = workflow.steps.find(
          (s) => s.stepNumber === workflow.currentStep + 1
        );
        if (nextStep) {
          await this.prisma.workflowStep.update({
            where: { id: nextStep.id },
            data: { status: 'IN_PROGRESS' },
          });
        }
      }
    }

    return this.getWorkflow(workflowId);
  }

  // Helper to update entity status
  private async updateEntityStatus(
    entityType: string,
    entityId: string,
    status: 'APPROVED' | 'REJECTED',
    approvedById?: string,
  ) {
    const updateData: any = { status };
    if (status === 'APPROVED' && approvedById) {
      updateData.approvedById = approvedById;
      updateData.approvedAt = new Date();
    }

    switch (entityType) {
      case 'BUDGET':
        await this.prisma.budgetAllocation.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case 'OTB_PLAN':
        await this.prisma.oTBPlan.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case 'SKU_PROPOSAL':
        await this.prisma.sKUProposal.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
    }
  }
}
