/**
 * Size Allocation Components
 *
 * Components for managing Choice A/B/C quantities by size
 * Maps to Excel columns: QTY A, QTY B, QTY C
 */

// Types
export * from './types';

// Components
export { ChoiceAllocationCard, default as ChoiceAllocationCardDefault } from './ChoiceAllocationCard';
export { SizeAllocationTable, default as SizeAllocationTableDefault } from './SizeAllocationTable';
export { ChoiceAllocationSummary, default as ChoiceAllocationSummaryDefault } from './ChoiceAllocationSummary';
export { SizingVersionPanel, default as SizingVersionPanelDefault } from './SizingVersionPanel';

// Hooks
export { useSizeAllocation, default as useSizeAllocationDefault } from './hooks/useSizeAllocation';
export { useSizingVersion, default as useSizingVersionDefault } from './hooks/useSizingVersion';
