/**
 * Automation Rules Engine
 * Evaluates conditions and determines if automatic actions should be taken
 */

export type RuleType =
  | 'AUTO_APPROVE_BUDGET'
  | 'AUTO_APPROVE_OTB'
  | 'AUTO_APPROVE_SKU'
  | 'AUTO_REORDER'
  | 'AUTO_ESCALATE'
  | 'AUTO_NOTIFY';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'contains'
  | 'not_contains'
  | 'in_list'
  | 'not_in_list'
  | 'between';

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[] | number[];
  valueEnd?: number; // For 'between' operator
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  enabled: boolean;
  priority: number; // Lower = higher priority
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  actions: RuleAction[];
  cooldownMinutes?: number; // Minimum time between executions
  maxExecutionsPerDay?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleAction {
  type: 'approve' | 'reject' | 'escalate' | 'notify' | 'create_reorder' | 'update_status';
  config: Record<string, unknown>;
}

export interface RuleEvaluationContext {
  entityType: 'budget' | 'otb' | 'sku' | 'inventory';
  entityId: string;
  data: Record<string, unknown>;
  metadata?: {
    userId?: string;
    brandId?: string;
    seasonId?: string;
    currentStep?: number;
  };
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: RuleAction[];
  conditionResults: {
    condition: RuleCondition;
    passed: boolean;
    actualValue: unknown;
  }[];
  reason: string;
}

/**
 * Default automation rules for common scenarios
 */
export const DEFAULT_RULES: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Auto-approve small budget adjustments
  {
    name: 'Auto-approve Small Budget Changes',
    description: 'Automatically approve budget changes under 10 million VND',
    type: 'AUTO_APPROVE_BUDGET',
    enabled: true,
    priority: 1,
    conditions: [
      { field: 'totalBudget', operator: 'less_than', value: 10000000 },
      { field: 'changePercent', operator: 'less_than', value: 5 },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'approve', config: { comment: 'Auto-approved: Small budget change within threshold' } },
      { type: 'notify', config: { notifyOriginator: true, notifyManagers: false } },
    ],
    cooldownMinutes: 5,
    maxExecutionsPerDay: 50,
  },
  // Auto-approve SKU proposals with high validation score
  {
    name: 'Auto-approve High-Quality SKU Proposals',
    description: 'Automatically approve SKU proposals with 95%+ validation rate',
    type: 'AUTO_APPROVE_SKU',
    enabled: true,
    priority: 2,
    conditions: [
      { field: 'validationRate', operator: 'greater_than_or_equals', value: 95 },
      { field: 'errorCount', operator: 'equals', value: 0 },
      { field: 'totalSKUs', operator: 'less_than', value: 100 },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'approve', config: { comment: 'Auto-approved: High validation score, no errors' } },
      { type: 'notify', config: { notifyOriginator: true } },
    ],
    cooldownMinutes: 1,
    maxExecutionsPerDay: 100,
  },
  // Auto-approve OTB plans within budget
  {
    name: 'Auto-approve OTB Within Budget',
    description: 'Automatically approve OTB plans that are within 90% of allocated budget',
    type: 'AUTO_APPROVE_OTB',
    enabled: true,
    priority: 3,
    conditions: [
      { field: 'budgetUtilization', operator: 'less_than_or_equals', value: 90 },
      { field: 'variancePercent', operator: 'between', value: -5, valueEnd: 5 },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'approve', config: { comment: 'Auto-approved: Within budget allocation and variance threshold' } },
      { type: 'notify', config: { notifyOriginator: true, notifyFinance: true } },
    ],
    cooldownMinutes: 10,
    maxExecutionsPerDay: 20,
  },
  // Auto-reorder for low stock items
  {
    name: 'Auto-Create Reorder for Critical Stock',
    description: 'Automatically create reorder suggestions for items with less than 7 days of stock',
    type: 'AUTO_REORDER',
    enabled: true,
    priority: 1,
    conditions: [
      { field: 'daysOfStock', operator: 'less_than', value: 7 },
      { field: 'demandTrend', operator: 'not_equals', value: 'declining' },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'create_reorder', config: { urgency: 'high', targetDaysOfStock: 30 } },
      { type: 'notify', config: { notifyProcurement: true, notifyManagers: true } },
    ],
    cooldownMinutes: 60,
    maxExecutionsPerDay: 50,
  },
  // Auto-escalate stale approvals
  {
    name: 'Auto-Escalate Stale Approvals',
    description: 'Automatically escalate approvals pending more than 48 hours',
    type: 'AUTO_ESCALATE',
    enabled: true,
    priority: 5,
    conditions: [
      { field: 'hoursWaiting', operator: 'greater_than', value: 48 },
      { field: 'remindersSent', operator: 'less_than', value: 3 },
    ],
    conditionLogic: 'AND',
    actions: [
      { type: 'escalate', config: { escalateToRole: 'ADMIN', addComment: true } },
      { type: 'notify', config: { notifyAssignee: true, notifyEscalateTo: true } },
    ],
    cooldownMinutes: 240,
    maxExecutionsPerDay: 10,
  },
];

/**
 * Evaluate a single condition against context data
 */
export function evaluateCondition(
  condition: RuleCondition,
  context: RuleEvaluationContext
): { passed: boolean; actualValue: unknown } {
  const actualValue = getNestedValue(context.data, condition.field);

  if (actualValue === undefined || actualValue === null) {
    return { passed: false, actualValue };
  }

  let passed = false;

  switch (condition.operator) {
    case 'equals':
      passed = actualValue === condition.value;
      break;
    case 'not_equals':
      passed = actualValue !== condition.value;
      break;
    case 'greater_than':
      passed = Number(actualValue) > Number(condition.value);
      break;
    case 'less_than':
      passed = Number(actualValue) < Number(condition.value);
      break;
    case 'greater_than_or_equals':
      passed = Number(actualValue) >= Number(condition.value);
      break;
    case 'less_than_or_equals':
      passed = Number(actualValue) <= Number(condition.value);
      break;
    case 'contains':
      passed = String(actualValue).toLowerCase().includes(String(condition.value).toLowerCase());
      break;
    case 'not_contains':
      passed = !String(actualValue).toLowerCase().includes(String(condition.value).toLowerCase());
      break;
    case 'in_list':
      passed = Array.isArray(condition.value) && condition.value.includes(actualValue as never);
      break;
    case 'not_in_list':
      passed = Array.isArray(condition.value) && !condition.value.includes(actualValue as never);
      break;
    case 'between':
      const numValue = Number(actualValue);
      passed = numValue >= Number(condition.value) && numValue <= Number(condition.valueEnd);
      break;
  }

  return { passed, actualValue };
}

/**
 * Evaluate all rules against context and return matching rules
 */
export function evaluateRules(
  rules: AutomationRule[],
  context: RuleEvaluationContext
): RuleEvaluationResult[] {
  const results: RuleEvaluationResult[] = [];

  // Sort rules by priority (lower = higher priority)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    if (!rule.enabled) continue;

    // Check if rule type matches entity type
    if (!isRuleApplicable(rule.type, context.entityType)) continue;

    const conditionResults = rule.conditions.map(condition => ({
      condition,
      ...evaluateCondition(condition, context),
    }));

    let matched: boolean;
    if (rule.conditionLogic === 'AND') {
      matched = conditionResults.every(r => r.passed);
    } else {
      matched = conditionResults.some(r => r.passed);
    }

    const passedConditions = conditionResults.filter(r => r.passed).length;
    const totalConditions = conditionResults.length;

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      actions: matched ? rule.actions : [],
      conditionResults,
      reason: matched
        ? `All conditions met (${passedConditions}/${totalConditions})`
        : `Conditions not met (${passedConditions}/${totalConditions} passed)`,
    });
  }

  return results;
}

/**
 * Get first matching rule (highest priority)
 */
export function getFirstMatchingRule(
  rules: AutomationRule[],
  context: RuleEvaluationContext
): RuleEvaluationResult | null {
  const results = evaluateRules(rules, context);
  return results.find(r => r.matched) || null;
}

/**
 * Helper: Check if rule type is applicable to entity type
 */
function isRuleApplicable(ruleType: RuleType, entityType: string): boolean {
  const mapping: Record<RuleType, string[]> = {
    AUTO_APPROVE_BUDGET: ['budget'],
    AUTO_APPROVE_OTB: ['otb'],
    AUTO_APPROVE_SKU: ['sku'],
    AUTO_REORDER: ['inventory', 'sku'],
    AUTO_ESCALATE: ['budget', 'otb', 'sku'],
    AUTO_NOTIFY: ['budget', 'otb', 'sku', 'inventory'],
  };

  return mapping[ruleType]?.includes(entityType) || false;
}

/**
 * Helper: Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Calculate derived fields for rule evaluation
 */
export function enrichContextData(context: RuleEvaluationContext): RuleEvaluationContext {
  const data = { ...context.data };

  // Calculate validation rate for SKU proposals
  if (context.entityType === 'sku') {
    const totalSKUs = Number(data.totalSKUs || 0);
    const validSKUs = Number(data.validSKUs || 0);
    const errorSKUs = Number(data.errorSKUs || 0);

    data.validationRate = totalSKUs > 0 ? (validSKUs / totalSKUs) * 100 : 0;
    data.errorCount = errorSKUs;
  }

  // Calculate budget utilization
  if (context.entityType === 'budget' || context.entityType === 'otb') {
    const totalBudget = Number(data.totalBudget || 0);
    const utilizedBudget = Number(data.utilizedBudget || data.plannedValue || 0);

    data.budgetUtilization = totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0;
  }

  // Calculate days of stock for inventory
  if (context.entityType === 'inventory') {
    const currentStock = Number(data.currentStock || 0);
    const avgDailyDemand = Number(data.avgDailyDemand || 1);

    data.daysOfStock = avgDailyDemand > 0 ? currentStock / avgDailyDemand : 0;
  }

  return { ...context, data };
}
