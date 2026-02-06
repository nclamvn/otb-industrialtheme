// AI Tools System - Export all tools
export { AI_TOOLS, type ToolName as DefinitionToolName, type ToolCall, type ToolResult } from './definitions';
export { executeTool, executeTools } from './executor';

// Re-export AI_TOOLS element type
export type AITool = (typeof import('./definitions').AI_TOOLS)[number];
export { queryData } from './query-data';
export { calculateMetrics } from './calculate-metrics';
export { generateChart } from './generate-chart';
export { getAlerts } from './get-alerts';
export { getSuggestions } from './get-suggestions';
export { executeAction } from './execute-action';

// Tool names for type safety
export const TOOL_NAMES = [
  'query_data',
  'calculate_metrics',
  'generate_chart',
  'get_alerts',
  'get_suggestions',
  'execute_action',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

// Helper to check if a tool name is valid
export function isValidToolName(name: string): name is ToolName {
  return TOOL_NAMES.includes(name as ToolName);
}

// Tool categories for UI grouping
export const TOOL_CATEGORIES = {
  data: ['query_data', 'calculate_metrics'],
  visualization: ['generate_chart'],
  monitoring: ['get_alerts', 'get_suggestions'],
  actions: ['execute_action'],
} as const;

// Get tool category
export function getToolCategory(toolName: ToolName): string {
  for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
    if ((tools as readonly string[]).includes(toolName)) {
      return category;
    }
  }
  return 'other';
}

// Tool display info for UI
export const TOOL_DISPLAY_INFO: Record<
  ToolName,
  { icon: string; label: string; labelVi: string; description: string; descriptionVi: string }
> = {
  query_data: {
    icon: 'Database',
    label: 'Query Data',
    labelVi: 'Truy vấn dữ liệu',
    description: 'Search and retrieve business data',
    descriptionVi: 'Tìm kiếm và truy xuất dữ liệu kinh doanh',
  },
  calculate_metrics: {
    icon: 'Calculator',
    label: 'Calculate Metrics',
    labelVi: 'Tính toán chỉ số',
    description: 'Calculate KPIs and performance metrics',
    descriptionVi: 'Tính toán KPI và chỉ số hiệu suất',
  },
  generate_chart: {
    icon: 'BarChart',
    label: 'Generate Chart',
    labelVi: 'Tạo biểu đồ',
    description: 'Create visual charts and graphs',
    descriptionVi: 'Tạo biểu đồ và đồ thị trực quan',
  },
  get_alerts: {
    icon: 'Bell',
    label: 'Get Alerts',
    labelVi: 'Lấy cảnh báo',
    description: 'Fetch current alerts and warnings',
    descriptionVi: 'Lấy cảnh báo và thông báo hiện tại',
  },
  get_suggestions: {
    icon: 'Lightbulb',
    label: 'Get Suggestions',
    labelVi: 'Lấy gợi ý',
    description: 'AI-powered recommendations',
    descriptionVi: 'Gợi ý thông minh từ AI',
  },
  execute_action: {
    icon: 'Play',
    label: 'Execute Action',
    labelVi: 'Thực thi hành động',
    description: 'Perform actions on your behalf',
    descriptionVi: 'Thực hiện hành động thay bạn',
  },
};
