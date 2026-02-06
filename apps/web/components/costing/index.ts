/**
 * Costing Components
 *
 * For full cost breakdown calculation
 * Maps to Excel: Unit cost → Freight → Tax → Import → Landed → SRP → Margin
 */

// Types
export * from './types';

// Components
export { CostingBreakdownCard, default as CostingBreakdownCardDefault } from './CostingBreakdownCard';
export { CostingTable, default as CostingTableDefault } from './CostingTable';

// Hooks
export { useCosting, default as useCostingDefault } from './hooks/useCosting';

// Utils
export {
  calculateCosting,
  calculateCostingSummary,
  recalculateMargin,
  calculateTargetSRP,
} from './utils/costing-calculator';
