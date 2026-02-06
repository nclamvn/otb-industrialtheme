// AI Tool Definitions for Claude
// These tools enable the AI to query data, calculate metrics, and perform actions

export const AI_TOOLS = [
  {
    name: 'query_data',
    description: `Query the database to get information about sales, inventory, OTB plans, SKUs, budgets, etc.
Use this tool when the user asks questions like:
- "Doanh số tháng này là bao nhiêu?" (What are this month's sales?)
- "Top 10 SKU bán chạy nhất" (Top 10 best selling SKUs)
- "Tồn kho hiện tại" (Current inventory)
- "Show me all brands" or "List all seasons"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query_type: {
          type: 'string',
          enum: [
            'sales_summary',
            'inventory_status',
            'otb_status',
            'sku_performance',
            'brand_performance',
            'category_performance',
            'budget_status',
            'top_sellers',
            'slow_movers',
            'custom',
          ],
          description: 'Type of query to execute',
        },
        filters: {
          type: 'object',
          properties: {
            seasonId: { type: 'string' },
            brandId: { type: 'string' },
            categoryId: { type: 'string' },
            dateFrom: { type: 'string', format: 'date' },
            dateTo: { type: 'string', format: 'date' },
            limit: { type: 'number', default: 10 },
          },
          description: 'Optional filters to apply to the query',
        },
        custom_query: {
          type: 'string',
          description: 'Natural language description for custom queries',
        },
      },
      required: ['query_type'],
    },
  },
  {
    name: 'calculate_metrics',
    description: `Calculate KPIs and metrics like sell-through rate, gross margin, inventory turnover, OTB remaining, etc.
Use this tool when the user asks:
- "Sell-through rate là bao nhiêu?" (What is the sell-through rate?)
- "Gross margin của brand X"
- "OTB còn bao nhiêu?" (How much OTB remaining?)
- "Inventory turnover ratio"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        metric: {
          type: 'string',
          enum: [
            'sell_through_rate',
            'gross_margin',
            'inventory_turnover',
            'otb_remaining',
            'otb_utilization',
            'weeks_of_supply',
            'stock_to_sales_ratio',
            'markdown_rate',
            'average_selling_price',
            'units_per_transaction',
          ],
          description: 'The metric to calculate',
        },
        context: {
          type: 'object',
          properties: {
            seasonId: { type: 'string' },
            brandId: { type: 'string' },
            categoryId: { type: 'string' },
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'quarter', 'season', 'year'],
            },
          },
          description: 'Context for the calculation',
        },
        compare_with: {
          type: 'string',
          enum: ['previous_period', 'last_year', 'target', 'none'],
          description: 'Compare with another period',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'generate_chart',
    description: `Generate chart data for visualization. Use this when user asks for visual representation of data.
Examples:
- "Vẽ chart doanh số 6 tháng" (Draw sales chart for 6 months)
- "Show trend of inventory"
- "Biểu đồ so sánh brands"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        chart_type: {
          type: 'string',
          enum: ['line', 'bar', 'pie', 'area', 'combo'],
          description: 'Type of chart to generate',
        },
        data_type: {
          type: 'string',
          enum: [
            'sales_trend',
            'inventory_trend',
            'otb_utilization',
            'category_mix',
            'brand_comparison',
            'sell_through_trend',
            'margin_trend',
          ],
          description: 'What data to visualize',
        },
        time_range: {
          type: 'object',
          properties: {
            periods: { type: 'number', default: 6 },
            unit: {
              type: 'string',
              enum: ['day', 'week', 'month'],
              default: 'month',
            },
          },
        },
        filters: {
          type: 'object',
          properties: {
            seasonId: { type: 'string' },
            brandId: { type: 'string' },
            categoryId: { type: 'string' },
          },
        },
      },
      required: ['chart_type', 'data_type'],
    },
  },
  {
    name: 'get_alerts',
    description: `Get current alerts and notifications. Use when user asks about warnings, alerts, or issues.
Examples:
- "Có cảnh báo gì không?" (Are there any alerts?)
- "Show me inventory warnings"
- "Những vấn đề cần xử lý"`,
    input_schema: {
      type: 'object' as const,
      properties: {
        alert_type: {
          type: 'string',
          enum: [
            'all',
            'stockout_risk',
            'overstock_risk',
            'otb_overrun',
            'approval_pending',
            'kpi_threshold',
            'margin_decline',
          ],
          description: 'Type of alerts to retrieve',
        },
        severity: {
          type: 'string',
          enum: ['all', 'critical', 'warning', 'info'],
          default: 'all',
        },
        limit: {
          type: 'number',
          default: 10,
        },
      },
      required: ['alert_type'],
    },
  },
  {
    name: 'get_suggestions',
    description: `Get AI-powered suggestions and recommendations. Use when user asks for advice or recommendations.
Examples:
- "Nên mua gì tuần này?" (What should I buy this week?)
- "Đề xuất markdown" (Markdown suggestions)
- "SKU nào cần bổ sung?" (Which SKUs need replenishment?)`,
    input_schema: {
      type: 'object' as const,
      properties: {
        suggestion_type: {
          type: 'string',
          enum: [
            'buy_recommendations',
            'markdown_recommendations',
            'reorder_recommendations',
            'transfer_recommendations',
            'pricing_recommendations',
            'category_optimization',
          ],
          description: 'Type of suggestions to generate',
        },
        context: {
          type: 'object',
          properties: {
            seasonId: { type: 'string' },
            brandId: { type: 'string' },
            categoryId: { type: 'string' },
            budget: { type: 'number' },
          },
        },
        limit: {
          type: 'number',
          default: 5,
        },
      },
      required: ['suggestion_type'],
    },
  },
  {
    name: 'execute_action',
    description: `Execute an action in the system. Use with caution - always confirm with user first.
Examples:
- "Approve SKU proposal X" (after confirmation)
- "Create new OTB plan"
- "Submit budget for approval"
This tool requires explicit user confirmation before execution.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: [
            'approve_sku',
            'reject_sku',
            'submit_otb',
            'approve_budget',
            'create_suggestion',
            'acknowledge_alert',
          ],
          description: 'Action to execute',
        },
        entity_id: {
          type: 'string',
          description: 'ID of the entity to act on',
        },
        params: {
          type: 'object',
          description: 'Additional parameters for the action',
        },
        confirmed: {
          type: 'boolean',
          description: 'Whether the user has confirmed this action',
          default: false,
        },
      },
      required: ['action', 'entity_id', 'confirmed'],
    },
  },
] as const;

export type ToolName = (typeof AI_TOOLS)[number]['name'];

export interface ToolCall {
  id: string;
  name: ToolName;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}
