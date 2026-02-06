// Webhooks Module Index
export {
  WEBHOOK_EVENTS,
  dispatchWebhook,
  testWebhook,
  verifyWebhookSignature,
  type WebhookEventType,
} from './dispatcher';

import prisma from '@/lib/prisma';
import crypto from 'crypto';

// Create webhook
export async function createWebhook(params: {
  name: string;
  url: string;
  events: string[];
  userId: string;
  headers?: Record<string, string>;
  retryCount?: number;
  timeoutSeconds?: number;
}) {
  const secret = crypto.randomBytes(32).toString('hex');

  return prisma.webhook.create({
    data: {
      name: params.name,
      url: params.url,
      secret,
      events: params.events,
      headers: params.headers || {},
      retryCount: params.retryCount ?? 3,
      timeoutSeconds: params.timeoutSeconds ?? 30,
      createdById: params.userId,
    },
  });
}

// Update webhook
export async function updateWebhook(
  webhookId: string,
  params: {
    name?: string;
    url?: string;
    events?: string[];
    headers?: Record<string, string>;
    isEnabled?: boolean;
    retryCount?: number;
    timeoutSeconds?: number;
  }
) {
  return prisma.webhook.update({
    where: { id: webhookId },
    data: params,
  });
}

// Delete webhook
export async function deleteWebhook(webhookId: string): Promise<void> {
  await prisma.webhook.delete({
    where: { id: webhookId },
  });
}

// Get webhook by ID
export async function getWebhookById(webhookId: string) {
  return prisma.webhook.findUnique({
    where: { id: webhookId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { deliveries: true },
      },
    },
  });
}

// Get webhooks by user
export async function getWebhooksByUser(userId: string) {
  return prisma.webhook.findMany({
    where: { createdById: userId },
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get all webhooks (admin)
export async function getAllWebhooks() {
  return prisma.webhook.findMany({
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { deliveries: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get webhook deliveries
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50,
  offset: number = 0
) {
  return prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

// Regenerate webhook secret
export async function regenerateWebhookSecret(webhookId: string): Promise<string> {
  const newSecret = crypto.randomBytes(32).toString('hex');

  await prisma.webhook.update({
    where: { id: webhookId },
    data: { secret: newSecret },
  });

  return newSecret;
}
