// ERP Sync Engine
import { prisma } from '@/lib/prisma';
import { ERPType, SyncDirection, SyncStatus } from '@prisma/client';
import { BaseERPAdapter, SyncResult } from '../adapters/base-adapter';
import { CSVAdapter } from '../adapters/csv-adapter';
import { dispatchWebhook, WEBHOOK_EVENTS } from '@/lib/webhooks';

// Adapter factory
export function createAdapter(
  type: ERPType,
  config: {
    host: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  }
): BaseERPAdapter {
  switch (type) {
    case ERPType.CSV_IMPORT:
      return new CSVAdapter(config);
    case ERPType.SAP_B1:
    case ERPType.SAP_HANA:
    case ERPType.ORACLE_NETSUITE:
    case ERPType.MICROSOFT_DYNAMICS:
    case ERPType.API_CUSTOM:
      // For now, return CSV adapter as placeholder
      // In production, implement specific adapters
      // Adapter for ${type} not implemented, using CSV fallback
      return new CSVAdapter(config);
    default:
      throw new Error(`Unsupported ERP type: ${type}`);
  }
}

// Sync options
export interface SyncOptions {
  connectionId: string;
  entityType: string;
  direction: SyncDirection;
  triggeredById?: string;
  fullSync?: boolean;
}

// Run sync
export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const { connectionId, entityType, direction, triggeredById, fullSync } = options;

  // Get connection
  const connection = await prisma.eRPConnection.findUnique({
    where: { id: connectionId },
    include: {
      fieldMappings: {
        where: { entityType },
      },
    },
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  if (!connection.isEnabled) {
    throw new Error('Connection is disabled');
  }

  // Create sync log
  const syncLog = await prisma.eRPSyncLog.create({
    data: {
      connectionId,
      syncType: fullSync ? 'full' : 'delta',
      entityType,
      direction,
      status: SyncStatus.IN_PROGRESS,
      startedAt: new Date(),
      triggeredById,
    },
  });

  // Update connection status
  await prisma.eRPConnection.update({
    where: { id: connectionId },
    data: { lastSyncStatus: SyncStatus.IN_PROGRESS },
  });

  // Dispatch webhook
  await dispatchWebhook(WEBHOOK_EVENTS.SYNC_STARTED, {
    connectionId,
    connectionName: connection.name,
    entityType,
    direction,
  });

  try {
    // Create adapter
    const adapter = createAdapter(connection.type, {
      host: connection.host,
      port: connection.port || undefined,
      database: connection.database || undefined,
      username: connection.username || undefined,
      password: connection.password || undefined,
      apiKey: connection.apiKey || undefined,
    });

    // Determine last sync time for delta sync
    const lastSyncAt = fullSync ? undefined : connection.lastSyncAt || undefined;

    let result: SyncResult;

    if (direction === SyncDirection.INBOUND || direction === SyncDirection.BIDIRECTIONAL) {
      // Fetch data from ERP
      const entities = await adapter.fetchEntities(entityType, lastSyncAt);

      // Process and store entities
      // (This would be implemented based on specific entity types)
      result = {
        success: true,
        recordsTotal: entities.length,
        recordsSuccess: entities.length,
        recordsFailed: 0,
        startedAt: syncLog.startedAt,
        completedAt: new Date(),
      };
    } else {
      // Outbound sync - would fetch from DAFC and push to ERP
      result = {
        success: true,
        recordsTotal: 0,
        recordsSuccess: 0,
        recordsFailed: 0,
        startedAt: syncLog.startedAt,
        completedAt: new Date(),
      };
    }

    // Update sync log
    await prisma.eRPSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: result.success ? SyncStatus.SUCCESS : SyncStatus.PARTIAL,
        recordsTotal: result.recordsTotal,
        recordsSuccess: result.recordsSuccess,
        recordsFailed: result.recordsFailed,
        errors: result.errors ? result.errors : undefined,
        completedAt: result.completedAt,
      },
    });

    // Update connection
    await prisma.eRPConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: result.completedAt,
        lastSyncStatus: result.success ? SyncStatus.SUCCESS : SyncStatus.PARTIAL,
      },
    });

    // Dispatch webhook
    await dispatchWebhook(WEBHOOK_EVENTS.SYNC_COMPLETED, {
      connectionId,
      connectionName: connection.name,
      entityType,
      direction,
      recordsTotal: result.recordsTotal,
      recordsSuccess: result.recordsSuccess,
      recordsFailed: result.recordsFailed,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update sync log with error
    await prisma.eRPSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        errors: [{ error: errorMessage }],
        completedAt: new Date(),
      },
    });

    // Update connection status
    await prisma.eRPConnection.update({
      where: { id: connectionId },
      data: { lastSyncStatus: SyncStatus.FAILED },
    });

    // Dispatch webhook
    await dispatchWebhook(WEBHOOK_EVENTS.SYNC_FAILED, {
      connectionId,
      connectionName: connection.name,
      entityType,
      direction,
      error: errorMessage,
    });

    throw error;
  }
}

// Test connection
export async function testConnection(connectionId: string): Promise<boolean> {
  const connection = await prisma.eRPConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error('Connection not found');
  }

  const adapter = createAdapter(connection.type, {
    host: connection.host,
    port: connection.port || undefined,
    database: connection.database || undefined,
    username: connection.username || undefined,
    password: connection.password || undefined,
    apiKey: connection.apiKey || undefined,
  });

  return adapter.testConnection();
}

// Get sync logs
export async function getSyncLogs(
  connectionId: string,
  limit: number = 50,
  offset: number = 0
) {
  return prisma.eRPSyncLog.findMany({
    where: { connectionId },
    orderBy: { startedAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      triggeredBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
