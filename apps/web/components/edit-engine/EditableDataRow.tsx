'use client';

import React, { useCallback, useState } from 'react';
import { InlineEditField } from './InlineEditField';
import { EditConfirmationDialog } from './EditConfirmationDialog';
import { MiniThumbnail } from '@/components/media/MiniThumbnail';
import { calculateCascade } from '@/lib/edit/cascade-engine';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface FieldConfig {
  key: string;
  label: string;
  labelVi: string;
  type: 'text' | 'number' | 'currency' | 'percent' | 'select' | 'date';
  editable: boolean;
  width?: string;
  currency?: string;
  options?: { value: string; label: string }[];
}

interface CascadeEffect {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changePercent: number;
  rule: string;
  isHighImpact: boolean;
}

interface EditableDataRowProps {
  entityType: string;
  entityId: string;
  entityName: string;
  data: Record<string, unknown>;
  fields: FieldConfig[];
  imageUrl?: string | null;
  currentUser: { id: string; name: string; role: string };
  onSave?: (
    fieldName: string,
    newValue: unknown,
    batchId: string
  ) => Promise<void>;
  onDataChange?: (fieldName: string, newValue: unknown) => void;
  showThumbnail?: boolean;
}

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function EditableDataRow({
  entityType,
  entityId,
  entityName,
  data,
  fields,
  imageUrl,
  currentUser,
  onSave,
  onDataChange,
  showThumbnail = true,
}: EditableDataRowProps) {
  const [pendingEdit, setPendingEdit] = useState<{
    fieldName: string;
    fieldLabel: string;
    oldValue: string;
    newValue: string;
    numericNewValue: number;
    changePercent: number;
    cascadeEffects: CascadeEffect[];
  } | null>(null);

  // ── Handle field edit request ──
  const handleEditRequest = useCallback(
    async (fieldKey: string, fieldLabel: string, newValue: string | number) => {
      const oldValue = data[fieldKey];
      const numNew =
        typeof newValue === 'number' ? newValue : parseFloat(String(newValue));
      const numOld =
        typeof oldValue === 'number' ? oldValue : parseFloat(String(oldValue));
      const changePct =
        numOld !== 0
          ? ((numNew - numOld) / Math.abs(numOld)) * 100
          : numNew !== 0
            ? 100
            : 0;

      // Calculate cascade
      const rawCascades = calculateCascade(
        fieldKey,
        numNew,
        data as Record<string, number>
      );
      const cascadeEffects: CascadeEffect[] = rawCascades.map((effect) => {
        const effOld = effect.oldValue;
        const effNew = effect.newValue;
        const effPct =
          effOld !== 0 ? ((effNew - effOld) / Math.abs(effOld)) * 100 : 0;
        return {
          field: effect.field,
          fieldLabel:
            fields.find((f) => f.key === effect.field)?.labelVi || effect.field,
          oldValue: effOld.toLocaleString('vi-VN'),
          newValue: effNew.toLocaleString('vi-VN'),
          changePercent: effPct,
          rule: effect.rule,
          isHighImpact: Math.abs(effPct) > 10,
        };
      });

      // Show confirmation dialog
      setPendingEdit({
        fieldName: fieldKey,
        fieldLabel,
        oldValue: String(oldValue ?? ''),
        newValue: String(newValue),
        numericNewValue: numNew,
        changePercent: changePct,
        cascadeEffects,
      });
    },
    [data, fields]
  );

  // ── Confirm and save ──
  const handleConfirm = useCallback(
    async (reason?: string) => {
      if (!pendingEdit) return;

      const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (onSave) {
        await onSave(pendingEdit.fieldName, pendingEdit.numericNewValue, batchId);
      }

      onDataChange?.(pendingEdit.fieldName, pendingEdit.numericNewValue);
      setPendingEdit(null);
    },
    [pendingEdit, onSave, onDataChange]
  );

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/30 transition-colors group">
        {/* Product thumbnail */}
        {showThumbnail && (
          <td className="px-3 py-2 w-14">
            <MiniThumbnail src={imageUrl || ''} alt={entityName} size="md" />
          </td>
        )}

        {/* Data fields */}
        {fields.map((field) => (
          <td
            key={field.key}
            className="px-3 py-2"
            style={field.width ? { width: field.width } : undefined}
          >
            <InlineEditField
              value={(data[field.key] as string | number) ?? ''}
              fieldName={field.key}
              fieldType={field.type}
              currency={field.currency}
              options={field.options}
              editable={field.editable}
              onSave={async (newVal) => {
                await handleEditRequest(field.key, field.labelVi, newVal);
              }}
            />
          </td>
        ))}
      </tr>

      {/* Confirmation dialog (portal renders above table) */}
      {pendingEdit && (
        <EditConfirmationDialog
          isOpen={!!pendingEdit}
          onClose={() => setPendingEdit(null)}
          onConfirm={handleConfirm}
          primaryChange={pendingEdit}
          cascadeEffects={pendingEdit.cascadeEffects}
          entityName={entityName}
          entityId={entityId}
        />
      )}
    </>
  );
}

export default EditableDataRow;
export type { FieldConfig, EditableDataRowProps };
