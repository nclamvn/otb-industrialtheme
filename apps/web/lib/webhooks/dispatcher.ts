// Webhook Dispatcher
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { DeliveryStatus } from '@prisma/client';

// Webhook Events
export const WEBHOOK_EVENTS = {
  // Budget
  BUDGET_CREATED: 'budget.created',
  BUDGET_UPDATED: 'budget.updated',
  BUDGET_SUBMITTED: 'budget.submitted',
  BUDGET_APPROVED: 'budget.approved',
  BUDGET_REJECTED: 'budget.rejected',

  // OTB
  OTB_CREATED: 'otb.created',
  OTB_UPDATED: 'otb.updated',
  OTB_SUBMITTED: 'otb.submitted',
  OTB_APPROVED: 'otb.approved',
  OTB_FINALIZED: 'otb.finalized',

  // SKU
  SKU_PROPOSED: 'sku.proposed',
  SKU_VALIDATED: 'sku.validated',
  SKU_APPROVED: 'sku.approved',
  SKU_REJECTED: 'sku.rejected',

  // Workflow
  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_STEP_COMPLETED: 'workflow.step_completed',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_ESCALATED: 'workflow.escalated',

  // Sync
  SYNC_STARTED: 'sync.started',
  SYNC_COMPLETED: 'sync.completed',
  SYNC_FAILED: 'sync.failed',

  // User
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
}

// Dispatch webhook to a single endpoint
async function dispatchToEndpoint(
  webhookId: string,
  url: string,
  secret: string,
  headers: Record<string, string> | null,
  event: string,
  payload: Record<string, unknown>,
  timeoutSeconds: number
): Promise<{ success: boolean; statusCode?: number; responseBody?: string; responseTime: number }> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = generateSignature(body, secret);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Id': webhookId,
        ...headers,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch {
      responseBody = '';
    }

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 1000), // Limit response body size
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseBody: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

// Dispatch webhook event
export async function dispatchWebhook(
  event: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  // Find all webhooks subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: {
      isEnabled: true,
      events: { has: event },
    },
  });

  if (webhooks.length === 0) {
    return;
  }

  // Dispatch to each webhook
  for (const webhook of webhooks) {
    const headers = webhook.headers as Record<string, string> | null;

    const result = await dispatchToEndpoint(
      webhook.id,
      webhook.url,
      webhook.secret,
      headers,
      event,
      payload,
      webhook.timeoutSeconds
    );

    // Create delivery record
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as Prisma.InputJsonValue,
        statusCode: result.statusCode,
        responseBody: result.responseBody,
        responseTime: result.responseTime,
        status: result.success ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
      },
    });

    // Update webhook stats
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        successCount: result.success ? { increment: 1 } : undefined,
        failureCount: !result.success ? { increment: 1 } : undefined,
      },
    });

    // If failed and retries remaining, schedule retry
    if (!result.success && webhook.retryCount > 0) {
      // In production, use a job queue (Bull, etc.) for retries
      // TODO: Log webhook failure to monitoring system
    }
  }
}

// Test webhook
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
}> {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook) {
    return { success: false, error: 'Webhook not found', responseTime: 0 };
  }

  const headers = webhook.headers as Record<string, string> | null;
  const result = await dispatchToEndpoint(
    webhook.id,
    webhook.url,
    webhook.secret,
    headers,
    'webhook.test',
    { message: 'This is a test webhook delivery' },
    webhook.timeoutSeconds
  );

  // Create delivery record for test
  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event: 'webhook.test',
      payload: { message: 'Test delivery' },
      statusCode: result.statusCode,
      responseBody: result.responseBody,
      responseTime: result.responseTime,
      status: result.success ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
    },
  });

  return {
    success: result.success,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    error: result.success ? undefined : result.responseBody,
  };
}

// Verify webhook signature (for receiving webhooks)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
