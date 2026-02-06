/**
 * OTB Context Builder
 * Builds context string from OTB data for AI prompts
 */

import { OTBContext, ContextBuildOptions, OTBMetrics, CategoryData, AlertData } from './types';

export class OTBContextBuilder {
  private defaultOptions: ContextBuildOptions = {
    includeCategories: true,
    maxCategories: 10,
    includeAlerts: true,
    includeMetrics: true,
  };

  /**
   * Build context string for AI prompt
   */
  build(context: OTBContext, options?: ContextBuildOptions): string {
    const opts = { ...this.defaultOptions, ...options };
    const sections: string[] = [];

    // Header
    sections.push(this.buildHeader(context));

    // Metrics
    if (opts.includeMetrics) {
      sections.push(this.buildMetrics(context.metrics));
    }

    // Categories
    if (opts.includeCategories && context.categories.length > 0) {
      sections.push(this.buildCategories(context.categories, opts.maxCategories));
    }

    // Alerts
    if (opts.includeAlerts && context.alerts.length > 0) {
      sections.push(this.buildAlerts(context.alerts));
    }

    return sections.join('\n\n');
  }

  private buildHeader(context: OTBContext): string {
    const parts = [
      `## OTB Plan: ${context.planName}`,
      '',
      '| Dimension | Value |',
      '|-----------|-------|',
    ];

    if (context.division) parts.push(`| Division | ${context.division} |`);
    if (context.brand) parts.push(`| Brand | ${context.brand} |`);
    if (context.season) parts.push(`| Season | ${context.season} |`);
    if (context.year) parts.push(`| Year | ${context.year} |`);
    if (context.asOfDate) parts.push(`| As of Date | ${context.asOfDate} |`);

    return parts.join('\n');
  }

  private buildMetrics(metrics: OTBMetrics): string {
    return [
      '### Key Metrics',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Total Budget | ${this.formatCurrency(metrics.totalBudget)} |`,
      `| Total Units | ${this.formatNumber(metrics.totalUnits)} |`,
      `| AUR (Avg Unit Retail) | ${this.formatCurrency(metrics.aur)} |`,
      `| AUC (Avg Unit Cost) | ${this.formatCurrency(metrics.auc)} |`,
      `| Margin % | ${this.formatPercent(metrics.margin)} |`,
      `| Sell-Through % | ${this.formatPercent(metrics.sellThrough)} |`,
      `| Buy % | ${this.formatPercent(metrics.buyPercentage)} |`,
      `| Sales % | ${this.formatPercent(metrics.salesPercentage)} |`,
    ].join('\n');
  }

  private buildCategories(categories: CategoryData[], max?: number): string {
    const displayCategories = max ? categories.slice(0, max) : categories;

    const rows = displayCategories.map(cat => {
      const performance = cat.performance
        ? (cat.performance === 'above' ? '📈' : cat.performance === 'below' ? '📉' : '➡️')
        : '';
      return `| ${cat.name} | ${this.formatCurrency(cat.budget)} | ${this.formatNumber(cat.units)} | ${this.formatPercent(cat.margin)} | ${performance} |`;
    });

    return [
      '### Categories Breakdown',
      '',
      '| Category | Budget | Units | Margin | Trend |',
      '|----------|--------|-------|--------|-------|',
      ...rows,
      categories.length > displayCategories.length
        ? `\n*Showing top ${max} of ${categories.length} categories*`
        : '',
    ].join('\n');
  }

  private buildAlerts(alerts: AlertData[]): string {
    const alertRows = alerts.map(alert => {
      const icon = alert.type === 'error' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵';
      return `- ${icon} ${alert.message}`;
    });

    return [
      '### Alerts & Observations',
      '',
      ...alertRows,
    ].join('\n');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  private formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Build minimal context for quick queries
   */
  buildMinimal(context: OTBContext): string {
    return `OTB Plan "${context.planName}" - Budget: ${this.formatCurrency(context.metrics.totalBudget)}, Units: ${this.formatNumber(context.metrics.totalUnits)}, Margin: ${this.formatPercent(context.metrics.margin)}`;
  }
}

export default OTBContextBuilder;
