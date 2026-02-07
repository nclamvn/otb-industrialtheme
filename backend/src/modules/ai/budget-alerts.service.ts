import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

interface AlertInput {
  budgetId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  metricValue: number;
  threshold: number;
  category?: string;
}

@Injectable()
export class BudgetAlertsService {
  private readonly logger = new Logger(BudgetAlertsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Run every hour to check all active budgets for alerts.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAllBudgets() {
    this.logger.log('Running scheduled budget alert check...');
    const activeBudgets = await this.prisma.budget.findMany({
      where: { status: { in: ['APPROVED', 'LEVEL1_APPROVED'] } },
      include: {
        details: true,
        proposals: {
          where: { status: { not: 'REJECTED' } },
          include: { products: true },
        },
      },
    });

    let totalAlerts = 0;
    for (const budget of activeBudgets) {
      const alerts = await this.analyzeBudget(budget);
      totalAlerts += alerts.length;
    }
    this.logger.log(`Budget check complete: ${totalAlerts} new alert(s) across ${activeBudgets.length} budget(s)`);
  }

  /**
   * Analyze a single budget and generate alerts.
   */
  async analyzeBudget(budget: any): Promise<AlertInput[]> {
    const alerts: AlertInput[] = [];

    const totalBudget = Number(budget.totalBudget);
    if (totalBudget <= 0) return alerts;

    const committed = this.calculateCommitted(budget.proposals);
    const planned = this.calculatePlanned(budget.proposals);
    const utilizationPct = (committed / totalBudget) * 100;

    // 1. CRITICAL: Over budget
    if (committed > totalBudget) {
      alerts.push({
        budgetId: budget.id,
        alertType: 'over_budget',
        severity: 'critical',
        title: 'Budget Exceeded',
        message: `Committed amount (${this.fmt(committed)}) exceeds budget (${this.fmt(totalBudget)}) by ${this.fmt(committed - totalBudget)}`,
        metricValue: committed,
        threshold: totalBudget,
      });
    }
    // 2. WARNING: Approaching budget (>90%)
    else if (utilizationPct >= 90) {
      alerts.push({
        budgetId: budget.id,
        alertType: 'over_budget',
        severity: 'warning',
        title: 'Budget Nearly Exhausted',
        message: `${utilizationPct.toFixed(1)}% of budget committed. Only ${this.fmt(totalBudget - committed)} remaining.`,
        metricValue: utilizationPct,
        threshold: 90,
      });
    }

    // 3. INFO: Under-utilized (<50% with <14 days left)
    const seasonEnd = this.getSeasonEndDate(budget);
    const daysRemaining = Math.ceil(
      (seasonEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (daysRemaining <= 14 && daysRemaining > 0 && utilizationPct < 50) {
      alerts.push({
        budgetId: budget.id,
        alertType: 'under_utilized',
        severity: 'info',
        title: 'Budget Under-utilized',
        message: `Only ${utilizationPct.toFixed(1)}% utilized with ${daysRemaining} days remaining. Consider adding more SKUs or reallocating.`,
        metricValue: utilizationPct,
        threshold: 50,
      });
    }

    // 4. WARNING: Spending pace — projected overshoot
    const pace = await this.calculateSpendingPace(budget.id, totalBudget);
    if (pace.projectedTotal > totalBudget * 1.1) {
      alerts.push({
        budgetId: budget.id,
        alertType: 'pace_warning',
        severity: 'warning',
        title: 'Spending Pace Alert',
        message: `At current pace, projected spend is ${this.fmt(pace.projectedTotal)} (${((pace.projectedTotal / totalBudget) * 100).toFixed(0)}% of budget). May be exhausted in ${pace.daysUntilExhausted} days.`,
        metricValue: pace.projectedTotal,
        threshold: totalBudget,
      });
    }

    // 5. WARNING: Category imbalance (>60%)
    const catAlerts = this.checkCategoryBalance(budget);
    alerts.push(...catAlerts);

    // Save alerts (de-duplicate within 24h)
    await this.saveAlerts(alerts);

    // Take daily snapshot
    await this.takeSnapshot(budget.id, committed, planned, utilizationPct);

    return alerts;
  }

  /**
   * Get alerts for a user / budget — used by the API.
   */
  async getAlerts(options?: { budgetId?: string; unreadOnly?: boolean }) {
    const where: any = { isDismissed: false };
    if (options?.budgetId) where.budgetId = options.budgetId;
    if (options?.unreadOnly) where.isRead = false;

    return this.prisma.budgetAlert.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        budget: {
          select: {
            budgetCode: true,
            groupBrand: { select: { name: true } },
          },
        },
      },
      take: 20,
    });
  }

  async markAsRead(alertId: string) {
    return this.prisma.budgetAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  async dismissAlert(alertId: string) {
    return this.prisma.budgetAlert.update({
      where: { id: alertId },
      data: { isDismissed: true },
    });
  }

  // ── private helpers ────────────────────────────────────────────────────

  private calculateCommitted(proposals: any[]): number {
    return proposals
      .filter((p) => p.status === 'APPROVED')
      .reduce((sum, p) => sum + Number(p.totalValue), 0);
  }

  private calculatePlanned(proposals: any[]): number {
    return proposals
      .filter((p) =>
        ['DRAFT', 'SUBMITTED', 'LEVEL1_APPROVED'].includes(p.status),
      )
      .reduce((sum, p) => sum + Number(p.totalValue), 0);
  }

  private async calculateSpendingPace(
    budgetId: string,
    totalBudget: number,
  ): Promise<{
    projectedTotal: number;
    daysUntilExhausted: number;
  }> {
    const snapshots = await this.prisma.budgetSnapshot.findMany({
      where: { budgetId },
      orderBy: { snapshotDate: 'desc' },
      take: 7,
    });

    if (snapshots.length < 2) {
      return { projectedTotal: 0, daysUntilExhausted: 999 };
    }

    const newest = snapshots[0];
    const oldest = snapshots[snapshots.length - 1];
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (new Date(newest.snapshotDate).getTime() -
          new Date(oldest.snapshotDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const spentDiff =
      Number(newest.totalCommitted) - Number(oldest.totalCommitted);
    const dailyRate = spentDiff / daysDiff;

    const remaining = totalBudget - Number(newest.totalCommitted);
    const daysUntilExhausted =
      dailyRate > 0 ? Math.ceil(remaining / dailyRate) : 999;
    const projectedTotal = Number(newest.totalCommitted) + dailyRate * 30;

    return { projectedTotal, daysUntilExhausted };
  }

  private checkCategoryBalance(budget: any): AlertInput[] {
    const alerts: AlertInput[] = [];
    const categorySpend = new Map<string, number>();

    for (const proposal of budget.proposals || []) {
      for (const product of proposal.products || []) {
        const cat = product.category || 'Unknown';
        categorySpend.set(
          cat,
          (categorySpend.get(cat) || 0) + Number(product.totalValue),
        );
      }
    }

    const totalSpend = Array.from(categorySpend.values()).reduce(
      (a, b) => a + b,
      0,
    );
    if (totalSpend === 0) return alerts;

    for (const [category, spend] of categorySpend) {
      const pct = (spend / totalSpend) * 100;
      if (pct > 60) {
        alerts.push({
          budgetId: budget.id,
          alertType: 'category_imbalance',
          severity: 'warning',
          title: 'Category Imbalance',
          message: `${category} accounts for ${pct.toFixed(0)}% of total spend. Consider diversifying.`,
          metricValue: pct,
          threshold: 60,
          category,
        });
      }
    }
    return alerts;
  }

  private getSeasonEndDate(budget: any): Date {
    const year = budget.fiscalYear || new Date().getFullYear();
    if (budget.seasonGroupId === 'SS') {
      return budget.seasonType === 'pre'
        ? new Date(year, 2, 31)
        : new Date(year, 5, 30);
    }
    return budget.seasonType === 'pre'
      ? new Date(year, 8, 30)
      : new Date(year, 11, 31);
  }

  private async saveAlerts(alerts: AlertInput[]) {
    for (const alert of alerts) {
      const existing = await this.prisma.budgetAlert.findFirst({
        where: {
          budgetId: alert.budgetId,
          alertType: alert.alertType,
          category: alert.category ?? undefined,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!existing) {
        await this.prisma.budgetAlert.create({ data: alert as any });
      }
    }
  }

  private async takeSnapshot(
    budgetId: string,
    committed: number,
    planned: number,
    utilization: number,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.budgetSnapshot.upsert({
      where: {
        budgetId_snapshotDate: { budgetId, snapshotDate: today },
      },
      update: {
        totalCommitted: committed,
        totalPlanned: planned,
        utilizationPct: utilization,
      },
      create: {
        budgetId,
        snapshotDate: today,
        totalCommitted: committed,
        totalPlanned: planned,
        utilizationPct: utilization,
      },
    });
  }

  private fmt(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
