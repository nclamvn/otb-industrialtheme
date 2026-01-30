'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChoiceAllocationData, CHOICE_CONFIG, SizeQuantity } from './types';
import { Lock, Unlock, Edit2, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SizeAllocationTableProps {
  data: ChoiceAllocationData;
  onUpdate?: (sizes: SizeQuantity[]) => void;
  className?: string;
  editable?: boolean;
}

export function SizeAllocationTable({
  data,
  onUpdate,
  className,
  editable = true,
}: SizeAllocationTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ qtyA: number; qtyB: number; qtyC: number } | null>(null);

  const handleEditStart = (size: SizeQuantity) => {
    if (!editable || data.isLocked) return;
    setEditingRow(size.size);
    setEditValues({ qtyA: size.qtyA, qtyB: size.qtyB, qtyC: size.qtyC });
  };

  const handleEditCancel = () => {
    setEditingRow(null);
    setEditValues(null);
  };

  const handleEditSave = (sizeRow: SizeQuantity) => {
    if (!editValues || !onUpdate) return;

    const updatedSizes = data.sizes.map((s) => {
      if (s.size === sizeRow.size) {
        const total = editValues.qtyA + editValues.qtyB + editValues.qtyC;
        return {
          ...s,
          qtyA: editValues.qtyA,
          qtyB: editValues.qtyB,
          qtyC: editValues.qtyC,
          total,
        };
      }
      return s;
    });

    // Recalculate percentages
    const grandTotal = updatedSizes.reduce((sum, s) => sum + s.total, 0);
    const finalSizes = updatedSizes.map((s) => ({
      ...s,
      percentage: grandTotal > 0 ? (s.total / grandTotal) * 100 : 0,
    }));

    onUpdate(finalSizes);
    setEditingRow(null);
    setEditValues(null);
  };

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-slate-500">{data.skuCode}</div>
            <div className="font-semibold text-slate-900 dark:text-white">{data.productName}</div>
          </div>
          <div className="flex items-center gap-2">
            {data.isLocked ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                Locked
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Unlock className="w-3 h-3" />
                Editable
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 dark:bg-slate-800/30">
            <TableHead className="w-16">Size</TableHead>
            <TableHead className={cn('text-center', CHOICE_CONFIG.A.color)}>Qty A</TableHead>
            <TableHead className={cn('text-center', CHOICE_CONFIG.B.color)}>Qty B</TableHead>
            <TableHead className={cn('text-center', CHOICE_CONFIG.C.color)}>Qty C</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead className="text-center">%</TableHead>
            {editable && <TableHead className="w-20"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.sizes.map((sizeRow) => (
            <TableRow
              key={sizeRow.size}
              className={cn(
                editingRow === sizeRow.size && 'bg-blue-50/50 dark:bg-blue-900/10'
              )}
            >
              <TableCell className="font-medium">{sizeRow.size}</TableCell>

              {/* Qty A */}
              <TableCell className="text-center">
                {editingRow === sizeRow.size && editValues ? (
                  <Input
                    type="number"
                    min={0}
                    value={editValues.qtyA}
                    onChange={(e) => setEditValues({ ...editValues, qtyA: parseInt(e.target.value) || 0 })}
                    className={cn('w-20 h-8 text-center mx-auto', CHOICE_CONFIG.A.bgColor)}
                  />
                ) : (
                  <span className={cn('font-medium', CHOICE_CONFIG.A.color)}>
                    {sizeRow.qtyA}
                  </span>
                )}
              </TableCell>

              {/* Qty B */}
              <TableCell className="text-center">
                {editingRow === sizeRow.size && editValues ? (
                  <Input
                    type="number"
                    min={0}
                    value={editValues.qtyB}
                    onChange={(e) => setEditValues({ ...editValues, qtyB: parseInt(e.target.value) || 0 })}
                    className={cn('w-20 h-8 text-center mx-auto', CHOICE_CONFIG.B.bgColor)}
                  />
                ) : (
                  <span className={cn('font-medium', CHOICE_CONFIG.B.color)}>
                    {sizeRow.qtyB}
                  </span>
                )}
              </TableCell>

              {/* Qty C */}
              <TableCell className="text-center">
                {editingRow === sizeRow.size && editValues ? (
                  <Input
                    type="number"
                    min={0}
                    value={editValues.qtyC}
                    onChange={(e) => setEditValues({ ...editValues, qtyC: parseInt(e.target.value) || 0 })}
                    className={cn('w-20 h-8 text-center mx-auto', CHOICE_CONFIG.C.bgColor)}
                  />
                ) : (
                  <span className={cn('font-medium', CHOICE_CONFIG.C.color)}>
                    {sizeRow.qtyC}
                  </span>
                )}
              </TableCell>

              {/* Total */}
              <TableCell className="text-center font-semibold text-slate-900 dark:text-white">
                {editingRow === sizeRow.size && editValues
                  ? editValues.qtyA + editValues.qtyB + editValues.qtyC
                  : sizeRow.total}
              </TableCell>

              {/* Percentage */}
              <TableCell className="text-center text-slate-500">
                {sizeRow.percentage.toFixed(1)}%
              </TableCell>

              {/* Actions */}
              {editable && (
                <TableCell>
                  {editingRow === sizeRow.size ? (
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleEditSave(sizeRow)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={handleEditCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    !data.isLocked && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEditStart(sizeRow)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}

          {/* Totals Row */}
          <TableRow className="bg-slate-100 dark:bg-slate-800 font-semibold">
            <TableCell>TOTAL</TableCell>
            <TableCell className={cn('text-center', CHOICE_CONFIG.A.color)}>
              {data.totalA}
            </TableCell>
            <TableCell className={cn('text-center', CHOICE_CONFIG.B.color)}>
              {data.totalB}
            </TableCell>
            <TableCell className={cn('text-center', CHOICE_CONFIG.C.color)}>
              {data.totalC}
            </TableCell>
            <TableCell className="text-center text-slate-900 dark:text-white">
              {data.grandTotal}
            </TableCell>
            <TableCell className="text-center">100%</TableCell>
            {editable && <TableCell></TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default SizeAllocationTable;
