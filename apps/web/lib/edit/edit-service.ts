// ============================================================
// EDIT SERVICE - DAFC OTB Platform
// Handles edit history, approvals, and cascade tracking
// ============================================================

import { calculateCascade } from './cascade-engine';

// ============================================================
// Types
// ============================================================

export type EditStatus =
  | 'PENDING'
  | 'AUTO_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVERTED';

export interface EditRecord {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  valueType: string;
  isCascade: boolean;
  cascadeFrom?: string;
  cascadeRule?: string;
  status: EditStatus;
  editedBy: string;
  editedByName: string;
  editedByRole?: string;
  reason?: string;
  batchId: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface CreateEditInput {
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  valueType?: string;
  editedBy: string;
  editedByName: string;
  editedByRole?: string;
  reason?: string;
  currentValues?: Record<string, number>;
}

export interface EditResult {
  primaryEdit: EditRecord;
  cascadeEdits: EditRecord[];
  batchId: string;
  autoApproved: boolean;
  totalEdits: number;
}

// ============================================================
// Auto-Approve Thresholds by Role
// ============================================================

const AUTO_APPROVE_THRESHOLDS: Record<string, number> = {
  'Brand Manager': 5, // Auto-approve ≤5% change
  GSM: 10, // Auto-approve ≤10% change
  'Finance Director': 100, // Auto-approve all
  CEO: 100, // Auto-approve all
  ADMIN: 100, // Auto-approve all
};

// ============================================================
// Helper Functions
// ============================================================

function generateId(): string {
  return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// Edit Service Class
// ============================================================

export class EditService {
  private static edits: EditRecord[] = [];

  /**
   * Create an edit with cascade tracking
   */
  static async createEdit(input: CreateEditInput): Promise<EditResult> {
    const batchId = generateBatchId();
    const now = new Date().toISOString();

    // Calculate change percentage
    const changePercent = input.oldValue
      ? Math.abs(
          ((parseFloat(input.newValue) - parseFloat(input.oldValue)) /
            parseFloat(input.oldValue)) *
            100
        )
      : 100;

    // Check if auto-approve applies
    const threshold = AUTO_APPROVE_THRESHOLDS[input.editedByRole || ''] || 0;
    const autoApprove = changePercent <= threshold;

    // 1. Create primary edit
    const primaryEdit: EditRecord = {
      id: generateId(),
      entityType: input.entityType,
      entityId: input.entityId,
      fieldName: input.fieldName,
      oldValue: input.oldValue,
      newValue: input.newValue,
      valueType: input.valueType || 'string',
      isCascade: false,
      status: autoApprove ? 'AUTO_APPROVED' : 'PENDING',
      editedBy: input.editedBy,
      editedByName: input.editedByName,
      editedByRole: input.editedByRole,
      reason: input.reason,
      batchId,
      createdAt: now,
      ...(autoApprove
        ? {
            approvedBy: 'system',
            approvedAt: now,
          }
        : {}),
    };

    this.edits.push(primaryEdit);

    // 2. Calculate and create cascade edits
    const cascadeEdits: EditRecord[] = [];
    if (input.currentValues) {
      const cascadeEffects = calculateCascade(
        input.fieldName,
        parseFloat(input.newValue),
        input.currentValues
      );

      for (const effect of cascadeEffects) {
        const cascadeEdit: EditRecord = {
          id: generateId(),
          entityType: input.entityType,
          entityId: input.entityId,
          fieldName: effect.field,
          oldValue: effect.oldValue.toString(),
          newValue: effect.newValue.toString(),
          valueType: 'number',
          isCascade: true,
          cascadeFrom: primaryEdit.id,
          cascadeRule: effect.rule,
          status: autoApprove ? 'AUTO_APPROVED' : 'PENDING',
          editedBy: input.editedBy,
          editedByName: input.editedByName,
          editedByRole: input.editedByRole,
          batchId,
          createdAt: now,
          ...(autoApprove
            ? {
                approvedBy: 'system',
                approvedAt: now,
              }
            : {}),
        };

        this.edits.push(cascadeEdit);
        cascadeEdits.push(cascadeEdit);
      }
    }

    return {
      primaryEdit,
      cascadeEdits,
      batchId,
      autoApproved: autoApprove,
      totalEdits: 1 + cascadeEdits.length,
    };
  }

  /**
   * Get edit history for an entity
   */
  static async getHistory(
    entityType: string,
    entityId: string,
    options?: {
      limit?: number;
      status?: EditStatus;
    }
  ): Promise<EditRecord[]> {
    let filtered = this.edits.filter(
      (e) => e.entityType === entityType && e.entityId === entityId
    );

    if (options?.status) {
      filtered = filtered.filter((e) => e.status === options.status);
    }

    // Sort by createdAt descending
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Get all pending edits
   */
  static async getPendingEdits(): Promise<EditRecord[]> {
    return this.edits
      .filter((e) => e.status === 'PENDING')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Approve an edit (and its cascade children)
   */
  static async approveEdit(
    editId: string,
    approvedBy: string
  ): Promise<{ success: boolean; batchId: string }> {
    const edit = this.edits.find((e) => e.id === editId);
    if (!edit) throw new Error('Edit not found');

    const now = new Date().toISOString();

    // Approve all edits in the same batch
    this.edits = this.edits.map((e) => {
      if (e.batchId === edit.batchId) {
        return {
          ...e,
          status: 'APPROVED' as EditStatus,
          approvedBy,
          approvedAt: now,
        };
      }
      return e;
    });

    return { success: true, batchId: edit.batchId };
  }

  /**
   * Reject an edit (and its cascade children)
   */
  static async rejectEdit(
    editId: string,
    rejectedBy: string,
    reason: string
  ): Promise<{ success: boolean; batchId: string }> {
    const edit = this.edits.find((e) => e.id === editId);
    if (!edit) throw new Error('Edit not found');

    const now = new Date().toISOString();

    // Reject all edits in the same batch
    this.edits = this.edits.map((e) => {
      if (e.batchId === edit.batchId) {
        return {
          ...e,
          status: 'REJECTED' as EditStatus,
          rejectedBy,
          rejectedAt: now,
          rejectReason: reason,
        };
      }
      return e;
    });

    return { success: true, batchId: edit.batchId };
  }

  /**
   * Revert an approved edit
   */
  static async revertEdit(
    editId: string,
    revertedBy: string
  ): Promise<{ success: boolean; batchId: string }> {
    const edit = this.edits.find((e) => e.id === editId);
    if (!edit) throw new Error('Edit not found');

    if (edit.status !== 'APPROVED' && edit.status !== 'AUTO_APPROVED') {
      throw new Error('Can only revert approved edits');
    }

    // Revert all edits in the same batch
    this.edits = this.edits.map((e) => {
      if (e.batchId === edit.batchId) {
        return {
          ...e,
          status: 'REVERTED' as EditStatus,
        };
      }
      return e;
    });

    return { success: true, batchId: edit.batchId };
  }

  /**
   * Get edits grouped by batch
   */
  static async getEditsByBatch(
    entityType: string,
    entityId: string
  ): Promise<Record<string, EditRecord[]>> {
    const edits = await this.getHistory(entityType, entityId);

    return edits.reduce(
      (acc, edit) => {
        if (!acc[edit.batchId]) {
          acc[edit.batchId] = [];
        }
        acc[edit.batchId].push(edit);
        return acc;
      },
      {} as Record<string, EditRecord[]>
    );
  }

  /**
   * Clear all edits (for testing)
   */
  static clearAll(): void {
    this.edits = [];
  }
}
