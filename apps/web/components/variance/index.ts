export {
  VarianceIndicator,
  VarianceCell,
  CriticalVarianceIndicator,
} from './VarianceIndicator';

export { VarianceTooltip } from './VarianceTooltip';

export { VarianceDemo } from './VarianceDemo';

// Re-export utilities
export {
  calculateVariance,
  getVarianceColors,
  getVarianceLabel,
  getVarianceSummary,
  formatNumber,
  formatPercentage,
  formatCurrency,
  calculateBatchVariances,
  DEFAULT_THRESHOLDS,
  CATEGORY_THRESHOLDS,
} from '@/lib/variance-utils';

export type {
  VarianceLevel,
  VarianceDirection,
  VarianceResult,
  VarianceThresholds,
} from '@/lib/variance-utils';
