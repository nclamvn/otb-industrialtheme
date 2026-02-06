// Variance calculation utilities and threshold configuration

export type VarianceLevel = 'critical' | 'warning' | 'minor' | 'on-target' | 'positive';
export type VarianceDirection = 'over' | 'under' | 'on-target';

export interface VarianceThresholds {
  critical: number;  // e.g., 20% variance
  warning: number;   // e.g., 10% variance
  minor: number;     // e.g., 5% variance
}

export interface VarianceResult {
  absoluteValue: number;
  percentageValue: number;
  level: VarianceLevel;
  direction: VarianceDirection;
  isSignificant: boolean;
  formattedAbsolute: string;
  formattedPercentage: string;
}

// Default thresholds (in percentage points)
export const DEFAULT_THRESHOLDS: VarianceThresholds = {
  critical: 20,
  warning: 10,
  minor: 5,
};

// Category-specific thresholds
export const CATEGORY_THRESHOLDS: Record<string, VarianceThresholds> = {
  budget: { critical: 15, warning: 8, minor: 3 },
  sales: { critical: 20, warning: 10, minor: 5 },
  margin: { critical: 10, warning: 5, minor: 2 },
  units: { critical: 25, warning: 15, minor: 8 },
  inventory: { critical: 30, warning: 20, minor: 10 },
};

/**
 * Calculate variance between actual and target/budget values
 */
export function calculateVariance(
  actual: number,
  target: number,
  thresholds: VarianceThresholds = DEFAULT_THRESHOLDS,
  positiveIsGood: boolean = true
): VarianceResult {
  // Handle edge cases
  if (target === 0) {
    const direction: VarianceDirection = actual > 0 ? 'over' : actual < 0 ? 'under' : 'on-target';
    return {
      absoluteValue: actual,
      percentageValue: actual === 0 ? 0 : Infinity,
      level: actual === 0 ? 'on-target' : 'critical',
      direction,
      isSignificant: actual !== 0,
      formattedAbsolute: formatNumber(actual),
      formattedPercentage: actual === 0 ? '0%' : '∞',
    };
  }

  const absoluteValue = actual - target;
  const percentageValue = ((actual - target) / target) * 100;
  const absPercentage = Math.abs(percentageValue);

  // Determine direction
  let direction: VarianceDirection = 'on-target';
  if (absoluteValue > 0) direction = 'over';
  else if (absoluteValue < 0) direction = 'under';

  // Determine level based on thresholds
  let level: VarianceLevel = 'on-target';
  if (absPercentage >= thresholds.critical) {
    // For metrics where positive is good (sales, margin), being over target is positive
    // For metrics where positive is bad (cost, budget spent), being over target is critical
    if (positiveIsGood) {
      level = absoluteValue > 0 ? 'positive' : 'critical';
    } else {
      level = absoluteValue > 0 ? 'critical' : 'positive';
    }
  } else if (absPercentage >= thresholds.warning) {
    if (positiveIsGood) {
      level = absoluteValue > 0 ? 'positive' : 'warning';
    } else {
      level = absoluteValue > 0 ? 'warning' : 'positive';
    }
  } else if (absPercentage >= thresholds.minor) {
    level = 'minor';
  }

  const isSignificant = absPercentage >= thresholds.minor;

  return {
    absoluteValue,
    percentageValue,
    level,
    direction,
    isSignificant,
    formattedAbsolute: formatNumber(absoluteValue, true),
    formattedPercentage: formatPercentage(percentageValue, true),
  };
}

/**
 * Get color configuration for a variance level
 */
export function getVarianceColors(level: VarianceLevel): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-500',
      };
    case 'warning':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-500',
      };
    case 'minor':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-500',
      };
    case 'positive':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-500',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950/30',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800',
        icon: 'text-gray-500',
      };
  }
}

/**
 * Get label for variance level
 */
export function getVarianceLabel(level: VarianceLevel): string {
  switch (level) {
    case 'critical': return 'Critical Variance';
    case 'warning': return 'Warning';
    case 'minor': return 'Minor Variance';
    case 'positive': return 'Above Target';
    default: return 'On Target';
  }
}

/**
 * Format number with sign prefix
 */
export function formatNumber(value: number, showSign: boolean = false): string {
  const absValue = Math.abs(value);
  let formatted: string;

  if (absValue >= 1000000) {
    formatted = `${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    formatted = `${(absValue / 1000).toFixed(1)}K`;
  } else {
    formatted = absValue.toLocaleString();
  }

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}

/**
 * Format percentage with sign prefix
 */
export function formatPercentage(value: number, showSign: boolean = false): string {
  const formatted = `${Math.abs(value).toFixed(1)}%`;
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  showSign: boolean = false
): string {
  const absValue = Math.abs(value);
  let formatted: string;

  if (absValue >= 1000000) {
    formatted = `$${(absValue / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    formatted = `$${(absValue / 1000).toFixed(1)}K`;
  } else {
    formatted = `$${absValue.toLocaleString()}`;
  }

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}

/**
 * Batch calculate variances for a dataset
 */
export function calculateBatchVariances(
  items: Array<{ actual: number; target: number; id: string }>,
  thresholds: VarianceThresholds = DEFAULT_THRESHOLDS,
  positiveIsGood: boolean = true
): Map<string, VarianceResult> {
  const results = new Map<string, VarianceResult>();
  items.forEach((item) => {
    results.set(item.id, calculateVariance(item.actual, item.target, thresholds, positiveIsGood));
  });
  return results;
}

/**
 * Get summary statistics for a set of variances
 */
export function getVarianceSummary(variances: VarianceResult[]): {
  criticalCount: number;
  warningCount: number;
  minorCount: number;
  positiveCount: number;
  onTargetCount: number;
  avgVariance: number;
  maxVariance: number;
  minVariance: number;
} {
  const summary = {
    criticalCount: 0,
    warningCount: 0,
    minorCount: 0,
    positiveCount: 0,
    onTargetCount: 0,
    avgVariance: 0,
    maxVariance: -Infinity,
    minVariance: Infinity,
  };

  if (variances.length === 0) return { ...summary, maxVariance: 0, minVariance: 0 };

  let totalVariance = 0;

  variances.forEach((v) => {
    switch (v.level) {
      case 'critical': summary.criticalCount++; break;
      case 'warning': summary.warningCount++; break;
      case 'minor': summary.minorCount++; break;
      case 'positive': summary.positiveCount++; break;
      default: summary.onTargetCount++;
    }

    totalVariance += v.percentageValue;
    if (v.percentageValue > summary.maxVariance) summary.maxVariance = v.percentageValue;
    if (v.percentageValue < summary.minVariance) summary.minVariance = v.percentageValue;
  });

  summary.avgVariance = totalVariance / variances.length;

  return summary;
}
