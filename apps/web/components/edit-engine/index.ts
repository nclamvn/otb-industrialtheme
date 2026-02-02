// Edit Engine — Complete Export Index

// Core Components
export { ChangeIndicator } from './ChangeIndicator';
export { EditableCell } from './EditableCell';
export type { EditableCellValue, EditableCellProps } from './EditableCell';
export { EditHistoryPanel } from './EditHistoryPanel';
export { EditConfirmationDialog } from './EditConfirmationDialog';

// P2: Batch & Inline Edit
export { BatchEditPanel } from './BatchEditPanel';
export { InlineEditDropdown } from './InlineEditDropdown';
export {
  ApprovalStatusBadge,
  ApprovalPendingCount,
  ApprovalSummary,
} from './ApprovalStatusBadge';

// New Components (EDIT-2, EDIT-4, EDIT-6)
export { InlineEditField } from './InlineEditField';
export type {
  InlineEditFieldProps,
  EditFieldType,
  SelectOption,
} from './InlineEditField';
export { EditHistoryTimeline } from './EditHistoryTimeline';
export type { EditRecord, EditHistoryTimelineProps } from './EditHistoryTimeline';
export { EditableDataRow } from './EditableDataRow';
export type { FieldConfig, EditableDataRowProps } from './EditableDataRow';

// Hooks
export {
  useEditableCell,
  useEditableRow,
  type UseEditableCellOptions,
  type UseEditableCellReturn,
  type UseEditableRowOptions,
  type EditableCellState,
  type CascadeEffect,
} from './hooks';

// Phase 4: Advanced Batch Edit
export { BatchEditPreview, BatchEditPreviewCompact } from './BatchEditPreview';
