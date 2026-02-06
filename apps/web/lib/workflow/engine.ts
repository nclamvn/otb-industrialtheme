import prisma from '@/lib/prisma';
import { WorkflowType, WorkflowStatus, WorkflowStepStatus, UserRole } from '@prisma/client';
import { WORKFLOW_DEFINITIONS, StepDefinition } from './transitions';
import { createNotification } from './notifications';

export interface CreateWorkflowInput {
  type: WorkflowType;
  referenceId: string;
  referenceType: 'budget' | 'otb' | 'sku';
  initiatedById: string;
  slaHours?: number;
}

export interface WorkflowActionInput {
  workflowId: string;
  stepNumber: number;
  actionById: string;
  action: 'approve' | 'reject' | 'skip';
  comment?: string;
}

// Create a new workflow
export async function createWorkflow(input: CreateWorkflowInput) {
  const definition = WORKFLOW_DEFINITIONS[input.type];
  if (!definition) {
    throw new Error(`Unknown workflow type: ${input.type}`);
  }

  const slaDeadline = input.slaHours
    ? new Date(Date.now() + input.slaHours * 60 * 60 * 1000)
    : null;

  // Create workflow with steps
  const workflow = await prisma.workflow.create({
    data: {
      type: input.type,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      status: WorkflowStatus.IN_PROGRESS,
      currentStep: 1,
      totalSteps: definition.steps.length,
      initiatedById: input.initiatedById,
      slaDeadline,
      steps: {
        create: definition.steps.map((step, index) => ({
          stepNumber: index + 1,
          stepName: step.name,
          description: step.description,
          assignedRole: step.assignedRole,
          status: index === 0 ? WorkflowStepStatus.IN_PROGRESS : WorkflowStepStatus.PENDING,
          slaHours: step.slaHours,
          dueAt: step.slaHours
            ? new Date(Date.now() + step.slaHours * 60 * 60 * 1000)
            : null,
        })),
      },
    },
    include: {
      steps: true,
      initiatedBy: true,
    },
  });

  // Notify assignees for first step
  await notifyStepAssignees(workflow.id, 1, definition.steps[0]);

  return workflow;
}

// Process workflow action (approve/reject/skip)
export async function processWorkflowAction(input: WorkflowActionInput) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: input.workflowId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
    throw new Error('Workflow is not in progress');
  }

  const currentStep = workflow.steps.find(
    (s) => s.stepNumber === input.stepNumber
  );

  if (!currentStep) {
    throw new Error('Step not found');
  }

  if (currentStep.status !== WorkflowStepStatus.IN_PROGRESS) {
    throw new Error('Step is not in progress');
  }

  // Update current step
  const stepStatus =
    input.action === 'approve'
      ? WorkflowStepStatus.APPROVED
      : input.action === 'reject'
        ? WorkflowStepStatus.REJECTED
        : WorkflowStepStatus.SKIPPED;

  await prisma.workflowStep.update({
    where: { id: currentStep.id },
    data: {
      status: stepStatus,
      actionById: input.actionById,
      actionAt: new Date(),
      actionType: input.action,
      actionComment: input.comment,
    },
  });

  // Handle rejection - workflow ends
  if (input.action === 'reject') {
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: WorkflowStatus.REJECTED,
        completedAt: new Date(),
      },
    });

    // Update related entity status
    await updateEntityStatus(workflow, 'rejected');

    // Notify initiator
    await createNotification({
      userId: workflow.initiatedById,
      type: getNotificationType(workflow.type, 'rejected'),
      title: 'Request Rejected',
      message: `Your ${workflow.referenceType} request has been rejected. ${input.comment ? `Reason: ${input.comment}` : ''}`,
      referenceId: workflow.referenceId,
      referenceType: workflow.referenceType,
      referenceUrl: getEntityUrl(workflow),
      priority: 'HIGH',
    });

    return { status: 'rejected', workflow };
  }

  // Move to next step or complete workflow
  const nextStepNumber = input.stepNumber + 1;
  const nextStep = workflow.steps.find((s) => s.stepNumber === nextStepNumber);

  if (nextStep) {
    // Move to next step
    await prisma.$transaction([
      prisma.workflow.update({
        where: { id: workflow.id },
        data: { currentStep: nextStepNumber },
      }),
      prisma.workflowStep.update({
        where: { id: nextStep.id },
        data: {
          status: WorkflowStepStatus.IN_PROGRESS,
          dueAt: nextStep.slaHours
            ? new Date(Date.now() + nextStep.slaHours * 60 * 60 * 1000)
            : null,
        },
      }),
    ]);

    // Get definition for notification
    const definition = WORKFLOW_DEFINITIONS[workflow.type];
    const stepDef = definition?.steps[nextStepNumber - 1];

    if (stepDef) {
      await notifyStepAssignees(workflow.id, nextStepNumber, stepDef);
    }

    return { status: 'moved_to_next', nextStep: nextStepNumber, workflow };
  } else {
    // Workflow complete
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        status: WorkflowStatus.APPROVED,
        completedAt: new Date(),
      },
    });

    // Update related entity status
    await updateEntityStatus(workflow, 'approved');

    // Notify initiator
    await createNotification({
      userId: workflow.initiatedById,
      type: getNotificationType(workflow.type, 'approved'),
      title: 'Request Approved',
      message: `Your ${workflow.referenceType} request has been approved.`,
      referenceId: workflow.referenceId,
      referenceType: workflow.referenceType,
      referenceUrl: getEntityUrl(workflow),
      priority: 'MEDIUM',
    });

    return { status: 'completed', workflow };
  }
}

// Get workflow with full details
export async function getWorkflowDetails(workflowId: string) {
  return prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, role: true },
          },
          actionBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      initiatedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}

// Get pending workflows for a user
export async function getPendingWorkflows(userId: string, role: UserRole) {
  return prisma.workflow.findMany({
    where: {
      status: WorkflowStatus.IN_PROGRESS,
      steps: {
        some: {
          status: WorkflowStepStatus.IN_PROGRESS,
          OR: [{ assignedUserId: userId }, { assignedRole: role }],
        },
      },
    },
    include: {
      steps: {
        where: { status: WorkflowStepStatus.IN_PROGRESS },
      },
      initiatedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Check SLA breaches
export async function checkSLABreaches() {
  const now = new Date();

  // Find workflows with breached SLA
  const breachedWorkflows = await prisma.workflow.findMany({
    where: {
      status: WorkflowStatus.IN_PROGRESS,
      slaDeadline: { lt: now },
      slaBreached: false,
    },
  });

  for (const workflow of breachedWorkflows) {
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { slaBreached: true },
    });

    // Notify relevant users
    await createNotification({
      userId: workflow.initiatedById,
      type: 'SLA_BREACHED',
      title: 'SLA Breached',
      message: `Workflow for ${workflow.referenceType} has exceeded SLA deadline.`,
      referenceId: workflow.referenceId,
      referenceType: workflow.referenceType,
      referenceUrl: getEntityUrl(workflow),
      priority: 'CRITICAL',
    });
  }

  // Find steps approaching SLA (warning at 80%)
  const warningSteps = await prisma.workflowStep.findMany({
    where: {
      status: WorkflowStepStatus.IN_PROGRESS,
      dueAt: {
        gt: now,
        lt: new Date(now.getTime() + 4 * 60 * 60 * 1000), // Within 4 hours
      },
    },
    include: {
      workflow: true,
    },
  });

  // Send warnings for approaching deadlines
  for (const _step of warningSteps) {
    // Implementation for SLA warnings
  }

  return {
    breachedCount: breachedWorkflows.length,
    warningCount: warningSteps.length,
  };
}

// Helper: Notify step assignees
async function notifyStepAssignees(
  workflowId: string,
  stepNumber: number,
  stepDef: StepDefinition
) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) return;

  // Find users to notify based on role
  if (stepDef.assignedRole) {
    const users = await prisma.user.findMany({
      where: {
        role: stepDef.assignedRole,
        status: 'ACTIVE',
      },
    });

    for (const user of users) {
      await createNotification({
        userId: user.id,
        type: 'WORKFLOW_ASSIGNED',
        title: 'New Approval Required',
        message: `You have a new ${workflow.referenceType} approval request: ${stepDef.name}`,
        referenceId: workflow.referenceId,
        referenceType: workflow.referenceType,
        referenceUrl: `/approvals/${workflowId}`,
        priority: 'HIGH',
      });
    }
  }
}

// Helper: Update entity status based on workflow result
async function updateEntityStatus(
  workflow: { type: WorkflowType; referenceId: string; referenceType: string },
  result: 'approved' | 'rejected'
) {
  const status = result === 'approved' ? 'APPROVED' : 'REJECTED';
  const timestamp = result === 'approved' ? 'approvedAt' : 'rejectedAt';

  switch (workflow.referenceType) {
    case 'budget':
      await prisma.budgetAllocation.update({
        where: { id: workflow.referenceId },
        data: { status, [timestamp]: new Date() },
      });
      break;
    case 'otb':
      await prisma.oTBPlan.update({
        where: { id: workflow.referenceId },
        data: { status, ...(result === 'approved' ? { approvedAt: new Date() } : {}) },
      });
      break;
    case 'sku':
      await prisma.sKUProposal.update({
        where: { id: workflow.referenceId },
        data: { status, ...(result === 'approved' ? { approvedAt: new Date() } : {}) },
      });
      break;
  }
}

// Helper: Get notification type
function getNotificationType(
  workflowType: WorkflowType,
  result: 'approved' | 'rejected'
) {
  const typeMap = {
    BUDGET_APPROVAL: result === 'approved' ? 'BUDGET_APPROVED' : 'BUDGET_REJECTED',
    OTB_APPROVAL: result === 'approved' ? 'OTB_APPROVED' : 'OTB_REJECTED',
    SKU_APPROVAL: result === 'approved' ? 'SKU_APPROVED' : 'BUDGET_REJECTED',
  } as const;

  return typeMap[workflowType] || 'SYSTEM_ALERT';
}

// Helper: Get entity URL
function getEntityUrl(workflow: { referenceType: string; referenceId: string }) {
  const urlMap: Record<string, string> = {
    budget: `/budget/${workflow.referenceId}`,
    otb: `/otb-analysis/${workflow.referenceId}`,
    sku: `/sku-proposal/${workflow.referenceId}`,
  };

  return urlMap[workflow.referenceType] || '/';
}
