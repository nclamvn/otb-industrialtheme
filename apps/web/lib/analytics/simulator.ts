import type {
  ScenarioParameter,
  ScenarioImpact,
} from '@/types/simulator';

// Internal metric set used for simulation calculations
interface InternalMetricSet {
  revenue: number;
  grossMargin: number;
  sellThrough: number;
  inventoryTurn: number;
  weeksOfSupply: number;
  markdownRate: number;
  stockOutRate: number;
  unitsSold: number;
  avgSellingPrice: number;
  totalCost: number;
}

// Internal simulation result
interface InternalSimulationResult {
  scenario: {
    parameters: ScenarioParameter[];
    baseline: InternalMetricSet;
    projected: InternalMetricSet;
  };
  impacts: ScenarioImpact[];
  score: number;
  recommendations: string[];
  risks: string[];
  confidenceLevel: number;
}

/**
 * Default baseline metrics for simulation
 */
const defaultBaseline: InternalMetricSet = {
  revenue: 1500000,
  grossMargin: 52.3,
  sellThrough: 68.5,
  inventoryTurn: 4.2,
  weeksOfSupply: 8.5,
  markdownRate: 18.5,
  stockOutRate: 3.2,
  unitsSold: 45000,
  avgSellingPrice: 33.33,
  totalCost: 715500,
};

/**
 * Parameter sensitivity configurations
 */
const parameterSensitivity: Record<string, {
  affectsMetrics: string[];
  multipliers: Record<string, number>;
}> = {
  priceAdjustment: {
    affectsMetrics: ['revenue', 'grossMargin', 'sellThrough', 'unitsSold'],
    multipliers: {
      revenue: 0.8, // 10% price increase = 8% revenue increase (with volume loss)
      grossMargin: 0.9, // Higher prices improve margin
      sellThrough: -0.15, // Higher prices reduce sell-through
      unitsSold: -0.2, // Significant volume impact
    },
  },
  markdownTiming: {
    affectsMetrics: ['grossMargin', 'sellThrough', 'markdownRate', 'inventoryTurn'],
    multipliers: {
      grossMargin: -0.3, // Earlier markdowns reduce margin
      sellThrough: 0.4, // But improve sell-through
      markdownRate: 0.5,
      inventoryTurn: 0.3,
    },
  },
  inventoryLevel: {
    affectsMetrics: ['stockOutRate', 'weeksOfSupply', 'inventoryTurn', 'markdownRate'],
    multipliers: {
      stockOutRate: -0.8, // More inventory = less stockouts
      weeksOfSupply: 1.0,
      inventoryTurn: -0.5, // More inventory = slower turn
      markdownRate: 0.3, // More inventory may need more markdowns
    },
  },
  receiptTiming: {
    affectsMetrics: ['stockOutRate', 'weeksOfSupply', 'sellThrough'],
    multipliers: {
      stockOutRate: -0.4,
      weeksOfSupply: -0.3,
      sellThrough: 0.2,
    },
  },
  buyQuantity: {
    affectsMetrics: ['revenue', 'unitsSold', 'inventoryTurn', 'stockOutRate', 'weeksOfSupply'],
    multipliers: {
      revenue: 0.6,
      unitsSold: 0.7,
      inventoryTurn: -0.3,
      stockOutRate: -0.5,
      weeksOfSupply: 0.8,
    },
  },
  categoryMix: {
    affectsMetrics: ['grossMargin', 'avgSellingPrice', 'sellThrough'],
    multipliers: {
      grossMargin: 0.4,
      avgSellingPrice: 0.3,
      sellThrough: -0.1,
    },
  },
};

/**
 * Run a what-if simulation with the given parameters
 */
export function runSimulation(
  parameters: ScenarioParameter[],
  baseline: InternalMetricSet = defaultBaseline
): InternalSimulationResult {
  const adjustedMetrics = { ...baseline };
  const impacts: ScenarioImpact[] = [];
  const recommendations: string[] = [];
  const risks: string[] = [];

  // Apply each parameter adjustment
  for (const param of parameters) {
    const sensitivity = parameterSensitivity[param.name];
    if (!sensitivity) continue;

    const changePercent = ((param.newValue - param.baseValue) / param.baseValue) * 100;

    // Calculate impact on each affected metric
    for (const metric of sensitivity.affectsMetrics) {
      const multiplier = sensitivity.multipliers[metric] || 0;
      const metricKey = metric as keyof InternalMetricSet;

      if (metricKey in adjustedMetrics) {
        const currentValue = adjustedMetrics[metricKey];
        const impact = currentValue * (changePercent / 100) * multiplier;
        adjustedMetrics[metricKey] = currentValue + impact;

        impacts.push({
          metric,
          label: metric.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
          baseValue: baseline[metricKey],
          projectedValue: adjustedMetrics[metricKey],
          change: adjustedMetrics[metricKey] - baseline[metricKey],
          changePercent: ((adjustedMetrics[metricKey] - baseline[metricKey]) / baseline[metricKey]) * 100,
          significance: Math.abs(impact) > currentValue * 0.05 ? 'high' : Math.abs(impact) > currentValue * 0.02 ? 'medium' : 'low',
          direction: impact >= 0 ? 'positive' : 'negative',
        });
      }
    }

    // Generate recommendations and risks based on parameter changes
    if (param.name === 'priceAdjustment') {
      if (changePercent > 5) {
        risks.push(`Price increase of ${changePercent.toFixed(1)}% may reduce demand by ${Math.abs(changePercent * 0.2).toFixed(1)}%`);
        recommendations.push('Consider phased price increases to minimize customer impact');
      } else if (changePercent < -5) {
        risks.push(`Price reduction will compress margins by approximately ${Math.abs(changePercent * 0.8).toFixed(1)}%`);
      }
    }

    if (param.name === 'inventoryLevel') {
      if (changePercent > 20) {
        risks.push('Significant inventory increase may lead to higher carrying costs and markdown risk');
        recommendations.push('Ensure sufficient sell-through velocity before increasing buy');
      } else if (changePercent < -20) {
        risks.push('Inventory reduction increases stockout risk during peak demand');
      }
    }

    if (param.name === 'markdownTiming') {
      if (changePercent < 0) {
        risks.push('Earlier markdowns will accelerate sell-through but reduce full-price sales');
        recommendations.push('Target slow-moving SKUs for early markdown to preserve margin on top sellers');
      }
    }
  }

  // Calculate overall scenario score
  const score = calculateScenarioScore(baseline, adjustedMetrics);

  // Consolidate impacts by metric
  const consolidatedImpacts = consolidateImpacts(impacts);

  return {
    scenario: {
      parameters,
      baseline,
      projected: adjustedMetrics,
    },
    impacts: consolidatedImpacts,
    score,
    recommendations,
    risks,
    confidenceLevel: calculateConfidence(parameters),
  };
}

/**
 * Calculate overall scenario score (0-100)
 */
function calculateScenarioScore(baseline: InternalMetricSet, projected: InternalMetricSet): number {
  const weights = {
    revenue: 0.25,
    grossMargin: 0.25,
    sellThrough: 0.2,
    stockOutRate: 0.15,
    inventoryTurn: 0.15,
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const [metric, weight] of Object.entries(weights)) {
    const metricKey = metric as keyof InternalMetricSet;
    const baseValue = baseline[metricKey];
    const projValue = projected[metricKey];

    if (baseValue === 0) continue;

    let metricScore: number;

    // For stock-out rate, lower is better
    if (metric === 'stockOutRate') {
      const improvement = (baseValue - projValue) / baseValue;
      metricScore = 50 + (improvement * 50);
    } else {
      const improvement = (projValue - baseValue) / baseValue;
      metricScore = 50 + (improvement * 100);
    }

    // Clamp score between 0 and 100
    metricScore = Math.max(0, Math.min(100, metricScore));

    weightedScore += metricScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 50;
}

/**
 * Calculate confidence level based on parameter changes
 */
function calculateConfidence(parameters: ScenarioParameter[]): number {
  // Base confidence starts at 95%
  let confidence = 95;

  for (const param of parameters) {
    const changePercent = Math.abs(((param.newValue - param.baseValue) / param.baseValue) * 100);

    // Reduce confidence for larger changes
    if (changePercent > 30) {
      confidence -= 15;
    } else if (changePercent > 20) {
      confidence -= 10;
    } else if (changePercent > 10) {
      confidence -= 5;
    }
  }

  // Multiple parameter changes compound uncertainty
  if (parameters.length > 3) {
    confidence -= (parameters.length - 3) * 3;
  }

  return Math.max(50, Math.min(95, confidence));
}

/**
 * Consolidate multiple impacts on the same metric
 */
function consolidateImpacts(impacts: ScenarioImpact[]): ScenarioImpact[] {
  const byMetric = new Map<string, ScenarioImpact[]>();

  for (const impact of impacts) {
    const existing = byMetric.get(impact.metric) || [];
    existing.push(impact);
    byMetric.set(impact.metric, existing);
  }

  const consolidated: ScenarioImpact[] = [];

  for (const [metric, metricImpacts] of Array.from(byMetric.entries())) {
    if (metricImpacts.length === 1) {
      consolidated.push(metricImpacts[0]);
    } else {
      // Combine multiple impacts
      const baseValue = metricImpacts[0].baseValue;
      const totalChange = metricImpacts.reduce((sum, i) => sum + i.change, 0);
      const projectedValue = baseValue + totalChange;
      const changePercent = (totalChange / baseValue) * 100;

      consolidated.push({
        metric,
        label: metric.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        baseValue,
        projectedValue,
        change: totalChange,
        changePercent,
        significance: Math.abs(changePercent) > 10 ? 'high' : Math.abs(changePercent) > 5 ? 'medium' : 'low',
        direction: totalChange >= 0 ? 'positive' : 'negative',
      });
    }
  }

  return consolidated.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

/**
 * Compare two scenarios
 */
export function compareScenarios(
  scenario1: InternalSimulationResult,
  scenario2: InternalSimulationResult
): {
  winner: 1 | 2 | 'tie';
  scoreDifference: number;
  advantages: { scenario1: string[]; scenario2: string[] };
} {
  const scoreDiff = scenario1.score - scenario2.score;
  const winner = Math.abs(scoreDiff) < 2 ? 'tie' : scoreDiff > 0 ? 1 : 2;

  const advantages = {
    scenario1: [] as string[],
    scenario2: [] as string[],
  };

  // Find metrics where each scenario has advantage
  const metrics1 = new Map(scenario1.impacts.map((i) => [i.metric, i]));
  const metrics2 = new Map(scenario2.impacts.map((i) => [i.metric, i]));

  for (const [metric, impact1] of Array.from(metrics1.entries())) {
    const impact2 = metrics2.get(metric);
    if (!impact2) continue;

    // For most metrics, higher is better (except stockOutRate)
    const isBetter1 = metric === 'stockOutRate'
      ? impact1.projectedValue < impact2.projectedValue
      : impact1.projectedValue > impact2.projectedValue;

    if (isBetter1) {
      advantages.scenario1.push(`Better ${metric}: ${impact1.changePercent.toFixed(1)}% vs ${impact2.changePercent.toFixed(1)}%`);
    } else if (impact1.projectedValue !== impact2.projectedValue) {
      advantages.scenario2.push(`Better ${metric}: ${impact2.changePercent.toFixed(1)}% vs ${impact1.changePercent.toFixed(1)}%`);
    }
  }

  return { winner, scoreDifference: scoreDiff, advantages };
}

/**
 * Generate scenario presets
 */
export function getScenarioPresets(): Array<{
  name: string;
  description: string;
  parameters: Partial<ScenarioParameter>[];
}> {
  return [
    {
      name: 'Aggressive Growth',
      description: 'Maximize revenue through increased inventory and moderate pricing',
      parameters: [
        { name: 'buyQuantity', newValue: 1.25, baseValue: 1.0, label: 'Buy Quantity' },
        { name: 'priceAdjustment', newValue: 0.95, baseValue: 1.0, label: 'Price Level' },
      ],
    },
    {
      name: 'Margin Protection',
      description: 'Maintain margins by optimizing pricing and reducing markdowns',
      parameters: [
        { name: 'priceAdjustment', newValue: 1.05, baseValue: 1.0, label: 'Price Level' },
        { name: 'markdownTiming', newValue: 1.15, baseValue: 1.0, label: 'Markdown Timing' },
      ],
    },
    {
      name: 'Inventory Optimization',
      description: 'Reduce weeks of supply while maintaining service levels',
      parameters: [
        { name: 'inventoryLevel', newValue: 0.85, baseValue: 1.0, label: 'Inventory Level' },
        { name: 'receiptTiming', newValue: 0.9, baseValue: 1.0, label: 'Receipt Timing' },
      ],
    },
    {
      name: 'Conservative',
      description: 'Risk-averse approach with stable inventory and pricing',
      parameters: [
        { name: 'inventoryLevel', newValue: 1.1, baseValue: 1.0, label: 'Inventory Level' },
        { name: 'priceAdjustment', newValue: 1.0, baseValue: 1.0, label: 'Price Level' },
      ],
    },
  ];
}
