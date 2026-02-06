// Execute Action Tool - Perform actions on behalf of user
import prisma from '@/lib/prisma';

interface ActionInput {
  action: string;
  entity_type: string;
  entity_id?: string;
  parameters?: Record<string, unknown>;
}

interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Actions that require explicit user confirmation
const CONFIRMATION_REQUIRED_ACTIONS = [
  'approve_proposal',
  'reject_proposal',
  'approve_otb',
  'reject_otb',
  'update_budget',
  'delete_item',
  'submit_proposal',
  'cancel_order',
];

export async function executeAction(
  input: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  const { action, entity_type, entity_id, parameters = {} } = input as unknown as ActionInput;

  try {
    // Check if action requires confirmation
    if (CONFIRMATION_REQUIRED_ACTIONS.includes(action)) {
      // If no confirmation flag, return confirmation request
      if (!parameters.confirmed) {
        return {
          success: false,
          action,
          message: 'Action requires confirmation',
          requiresConfirmation: true,
          confirmationMessage: getConfirmationMessage(action, entity_type, entity_id),
        };
      }
    }

    // Route to appropriate action handler
    switch (action) {
      // Proposal Actions
      case 'approve_proposal':
        return await approveProposal(entity_id!, userId);
      case 'reject_proposal':
        return await rejectProposal(entity_id!, parameters.reason as string);
      case 'submit_proposal':
        return await submitProposal(entity_id!, userId);

      // OTB Plan Actions
      case 'approve_otb':
        return await approveOTBPlan(entity_id!, userId);
      case 'reject_otb':
        return await rejectOTBPlan(entity_id!, parameters.reason as string);

      // Budget Actions
      case 'update_budget':
        return await updateBudget(entity_id!, parameters);

      // SKU Actions
      case 'update_sku_quantity':
        return await updateSKUQuantity(entity_id!, parameters.quantity as number);

      // Alert Actions
      case 'acknowledge_alert':
        return await acknowledgeAlert(entity_id!, userId);
      case 'dismiss_alert':
        return await dismissAlert(entity_id!);

      // Notification Actions
      case 'mark_notification_read':
        return await markNotificationRead(entity_id!, userId);

      // Export Actions
      case 'export_data':
        return await exportData(entity_type, parameters);

      // Navigation/UI Actions
      case 'navigate':
        return {
          success: true,
          action: 'navigate',
          message: `Navigate to ${parameters.path}`,
          data: { path: parameters.path },
        };

      case 'open_modal':
        return {
          success: true,
          action: 'open_modal',
          message: `Open ${parameters.modal} modal`,
          data: { modal: parameters.modal, props: parameters.props },
        };

      default:
        return {
          success: false,
          action,
          message: `Unknown action: ${action}`,
        };
    }
  } catch (error) {
    console.error('Execute action error:', error);
    return {
      success: false,
      action,
      message: `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function getConfirmationMessage(
  action: string,
  entityType: string,
  _entityId?: string
): string {
  const messages: Record<string, string> = {
    approve_proposal: `Are you sure you want to approve this ${entityType}? This action cannot be undone.`,
    reject_proposal: `Are you sure you want to reject this ${entityType}? Please provide a reason.`,
    approve_otb: 'Are you sure you want to approve this OTB Plan? This will make it active.',
    reject_otb: 'Are you sure you want to reject this OTB Plan? Please provide a reason.',
    update_budget: 'Are you sure you want to update the budget allocation?',
    delete_item: `Are you sure you want to delete this ${entityType}? This action cannot be undone.`,
    submit_proposal: 'Are you sure you want to submit this proposal for approval?',
    cancel_order: 'Are you sure you want to cancel this order?',
  };

  return messages[action] || `Are you sure you want to ${action}?`;
}

async function approveProposal(
  proposalId: string,
  userId: string
): Promise<ActionResult> {
  const proposal = await prisma.sKUProposal.update({
    where: { id: proposalId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: userId,
    },
    include: { brand: true, season: true },
  });

  const proposalName = `${proposal.brand.name} - ${proposal.season.name}`;

  return {
    success: true,
    action: 'approve_proposal',
    message: `Successfully approved proposal "${proposalName}"`,
    data: {
      proposalId: proposal.id,
      proposalName,
      brand: proposal.brand.name,
      season: proposal.season.name,
    },
  };
}

async function rejectProposal(
  proposalId: string,
  reason?: string
): Promise<ActionResult> {
  const proposal = await prisma.sKUProposal.update({
    where: { id: proposalId },
    data: {
      status: 'REJECTED',
    },
    include: { brand: true, season: true },
  });

  const proposalName = `${proposal.brand.name} - ${proposal.season.name}`;

  return {
    success: true,
    action: 'reject_proposal',
    message: `Proposal "${proposalName}" has been rejected${reason ? ` with reason: ${reason}` : ''}`,
    data: { proposalId: proposal.id, proposalName },
  };
}

async function submitProposal(
  proposalId: string,
  _userId: string
): Promise<ActionResult> {
  const proposal = await prisma.sKUProposal.update({
    where: { id: proposalId },
    data: {
      status: 'SUBMITTED',
    },
    include: { brand: true, season: true },
  });

  const proposalName = `${proposal.brand.name} - ${proposal.season.name}`;

  return {
    success: true,
    action: 'submit_proposal',
    message: `Proposal "${proposalName}" has been submitted for approval`,
    data: { proposalId: proposal.id, proposalName },
  };
}

async function approveOTBPlan(
  planId: string,
  userId: string
): Promise<ActionResult> {
  const plan = await prisma.oTBPlan.update({
    where: { id: planId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: userId,
    },
    include: { brand: true, season: true },
  });

  return {
    success: true,
    action: 'approve_otb',
    message: `OTB Plan for ${plan.brand.name} (${plan.season.name}) has been approved`,
    data: {
      planId: plan.id,
      brand: plan.brand.name,
      season: plan.season.name,
    },
  };
}

async function rejectOTBPlan(
  planId: string,
  reason?: string
): Promise<ActionResult> {
  const plan = await prisma.oTBPlan.update({
    where: { id: planId },
    data: {
      status: 'REJECTED',
    },
    include: { brand: true, season: true },
  });

  return {
    success: true,
    action: 'reject_otb',
    message: `OTB Plan for ${plan.brand.name} has been rejected${reason ? `: ${reason}` : ''}`,
    data: { planId: plan.id, brand: plan.brand.name },
  };
}

async function updateBudget(
  budgetId: string,
  parameters: Record<string, unknown>
): Promise<ActionResult> {
  const updateData: Record<string, unknown> = {};

  if (parameters.totalBudget !== undefined) {
    updateData.totalBudget = parameters.totalBudget;
  }
  if (parameters.status !== undefined) {
    updateData.status = parameters.status;
  }

  const budget = await prisma.budgetAllocation.update({
    where: { id: budgetId },
    data: updateData,
    include: { brand: true, season: true, location: true },
  });

  return {
    success: true,
    action: 'update_budget',
    message: `Budget for ${budget.brand.name} at ${budget.location.name} has been updated`,
    data: {
      budgetId: budget.id,
      brand: budget.brand.name,
      location: budget.location.name,
      totalBudget: Number(budget.totalBudget),
    },
  };
}

async function updateSKUQuantity(
  skuId: string,
  quantity: number
): Promise<ActionResult> {
  const sku = await prisma.sKUItem.update({
    where: { id: skuId },
    data: { orderQuantity: quantity },
  });

  return {
    success: true,
    action: 'update_sku_quantity',
    message: `SKU "${sku.styleName}" quantity updated to ${quantity}`,
    data: { skuId: sku.id, styleName: sku.styleName, orderQuantity: sku.orderQuantity },
  };
}

async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<ActionResult> {
  const alert = await prisma.kPIAlert.update({
    where: { id: alertId },
    data: {
      isAcknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedById: userId,
    },
  });

  return {
    success: true,
    action: 'acknowledge_alert',
    message: 'Alert has been acknowledged',
    data: { alertId: alert.id },
  };
}

async function dismissAlert(
  alertId: string
): Promise<ActionResult> {
  await prisma.kPIAlert.delete({
    where: { id: alertId },
  });

  return {
    success: true,
    action: 'dismiss_alert',
    message: 'Alert has been dismissed',
    data: { alertId },
  };
}

async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<ActionResult> {
  const notification = await prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  return {
    success: true,
    action: 'mark_notification_read',
    message: 'Notification marked as read',
    data: { notificationId: notification.id },
  };
}

async function exportData(
  entityType: string,
  parameters: Record<string, unknown>
): Promise<ActionResult> {
  const format = (parameters.format as string) || 'csv';
  const filters = parameters.filters as Record<string, unknown> || {};

  // Return export configuration - actual export handled by frontend
  return {
    success: true,
    action: 'export_data',
    message: `Export ${entityType} data as ${format.toUpperCase()}`,
    data: {
      entityType,
      format,
      filters,
      exportUrl: `/api/export/${entityType}?format=${format}`,
    },
  };
}
