import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  // AI Chat endpoints
  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId, isArchived: false },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getConversation(id: string, userId: string) {
    return this.prisma.aIConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createConversation(userId: string, title?: string) {
    return this.prisma.aIConversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });
  }

  async addMessage(
    conversationId: string,
    role: 'USER' | 'ASSISTANT',
    content: string,
  ) {
    const message = await this.prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
      },
    });

    // Update conversation lastMessageAt
    await this.prisma.aIConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async deleteConversation(id: string, userId: string) {
    return this.prisma.aIConversation.deleteMany({
      where: { id, userId },
    });
  }

  // AI Suggestions
  async getSuggestions(userId: string, query?: {
    type?: string;
    status?: string;
    seasonId?: string;
    brandId?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, status, seasonId, brandId, page = 1, limit = 20 } = query || {};

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (seasonId) where.seasonId = seasonId;
    if (brandId) where.brandId = brandId;

    const [data, total] = await Promise.all([
      this.prisma.aISuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          season: true,
          brand: true,
          category: true,
        },
      }),
      this.prisma.aISuggestion.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateSuggestionStatus(
    id: string,
    userId: string,
    status: string,
    reviewNotes?: string,
  ) {
    return this.prisma.aISuggestion.updateMany({
      where: { id, userId },
      data: {
        status: status as any,
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });
  }

  // AI Generated Plans
  async getGeneratedPlans(userId: string, query?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, status, page = 1, limit = 20 } = query || {};

    const where: any = { userId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.aIGeneratedPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          season: true,
          brand: true,
        },
      }),
      this.prisma.aIGeneratedPlan.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Predictive Alerts
  async getPredictiveAlerts(userId: string, query?: {
    type?: string;
    severity?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, severity, status, page = 1, limit = 20 } = query || {};

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.predictiveAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          season: true,
          brand: true,
          category: true,
        },
      }),
      this.prisma.predictiveAlert.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async acknowledgePredictiveAlert(id: string, userId: string) {
    return this.prisma.predictiveAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      },
    });
  }

  // Get dashboard summary for AI
  async getDashboardSummary(userId: string) {
    const [
      totalSuggestions,
      pendingSuggestions,
      activeAlerts,
      criticalAlerts,
    ] = await Promise.all([
      this.prisma.aISuggestion.count({ where: { userId } }),
      this.prisma.aISuggestion.count({ where: { userId, status: 'PENDING' } }),
      this.prisma.predictiveAlert.count({ where: { status: 'ACTIVE' } }),
      this.prisma.predictiveAlert.count({ where: { status: 'ACTIVE', severity: 'CRITICAL' } }),
    ]);

    return {
      suggestions: {
        total: totalSuggestions,
        pending: pendingSuggestions,
      },
      alerts: {
        active: activeAlerts,
        critical: criticalAlerts,
      },
    };
  }
}
