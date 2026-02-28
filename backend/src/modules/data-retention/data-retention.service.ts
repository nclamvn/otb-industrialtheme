import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface RetentionPolicy {
  entityType: string;
  retentionDays: number;
}

const DEFAULT_POLICIES: RetentionPolicy[] = [
  { entityType: 'auditLog', retentionDays: 365 },
];

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(private prisma: PrismaService) {}

  /** GDPR: Purge expired records based on retention policies */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeExpiredData(): Promise<{ purged: Record<string, number> }> {
    const results: Record<string, number> = {};

    for (const policy of DEFAULT_POLICIES) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      try {
        if (policy.entityType === 'auditLog') {
          const result = await this.prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoffDate } },
          });
          results[policy.entityType] = result.count;
          this.logger.log(`Purged ${result.count} ${policy.entityType} records older than ${policy.retentionDays} days`);
        }
      } catch (error) {
        this.logger.error(`Failed to purge ${policy.entityType}: ${error.message}`);
        results[policy.entityType] = -1;
      }
    }

    return { purged: results };
  }

  /** GDPR: Anonymize user data (replace PII with hashed values) */
  async anonymizeUser(userId: string): Promise<void> {
    const anonymized = `ANON_${userId.substring(0, 8)}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: anonymized,
        email: `${anonymized}@deleted.local`,
        isActive: false,
      },
    });

    this.logger.log(`Anonymized user ${userId}`);
  }

  /** GDPR: Export user data as JSON */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const budgets = await this.prisma.budget.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        budgetCode: true,
        status: true,
        totalBudget: true,
        createdAt: true,
      },
    });

    const approvals = await this.prisma.approval.findMany({
      where: { deciderId: userId },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        action: true,
        decidedAt: true,
      },
    });

    return {
      exportDate: new Date().toISOString(),
      user,
      budgets,
      approvals,
    };
  }

  /** Get retention status overview */
  async getRetentionStatus(): Promise<Record<string, unknown>> {
    const policies = DEFAULT_POLICIES.map((p) => ({
      ...p,
      cutoffDate: new Date(Date.now() - p.retentionDays * 86400000).toISOString(),
    }));

    return { policies };
  }
}
