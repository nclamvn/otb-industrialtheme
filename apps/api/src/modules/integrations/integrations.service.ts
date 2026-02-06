import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // API KEYS
  // ============================================

  async getApiKeys(userId: string) {
    return this.prisma.aPIKey.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        rateLimit: true,
        lastUsedAt: true,
        usageCount: true,
        isEnabled: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(data: { name: string; scopes: string[]; rateLimit?: number; expiresAt?: Date }, userId: string) {
    const key = crypto.randomBytes(32).toString('hex');
    const prefix = key.substring(0, 8);

    const apiKey = await this.prisma.aPIKey.create({
      data: {
        name: data.name,
        key,
        prefix,
        scopes: data.scopes,
        rateLimit: data.rateLimit || 1000,
        expiresAt: data.expiresAt,
        createdById: userId,
      },
    });

    return {
      ...apiKey,
      key, // Only return full key on creation
    };
  }

  async deleteApiKey(id: string, userId: string) {
    const existing = await this.prisma.aPIKey.findFirst({
      where: { id, createdById: userId },
    });

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.aPIKey.delete({ where: { id } });
    return { deleted: true };
  }

  async toggleApiKey(id: string, userId: string, isEnabled: boolean) {
    const existing = await this.prisma.aPIKey.findFirst({
      where: { id, createdById: userId },
    });

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    return this.prisma.aPIKey.update({
      where: { id },
      data: { isEnabled },
    });
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  async getWebhooks(userId: string) {
    return this.prisma.webhook.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
  }, userId: string) {
    const secret = crypto.randomBytes(32).toString('hex');

    return this.prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        headers: data.headers as any,
        createdById: userId,
      },
    });
  }

  async updateWebhook(id: string, data: {
    name?: string;
    url?: string;
    events?: string[];
    isEnabled?: boolean;
  }, userId: string) {
    const existing = await this.prisma.webhook.findFirst({
      where: { id, createdById: userId },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async deleteWebhook(id: string, userId: string) {
    const existing = await this.prisma.webhook.findFirst({
      where: { id, createdById: userId },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.webhook.delete({ where: { id } });
    return { deleted: true };
  }

  async testWebhook(id: string, userId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, createdById: userId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    // Create test delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId: id,
        event: 'test',
        payload: { test: true, timestamp: new Date().toISOString() },
        status: 'SUCCESS',
        statusCode: 200,
        responseTime: 100,
      },
    });

    // Update webhook stats
    await this.prisma.webhook.update({
      where: { id },
      data: {
        lastTriggeredAt: new Date(),
        successCount: { increment: 1 },
      },
    });

    return {
      success: true,
      delivery,
    };
  }

  // ============================================
  // ERP CONNECTIONS
  // ============================================

  async getERPConnections() {
    return this.prisma.eRPConnection.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getERPConnection(id: string) {
    const connection = await this.prisma.eRPConnection.findUnique({
      where: { id },
      include: {
        fieldMappings: true,
        syncLogs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('ERP connection not found');
    }

    return connection;
  }

  async createERPConnection(data: {
    name: string;
    type: string;
    host: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  }) {
    return this.prisma.eRPConnection.create({
      data: {
        name: data.name,
        type: data.type as any,
        host: data.host,
        port: data.port,
        database: data.database,
        username: data.username,
        password: data.password,
        apiKey: data.apiKey,
        syncDirection: 'BIDIRECTIONAL',
      },
    });
  }

  async updateERPConnection(id: string, data: {
    name?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    isEnabled?: boolean;
    syncDirection?: string;
  }) {
    const existing = await this.prisma.eRPConnection.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('ERP connection not found');
    }

    return this.prisma.eRPConnection.update({
      where: { id },
      data: data as any,
    });
  }

  async deleteERPConnection(id: string) {
    const existing = await this.prisma.eRPConnection.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('ERP connection not found');
    }

    await this.prisma.eRPConnection.delete({ where: { id } });
    return { deleted: true };
  }

  // ERP Field Mappings
  async getERPMappings(connectionId: string) {
    return this.prisma.eRPFieldMapping.findMany({
      where: { connectionId },
    });
  }

  async saveERPMappings(connectionId: string, mappings: Array<{
    entityType: string;
    sourceField: string;
    targetField: string;
    transformation?: string;
    defaultValue?: string;
    isRequired?: boolean;
  }>) {
    // Delete existing mappings
    await this.prisma.eRPFieldMapping.deleteMany({
      where: { connectionId },
    });

    // Create new mappings
    await this.prisma.eRPFieldMapping.createMany({
      data: mappings.map((m) => ({
        connectionId,
        ...m,
      })),
    });

    return this.getERPMappings(connectionId);
  }

  // ERP Sync
  async syncERP(connectionId: string, entityType: string, userId: string) {
    const connection = await this.prisma.eRPConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('ERP connection not found');
    }

    if (!connection.isEnabled) {
      throw new BadRequestException('ERP connection is disabled');
    }

    // Create sync log
    const syncLog = await this.prisma.eRPSyncLog.create({
      data: {
        connectionId,
        syncType: 'MANUAL',
        entityType,
        direction: connection.syncDirection,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        triggeredById: userId,
      },
    });

    // Simulate sync (in real implementation, this would be async)
    const recordsTotal = Math.floor(Math.random() * 100) + 10;
    const recordsSuccess = recordsTotal - Math.floor(Math.random() * 5);
    const recordsFailed = recordsTotal - recordsSuccess;

    // Update sync log
    await this.prisma.eRPSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: recordsFailed > 0 ? 'PARTIAL' : 'SUCCESS',
        recordsTotal,
        recordsSuccess,
        recordsFailed,
        completedAt: new Date(),
      },
    });

    // Update connection last sync
    await this.prisma.eRPConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: recordsFailed > 0 ? 'PARTIAL' : 'SUCCESS',
      },
    });

    return this.prisma.eRPSyncLog.findUnique({
      where: { id: syncLog.id },
    });
  }

  // ============================================
  // FILE STORAGE (S3)
  // ============================================

  async getPresignedUrl(data: { filename: string; contentType: string; category: string }, userId: string) {
    // In real implementation, this would generate actual S3 presigned URL
    const key = `${data.category}/${Date.now()}-${data.filename}`;

    return {
      url: `https://s3.amazonaws.com/dafc-bucket/${key}?X-Amz-Signature=simulated`,
      key,
      bucket: 'dafc-bucket',
      expiresIn: 3600,
    };
  }

  async getFiles(query: { category?: string; entityType?: string; entityId?: string }, userId: string) {
    const where: any = { uploadedById: userId };
    if (query.category) where.category = query.category;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    return this.prisma.storedFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerFile(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    key: string;
    bucket: string;
    category: string;
    entityType?: string;
    entityId?: string;
  }, userId: string) {
    return this.prisma.storedFile.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        bucket: data.bucket,
        key: data.key,
        region: 'ap-southeast-1',
        category: data.category as any,
        entityType: data.entityType,
        entityId: data.entityId,
        uploadedById: userId,
      },
    });
  }
}
