export const runtime = 'nodejs';

// Webhooks API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createWebhook,
  getAllWebhooks,
  getWebhooksByUser,
  WEBHOOK_EVENTS,
} from '@/lib/webhooks';

// GET /api/v1/webhooks - List webhooks
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    const webhooks = isAdmin
      ? await getAllWebhooks()
      : await getWebhooksByUser(session.user.id);

    // Don't return secrets
    const safeWebhooks = webhooks.map((w) => ({
      ...w,
      secret: undefined,
    }));

    return NextResponse.json({
      webhooks: safeWebhooks,
      availableEvents: Object.values(WEBHOOK_EVENTS),
    });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return NextResponse.json({ error: 'Failed to list webhooks' }, { status: 500 });
  }
}

// POST /api/v1/webhooks - Create webhook
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, events, headers, retryCount, timeoutSeconds } = body;

    // Validate required fields
    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as typeof validEvents[number]));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const webhook = await createWebhook({
      name,
      url,
      events,
      userId: session.user.id,
      headers,
      retryCount,
      timeoutSeconds,
    });

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret, // Only returned on creation
        isEnabled: webhook.isEnabled,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
