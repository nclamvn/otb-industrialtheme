/**
 * Insight Generation Prompts
 * Prompts for proactive AI insights
 */

export const INSIGHT_PROMPTS = {
  /**
   * Margin Analysis
   */
  MARGIN_ANALYSIS: `Analyze the margin performance across all categories.
Identify:
- Categories with margin below 40% (warning)
- Categories with margin below 30% (critical)
- Categories with exceptional margin (>60%)

Suggest pricing or cost adjustments for underperforming categories.`,

  /**
   * Budget Utilization
   */
  BUDGET_UTILIZATION: `Analyze budget utilization:
- Compare allocated vs. planned budget
- Identify categories with significant variance (>10%)
- Suggest reallocation if needed

Focus on actionable recommendations.`,

  /**
   * Seasonal Trends
   */
  SEASONAL_TRENDS: `Compare current performance with expected seasonal patterns:
- Are sales tracking to plan?
- Which categories are over/under-performing vs. seasonality?
- Any early warning signs for end-of-season inventory?`,

  /**
   * Category Performance Ranking
   */
  CATEGORY_RANKING: `Rank categories by overall performance considering:
- Margin contribution
- Sales velocity
- Budget efficiency
- Inventory health

Provide top 3 performers and bottom 3 needing attention.`,

  /**
   * Quick Health Check
   */
  HEALTH_CHECK: `Provide a quick health check of the OTB plan:
- Overall status: 🟢 Healthy / 🟡 Needs Attention / 🔴 Critical
- Key metrics summary
- Top priority action (if any)

Keep response under 100 words.`,
};

export default INSIGHT_PROMPTS;
