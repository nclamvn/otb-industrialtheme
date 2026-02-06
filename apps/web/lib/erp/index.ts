// ERP Integration Module Index
export { BaseERPAdapter, canSyncInbound, canSyncOutbound } from './adapters/base-adapter';
export { CSVAdapter } from './adapters/csv-adapter';
export { createAdapter, runSync, testConnection, getSyncLogs } from './sync/sync-engine';
export type { SyncResult, EntityData, ConnectionConfig, FieldMapping } from './adapters/base-adapter';
export type { SyncOptions } from './sync/sync-engine';

import { prisma } from '@/lib/prisma';
import { ERPType, SyncDirection } from '@prisma/client';

// Create ERP connection
export async function createERPConnection(params: {
  name: string;
  type: ERPType;
  host: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  syncDirection?: SyncDirection;
}) {
  return prisma.eRPConnection.create({
    data: {
      name: params.name,
      type: params.type,
      host: params.host,
      port: params.port,
      database: params.database,
      username: params.username,
      password: params.password,
      apiKey: params.apiKey,
      syncDirection: params.syncDirection || SyncDirection.BIDIRECTIONAL,
    },
  });
}

// Update ERP connection
export async function updateERPConnection(
  connectionId: string,
  params: {
    name?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    syncDirection?: SyncDirection;
    isEnabled?: boolean;
  }
) {
  return prisma.eRPConnection.update({
    where: { id: connectionId },
    data: params,
  });
}

// Delete ERP connection
export async function deleteERPConnection(connectionId: string): Promise<void> {
  await prisma.eRPConnection.delete({
    where: { id: connectionId },
  });
}

// Get ERP connection by ID
export async function getERPConnectionById(connectionId: string) {
  return prisma.eRPConnection.findUnique({
    where: { id: connectionId },
    include: {
      fieldMappings: true,
      _count: {
        select: { syncLogs: true },
      },
    },
  });
}

// Get all ERP connections
export async function getAllERPConnections() {
  return prisma.eRPConnection.findMany({
    include: {
      _count: {
        select: { syncLogs: true, fieldMappings: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Update field mappings
export async function updateFieldMappings(
  connectionId: string,
  entityType: string,
  mappings: Array<{
    sourceField: string;
    targetField: string;
    transformation?: string;
    defaultValue?: string;
    isRequired?: boolean;
  }>
) {
  // Delete existing mappings for this entity type
  await prisma.eRPFieldMapping.deleteMany({
    where: { connectionId, entityType },
  });

  // Create new mappings
  if (mappings.length > 0) {
    await prisma.eRPFieldMapping.createMany({
      data: mappings.map((m) => ({
        connectionId,
        entityType,
        sourceField: m.sourceField,
        targetField: m.targetField,
        transformation: m.transformation,
        defaultValue: m.defaultValue,
        isRequired: m.isRequired ?? false,
      })),
    });
  }

  return prisma.eRPFieldMapping.findMany({
    where: { connectionId, entityType },
  });
}

// Get field mappings
export async function getFieldMappings(connectionId: string, entityType?: string) {
  return prisma.eRPFieldMapping.findMany({
    where: {
      connectionId,
      ...(entityType ? { entityType } : {}),
    },
  });
}
