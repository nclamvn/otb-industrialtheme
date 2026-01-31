export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { mockWorkflows, mockBudgets, mockOTBPlans, mockSKUProposals } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // budget, otb, sku
    const status = searchParams.get('status'); // pending, completed

    let enrichedWorkflows;

    try {
      // Get pending workflows
      const workflows = await prisma.workflow.findMany({
        where: {
          status: status === 'completed' ? 'APPROVED' : { in: ['PENDING', 'IN_PROGRESS'] },
          ...(type && { type: type === 'budget' ? 'BUDGET_APPROVAL' : type === 'otb' ? 'OTB_APPROVAL' : 'SKU_APPROVAL' }),
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

      // Enrich workflows with entity details
      enrichedWorkflows = await Promise.all(
        workflows.map(async (workflow) => {
          let entityDetails: unknown = null;

          if (workflow.referenceType === 'BUDGET') {
            entityDetails = await prisma.budgetAllocation.findUnique({
              where: { id: workflow.referenceId },
              include: {
                season: true,
                brand: true,
                location: true,
              },
            });
          } else if (workflow.referenceType === 'OTB_PLAN') {
            entityDetails = await prisma.oTBPlan.findUnique({
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
            entityDetails = await prisma.sKUProposal.findUnique({
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
            (s: { stepNumber: number }) => s.stepNumber === workflow.currentStep
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
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      // Use mock data when database is unavailable
      const filteredWorkflows = mockWorkflows.filter(w => {
        if (status === 'completed' && w.status !== 'APPROVED') return false;
        if (status !== 'completed' && !['PENDING', 'IN_PROGRESS'].includes(w.status)) return false;
        if (type === 'budget' && w.type !== 'BUDGET_APPROVAL') return false;
        if (type === 'otb' && w.type !== 'OTB_APPROVAL') return false;
        if (type === 'sku' && w.type !== 'SKU_APPROVAL') return false;
        return true;
      });

      enrichedWorkflows = filteredWorkflows.map(workflow => {
        let entityDetails = null;
        if (workflow.referenceType === 'BUDGET') {
          entityDetails = mockBudgets.find(b => b.id === workflow.referenceId);
        } else if (workflow.referenceType === 'OTB_PLAN') {
          entityDetails = mockOTBPlans.find(o => o.id === workflow.referenceId);
        } else if (workflow.referenceType === 'SKU_PROPOSAL') {
          entityDetails = mockSKUProposals.find(s => s.id === workflow.referenceId);
        }

        const currentStep = workflow.steps.find(s => s.stepNumber === workflow.currentStep);

        return {
          ...workflow,
          entityType: workflow.referenceType,
          entityId: workflow.referenceId,
          entityDetails,
          currentStepDetails: currentStep,
        };
      });
    }

    // Group by type for summary
    const summary = {
      budget: enrichedWorkflows.filter((w) => w.type === 'BUDGET_APPROVAL').length,
      otb: enrichedWorkflows.filter((w) => w.type === 'OTB_APPROVAL').length,
      sku: enrichedWorkflows.filter((w) => w.type === 'SKU_APPROVAL').length,
      total: enrichedWorkflows.length,
    };

    return NextResponse.json({
      success: true,
      data: enrichedWorkflows,
      summary,
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
