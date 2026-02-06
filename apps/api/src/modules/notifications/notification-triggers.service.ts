import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

// Notification event types
export enum NotificationEvent {
  // Budget events
  BUDGET_SUBMITTED = 'budget.submitted',
  BUDGET_APPROVED = 'budget.approved',
  BUDGET_REJECTED = 'budget.rejected',
  BUDGET_COMMENT_ADDED = 'budget.comment.added',

  // OTB events
  OTB_SUBMITTED = 'otb.submitted',
  OTB_APPROVED = 'otb.approved',
  OTB_REJECTED = 'otb.rejected',
  OTB_VERSION_CREATED = 'otb.version.created',

  // SKU events
  SKU_UPLOADED = 'sku.uploaded',
  SKU_VALIDATED = 'sku.validated',
  SKU_APPROVED = 'sku.approved',
  SKU_REJECTED = 'sku.rejected',

  // Workflow events
  WORKFLOW_ASSIGNED = 'workflow.assigned',
  WORKFLOW_REMINDER = 'workflow.reminder',
  WORKFLOW_ESCALATED = 'workflow.escalated',

  // Alert events
  SLA_WARNING = 'sla.warning',
  SLA_BREACHED = 'sla.breached',
  STOCKOUT_ALERT = 'stockout.alert',
  MOC_LOW_ALERT = 'moc.low.alert',
  MARKDOWN_NEEDED = 'markdown.needed',

  // AI/Forecast events
  FORECAST_READY = 'forecast.ready',
  AI_RECOMMENDATION = 'ai.recommendation',
  ANOMALY_DETECTED = 'anomaly.detected',

  // System events
  SYSTEM_ALERT = 'system.alert',
  MAINTENANCE_SCHEDULED = 'maintenance.scheduled',
}

// Notification payload interfaces
export interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  roleIds?: string[];
  title: string;
  message: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  referenceId?: string;
  referenceType?: string;
  referenceUrl?: string;
  data?: Record<string, any>;
}

// Notification templates
export const NotificationTemplates: Record<string, (data: any) => { title: string; message: string }> = {
  // Budget templates
  [NotificationEvent.BUDGET_SUBMITTED]: (data) => ({
    title: 'Budget Submitted for Approval',
    message: `${data.submitterName} has submitted a budget for ${data.seasonName} (${data.brandName}) requiring your review.`,
  }),
  [NotificationEvent.BUDGET_APPROVED]: (data) => ({
    title: 'Budget Approved',
    message: `Your budget submission for ${data.seasonName} (${data.brandName}) has been approved by ${data.approverName}.`,
  }),
  [NotificationEvent.BUDGET_REJECTED]: (data) => ({
    title: 'Budget Rejected',
    message: `Your budget submission for ${data.seasonName} (${data.brandName}) has been rejected. Reason: ${data.reason}`,
  }),

  // OTB templates
  [NotificationEvent.OTB_SUBMITTED]: (data) => ({
    title: 'OTB Plan Submitted for Review',
    message: `${data.submitterName} has submitted OTB plan for ${data.brandName} (${data.seasonName}).`,
  }),
  [NotificationEvent.OTB_APPROVED]: (data) => ({
    title: 'OTB Plan Approved',
    message: `OTB plan for ${data.brandName} (${data.seasonName}) has been approved. Version ${data.version} is now final.`,
  }),

  // SKU templates
  [NotificationEvent.SKU_VALIDATED]: (data) => ({
    title: 'SKU Validation Complete',
    message: `SKU validation completed: ${data.validCount} valid, ${data.warningCount} warnings, ${data.errorCount} errors.`,
  }),

  // Workflow templates
  [NotificationEvent.WORKFLOW_ASSIGNED]: (data) => ({
    title: 'New Approval Task Assigned',
    message: `You have been assigned to review ${data.itemType}: "${data.itemName}". Due: ${data.dueDate}.`,
  }),
  [NotificationEvent.WORKFLOW_REMINDER]: (data) => ({
    title: 'Approval Reminder',
    message: `Reminder: ${data.itemType} "${data.itemName}" is pending your approval. Due in ${data.hoursRemaining} hours.`,
  }),

  // Alert templates
  [NotificationEvent.STOCKOUT_ALERT]: (data) => ({
    title: 'Stockout Risk Alert',
    message: `SKU ${data.skuCode} (${data.skuName}) is at risk of stockout. Current MOC: ${data.currentMOC}, projected stockout: ${data.stockoutDate}.`,
  }),
  [NotificationEvent.MOC_LOW_ALERT]: (data) => ({
    title: 'Low Month of Cover Alert',
    message: `${data.count} SKUs have fallen below minimum MOC threshold. Recommended action: Review replenishment alerts.`,
  }),
  [NotificationEvent.MARKDOWN_NEEDED]: (data) => ({
    title: 'Markdown Action Required',
    message: `${data.count} SKUs are flagged for clearance. Total value at risk: ${data.totalValue}. Action deadline: ${data.deadline}.`,
  }),

  // AI templates
  [NotificationEvent.FORECAST_READY]: (data) => ({
    title: 'Forecast Updated',
    message: `New ${data.forecastType} forecast for ${data.period} is ready. Confidence: ${data.confidence}%.`,
  }),
  [NotificationEvent.AI_RECOMMENDATION]: (data) => ({
    title: 'AI Recommendation',
    message: `${data.recommendationType}: ${data.summary}. Potential impact: ${data.impact}.`,
  }),

  // SLA templates
  [NotificationEvent.SLA_WARNING]: (data) => ({
    title: 'SLA Warning',
    message: `${data.itemType} "${data.itemName}" is approaching SLA deadline. ${data.timeRemaining} remaining.`,
  }),
  [NotificationEvent.SLA_BREACHED]: (data) => ({
    title: 'SLA Breached',
    message: `URGENT: ${data.itemType} "${data.itemName}" has breached SLA deadline. Immediate action required.`,
  }),
};

@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger(NotificationTriggersService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {
    // Register event listeners
    this.registerEventListeners();
  }

  private registerEventListeners() {
    // Listen for notification events
    this.eventEmitter.on('notification.*', (payload: NotificationPayload & { event: string }) => {
      this.processNotification(payload.event, payload).catch((err) =>
        this.logger.error(`Error processing notification: ${err.message}`, err.stack),
      );
    });
  }

  /**
   * Emit a notification event
   */
  async emit(event: NotificationEvent, payload: NotificationPayload) {
    this.eventEmitter.emit(`notification.${event}`, { ...payload, event });
  }

  /**
   * Process and create notification
   */
  private async processNotification(event: string, payload: NotificationPayload) {
    try {
      // Get template
      const template = NotificationTemplates[event];
      const { title, message } = template
        ? template(payload.data || {})
        : { title: payload.title, message: payload.message };

      // Determine recipients
      const userIds: string[] = [];

      if (payload.userId) {
        userIds.push(payload.userId);
      }

      if (payload.userIds) {
        userIds.push(...payload.userIds);
      }

      // If role-based, get users with those roles
      if (payload.roleIds && payload.roleIds.length > 0) {
        const usersWithRoles = await this.prisma.user.findMany({
          where: { role: { in: payload.roleIds as any[] } },
          select: { id: true },
        });
        userIds.push(...usersWithRoles.map((u) => u.id));
      }

      // Remove duplicates
      const uniqueUserIds = [...new Set(userIds)];

      // Create notifications for all recipients
      const notifications = uniqueUserIds.map((userId) => ({
        userId,
        type: this.mapEventToNotificationType(event),
        priority: payload.priority || 'MEDIUM',
        title,
        message,
        referenceId: payload.referenceId,
        referenceType: payload.referenceType,
        referenceUrl: payload.referenceUrl,
      }));

      if (notifications.length > 0) {
        await this.prisma.notification.createMany({
          data: notifications as any[],
        });

        // Also create realtime notifications for high/critical priority
        if (payload.priority === 'HIGH' || payload.priority === 'CRITICAL') {
          const realtimeNotifications = uniqueUserIds.map((userId) => ({
            userId,
            type: payload.priority === 'CRITICAL' ? 'ERROR' : 'WARNING',
            title,
            message,
            entityType: payload.referenceType,
            entityId: payload.referenceId,
            actionUrl: payload.referenceUrl,
          }));

          await this.prisma.realtimeNotification.createMany({
            data: realtimeNotifications as any[],
          });
        }

        this.logger.log(`Created ${notifications.length} notifications for event: ${event}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Map event to notification type
   */
  private mapEventToNotificationType(event: string): string {
    const mapping: Record<string, string> = {
      [NotificationEvent.BUDGET_SUBMITTED]: 'BUDGET_SUBMITTED',
      [NotificationEvent.BUDGET_APPROVED]: 'BUDGET_APPROVED',
      [NotificationEvent.BUDGET_REJECTED]: 'BUDGET_REJECTED',
      [NotificationEvent.OTB_SUBMITTED]: 'OTB_SUBMITTED',
      [NotificationEvent.OTB_APPROVED]: 'OTB_APPROVED',
      [NotificationEvent.OTB_REJECTED]: 'OTB_REJECTED',
      [NotificationEvent.SKU_UPLOADED]: 'SKU_UPLOADED',
      [NotificationEvent.SKU_VALIDATED]: 'SKU_VALIDATED',
      [NotificationEvent.SKU_APPROVED]: 'SKU_APPROVED',
      [NotificationEvent.WORKFLOW_ASSIGNED]: 'WORKFLOW_ASSIGNED',
      [NotificationEvent.WORKFLOW_REMINDER]: 'WORKFLOW_REMINDER',
      [NotificationEvent.SLA_WARNING]: 'SLA_WARNING',
      [NotificationEvent.SLA_BREACHED]: 'SLA_BREACHED',
    };

    return mapping[event] || 'SYSTEM_ALERT';
  }

  // ============================================
  // Convenience methods for common notifications
  // ============================================

  async notifyBudgetSubmitted(data: {
    submitterName: string;
    seasonName: string;
    brandName: string;
    budgetId: string;
    approverIds: string[];
  }) {
    await this.emit(NotificationEvent.BUDGET_SUBMITTED, {
      userIds: data.approverIds,
      title: '',
      message: '',
      priority: 'HIGH',
      referenceId: data.budgetId,
      referenceType: 'BUDGET',
      referenceUrl: `/budgets/${data.budgetId}`,
      data,
    });
  }

  async notifyBudgetApproved(data: {
    submitterId: string;
    approverName: string;
    seasonName: string;
    brandName: string;
    budgetId: string;
  }) {
    await this.emit(NotificationEvent.BUDGET_APPROVED, {
      userId: data.submitterId,
      title: '',
      message: '',
      priority: 'MEDIUM',
      referenceId: data.budgetId,
      referenceType: 'BUDGET',
      referenceUrl: `/budgets/${data.budgetId}`,
      data,
    });
  }

  async notifyWorkflowAssigned(data: {
    assigneeId: string;
    itemType: string;
    itemName: string;
    itemId: string;
    dueDate: string;
  }) {
    await this.emit(NotificationEvent.WORKFLOW_ASSIGNED, {
      userId: data.assigneeId,
      title: '',
      message: '',
      priority: 'HIGH',
      referenceId: data.itemId,
      referenceType: data.itemType,
      referenceUrl: `/${data.itemType.toLowerCase()}s/${data.itemId}`,
      data,
    });
  }

  async notifyStockoutRisk(data: {
    managerId: string;
    skuCode: string;
    skuName: string;
    skuId: string;
    currentMOC: number;
    stockoutDate: string;
  }) {
    await this.emit(NotificationEvent.STOCKOUT_ALERT, {
      userId: data.managerId,
      title: '',
      message: '',
      priority: 'CRITICAL',
      referenceId: data.skuId,
      referenceType: 'SKU',
      referenceUrl: `/replenishment/alerts?sku=${data.skuId}`,
      data,
    });
  }

  async notifyLowMOC(data: { managerId: string; count: number }) {
    await this.emit(NotificationEvent.MOC_LOW_ALERT, {
      userId: data.managerId,
      title: '',
      message: '',
      priority: 'HIGH',
      referenceUrl: '/replenishment/dashboard',
      data,
    });
  }

  async notifyMarkdownNeeded(data: {
    managerId: string;
    count: number;
    totalValue: string;
    deadline: string;
    planId?: string;
  }) {
    await this.emit(NotificationEvent.MARKDOWN_NEEDED, {
      userId: data.managerId,
      title: '',
      message: '',
      priority: 'HIGH',
      referenceId: data.planId,
      referenceType: 'MARKDOWN_PLAN',
      referenceUrl: data.planId ? `/clearance/plans/${data.planId}` : '/clearance/plans',
      data,
    });
  }

  async notifyForecastReady(data: {
    userIds: string[];
    forecastType: string;
    period: string;
    confidence: number;
    runId: string;
  }) {
    await this.emit(NotificationEvent.FORECAST_READY, {
      userIds: data.userIds,
      title: '',
      message: '',
      priority: 'MEDIUM',
      referenceId: data.runId,
      referenceType: 'FORECAST',
      referenceUrl: `/forecasting/runs/${data.runId}`,
      data,
    });
  }

  async notifySLAWarning(data: {
    userId: string;
    itemType: string;
    itemName: string;
    itemId: string;
    timeRemaining: string;
  }) {
    await this.emit(NotificationEvent.SLA_WARNING, {
      userId: data.userId,
      title: '',
      message: '',
      priority: 'HIGH',
      referenceId: data.itemId,
      referenceType: data.itemType,
      data,
    });
  }

  async notifySLABreached(data: {
    userIds: string[];
    itemType: string;
    itemName: string;
    itemId: string;
  }) {
    await this.emit(NotificationEvent.SLA_BREACHED, {
      userIds: data.userIds,
      title: '',
      message: '',
      priority: 'CRITICAL',
      referenceId: data.itemId,
      referenceType: data.itemType,
      data,
    });
  }
}
