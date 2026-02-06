// AI Tool Executor - Routes tool calls to implementations
import { ToolCall, ToolResult } from './definitions';
import { queryData } from './query-data';
import { calculateMetrics } from './calculate-metrics';
import { generateChart } from './generate-chart';
import { getAlerts } from './get-alerts';
import { getSuggestions } from './get-suggestions';
import { executeAction } from './execute-action';

export async function executeTool(
  toolCall: ToolCall,
  userId: string
): Promise<ToolResult> {
  const { id, name, input } = toolCall;

  try {
    let result: unknown;

    switch (name) {
      case 'query_data':
        result = await queryData(input, userId);
        break;
      case 'calculate_metrics':
        result = await calculateMetrics(input, userId);
        break;
      case 'generate_chart':
        result = await generateChart(input, userId);
        break;
      case 'get_alerts':
        result = await getAlerts(input, userId);
        break;
      case 'get_suggestions':
        result = await getSuggestions(input, userId);
        break;
      case 'execute_action':
        result = await executeAction(input, userId);
        break;
      default:
        return {
          tool_use_id: id,
          content: JSON.stringify({ error: `Unknown tool: ${name}` }),
          is_error: true,
        };
    }

    return {
      tool_use_id: id,
      content: JSON.stringify(result),
      is_error: false,
    };
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      tool_use_id: id,
      content: JSON.stringify({
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }),
      is_error: true,
    };
  }
}

export async function executeTools(
  toolCalls: ToolCall[],
  userId: string
): Promise<ToolResult[]> {
  const results = await Promise.all(
    toolCalls.map((toolCall) => executeTool(toolCall, userId))
  );
  return results;
}
