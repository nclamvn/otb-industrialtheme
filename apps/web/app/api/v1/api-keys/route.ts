export const runtime = 'nodejs';

// API Keys Management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createAPIKey,
  getAPIKeysByUser,
  getAllAPIKeys,
  API_SCOPES,
} from '@/lib/api-keys';

// GET /api/v1/api-keys - List API keys
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    const apiKeys = isAdmin
      ? await getAllAPIKeys()
      : await getAPIKeysByUser(session.user.id);

    return NextResponse.json({
      apiKeys,
      availableScopes: API_SCOPES,
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return NextResponse.json({ error: 'Failed to list API keys' }, { status: 500 });
  }
}

// POST /api/v1/api-keys - Create API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, scopes, rateLimit, expiresAt } = body;

    // Validate required fields
    if (!name || !scopes || scopes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, scopes' },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes = Object.keys(API_SCOPES);
    const invalidScopes = scopes.filter((s: string) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse expiration date
    let expirationDate: Date | undefined;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expiration date' }, { status: 400 });
      }
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'Expiration date must be in the future' },
          { status: 400 }
        );
      }
    }

    const result = await createAPIKey({
      name,
      scopes,
      userId: session.user.id,
      rateLimit,
      expiresAt: expirationDate,
    });

    return NextResponse.json({
      apiKey: {
        id: result.id,
        key: result.key, // Only returned on creation
        prefix: result.prefix,
        name,
        scopes,
      },
      message: 'Store this API key securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
