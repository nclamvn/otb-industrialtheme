export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeTool } from '@/lib/ai/tools';

// POST endpoint to execute a tool directly
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolName, input } = await request.json();

    if (!toolName || !input) {
      return NextResponse.json(
        { error: 'Tool name and input are required' },
        { status: 400 }
      );
    }

    const result = await executeTool(
      {
        id: `direct-${Date.now()}`,
        name: toolName,
        input,
      },
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tool' },
      { status: 500 }
    );
  }
}

// GET endpoint to get available tools
export async function GET() {
  const tools = [
    {
      name: 'query_data',
      description: 'Query business data from the database',
      queryTypes: [
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
    },
    {
      name: 'calculate_metrics',
      description: 'Calculate KPIs and business metrics',
      metrics: [
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
    },
    {
      name: 'generate_chart',
      description: 'Generate chart data for visualization',
      chartTypes: ['line', 'bar', 'pie', 'area', 'combo'],
      dataTypes: [
        'sales_trend',
        'inventory_trend',
        'otb_utilization',
        'category_mix',
        'brand_comparison',
        'sell_through_trend',
        'margin_trend',
      ],
    },
    {
      name: 'get_alerts',
      description: 'Fetch current business alerts and warnings',
      alertTypes: [
        'all',
        'stockout_risk',
        'overstock_risk',
        'otb_overrun',
        'approval_pending',
        'kpi_threshold',
        'margin_decline',
      ],
    },
    {
      name: 'get_suggestions',
      description: 'Get AI-powered recommendations',
      suggestionTypes: [
        'buy_recommendations',
        'markdown_recommendations',
        'reorder_recommendations',
        'transfer_recommendations',
        'pricing_recommendations',
        'category_optimization',
      ],
    },
    {
      name: 'execute_action',
      description: 'Execute business actions',
      actions: [
        'approve_proposal',
        'reject_proposal',
        'submit_proposal',
        'approve_otb',
        'reject_otb',
        'update_budget',
        'update_sku_status',
        'update_sku_quantity',
        'acknowledge_alert',
        'dismiss_alert',
        'export_data',
        'navigate',
        'open_modal',
      ],
    },
  ];

  return NextResponse.json({ tools });
}
