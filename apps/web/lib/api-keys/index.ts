// API Key Management
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// API Key prefix
const API_KEY_PREFIX = 'dafc_';
const API_KEY_LENGTH = 32;

// Generate a new API key
function generateAPIKey(): { key: string; hash: string; prefix: string } {
  const randomPart = crypto.randomBytes(API_KEY_LENGTH).toString('hex');
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 12);

  return { key, hash, prefix };
}

// Hash an API key
function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Create API key
export async function createAPIKey(params: {
  name: string;
  scopes: string[];
  userId: string;
  rateLimit?: number;
  expiresAt?: Date;
}): Promise<{ id: string; key: string; prefix: string }> {
  const { key, hash, prefix } = generateAPIKey();

  const apiKey = await prisma.aPIKey.create({
    data: {
      name: params.name,
      key: hash, // Store hashed key
      prefix,
      scopes: params.scopes,
      rateLimit: params.rateLimit ?? 1000,
      expiresAt: params.expiresAt,
      createdById: params.userId,
    },
  });

  // Return the actual key only once during creation
  return { id: apiKey.id, key, prefix };
}

// Validate API key
export async function validateAPIKey(key: string): Promise<{
  valid: boolean;
  keyId?: string;
  userId?: string;
  scopes?: string[];
  error?: string;
}> {
  const hash = hashAPIKey(key);

  const apiKey = await prisma.aPIKey.findUnique({
    where: { key: hash },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!apiKey.isEnabled) {
    return { valid: false, error: 'API key is disabled' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update usage stats
  await prisma.aPIKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  return {
    valid: true,
    keyId: apiKey.id,
    userId: apiKey.createdById,
    scopes: apiKey.scopes,
  };
}

// Check if key has required scope
export function hasScope(keyScopes: string[], requiredScope: string): boolean {
  // Check for wildcard scope
  if (keyScopes.includes('*')) return true;

  // Check for exact match
  if (keyScopes.includes(requiredScope)) return true;

  // Check for parent scope (e.g., 'read:*' matches 'read:budget')
  const [action] = requiredScope.split(':');
  if (keyScopes.includes(`${action}:*`)) return true;

  return false;
}

// Delete API key
export async function deleteAPIKey(keyId: string): Promise<void> {
  await prisma.aPIKey.delete({
    where: { id: keyId },
  });
}

// Disable API key
export async function disableAPIKey(keyId: string): Promise<void> {
  await prisma.aPIKey.update({
    where: { id: keyId },
    data: { isEnabled: false },
  });
}

// Enable API key
export async function enableAPIKey(keyId: string): Promise<void> {
  await prisma.aPIKey.update({
    where: { id: keyId },
    data: { isEnabled: true },
  });
}

// Get API keys by user
export async function getAPIKeysByUser(userId: string) {
  return prisma.aPIKey.findMany({
    where: { createdById: userId },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      rateLimit: true,
      isEnabled: true,
      lastUsedAt: true,
      usageCount: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get all API keys (admin)
export async function getAllAPIKeys() {
  return prisma.aPIKey.findMany({
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      rateLimit: true,
      isEnabled: true,
      lastUsedAt: true,
      usageCount: true,
      expiresAt: true,
      createdAt: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Available scopes
export const API_SCOPES = {
  // Read scopes
  'read:budget': 'Read budget data',
  'read:otb': 'Read OTB plans',
  'read:sku': 'Read SKU proposals',
  'read:analytics': 'Read analytics data',
  'read:users': 'Read user data',

  // Write scopes
  'write:budget': 'Create/update budgets',
  'write:otb': 'Create/update OTB plans',
  'write:sku': 'Create/update SKU proposals',

  // Admin scopes
  'admin:users': 'Manage users',
  'admin:settings': 'Manage settings',

  // Wildcards
  'read:*': 'Read all data',
  'write:*': 'Write all data',
  '*': 'Full access',
} as const;

export type APIScope = keyof typeof API_SCOPES;
