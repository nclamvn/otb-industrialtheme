'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DeliveryMatrix as DeliveryMatrixType, DeliveryCellEdit, SKUDeliveryPlan, STORE_GROUP_COLORS } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Download, Filter, Search } from 'lucide-react';

interface DeliveryMatrixProps {
  data: DeliveryMatrixType;
  editable?: boolean;
  onCellChange?: (edit: DeliveryCellEdit) => void;
  onSave?: () => void;
  className?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
};

export function DeliveryMatrix({
  data,
  editable = true,
  onCellChange,
  onSave,
  className,
}: DeliveryMatrixProps) {
  const [editedCells, setEditedCells] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>('');

  const filteredSkus = useMemo(() => {
    if (!filter) return data.skus;
    const lowerFilter = filter.toLowerCase();
    return data.skus.filter(sku =>
      sku.skuCode.toLowerCase().includes(lowerFilter) ||
      sku.skuName.toLowerCase().includes(lowerFilter)
    );
  }, [data.skus, filter]);

  const getCellKey = (skuId: string, storeId: string, month: number) =>
    `${skuId}-${storeId}-${month}`;

  const getCellValue = (sku: SKUDeliveryPlan, storeId: string, month: number): number => {
    const key = getCellKey(sku.skuId, storeId, month);
    if (editedCells[key] !== undefined) return editedCells[key];
    return sku.byStore[storeId]?.byMonth[month] || 0;
  };

  const handleCellChange = (skuId: string, storeId: string, month: number, value: number) => {
    const key = getCellKey(skuId, storeId, month);
    setEditedCells(prev => ({ ...prev, [key]: value }));
    onCellChange?.({ skuId, storeId, month, units: value });
  };

  const handleReset = () => {
    setEditedCells({});
  };

  const hasChanges = Object.keys(editedCells).length > 0;

  // Calculate row total with edits
  const getRowTotal = (sku: SKUDeliveryPlan): number => {
    let total = 0;
    data.stores.forEach(store => {
      data.months.forEach(month => {
        total += getCellValue(sku, store.id, month.month);
      });
    });
    return total;
  };

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900', className)}>
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">Delivery Planning Matrix</h3>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Filter SKU..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 w-48 h-9"
              />
            </div>

            {/* Actions */}
            {editable && hasChanges && (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={onSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {/* Store Header Row */}
            <tr className="bg-slate-100 dark:bg-slate-800/50">
              <th
                className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 text-left font-medium border-r border-slate-200 dark:border-slate-700 min-w-[120px]"
                rowSpan={2}
              >
                SKU
              </th>
              <th
                className="sticky left-[120px] z-20 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 text-left font-medium border-r border-slate-200 dark:border-slate-700 min-w-[180px]"
                rowSpan={2}
              >
                Product
              </th>
              {data.stores.map((store) => {
                const colors = STORE_GROUP_COLORS[store.storeGroup];
                return (
                  <th
                    key={store.id}
                    colSpan={data.months.length}
                    className={cn(
                      'px-4 py-2 text-center font-medium border-r border-slate-200 dark:border-slate-700',
                      colors.bg,
                      colors.text
                    )}
                  >
                    {store.shortName || store.name}
                  </th>
                );
              })}
              <th
                className="px-4 py-2 text-center font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 min-w-[80px]"
                rowSpan={2}
              >
                Total
              </th>
            </tr>

            {/* Month Header Row */}
            <tr className="bg-slate-50 dark:bg-slate-800/30">
              {data.stores.map((store) =>
                data.months.map((month) => (
                  <th
                    key={`${store.id}-${month.month}`}
                    className="px-2 py-1 text-center text-xs font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[70px]"
                  >
                    {month.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {filteredSkus.map((sku, index) => (
              <tr
                key={sku.skuId}
                className={cn(
                  'border-b border-slate-100 dark:border-slate-800',
                  index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                )}
              >
                {/* SKU Code */}
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2 font-mono text-xs border-r border-slate-200 dark:border-slate-700">
                  {sku.skuCode}
                </td>

                {/* Product Name */}
                <td className="sticky left-[120px] z-10 bg-inherit px-4 py-2 text-sm border-r border-slate-200 dark:border-slate-700 max-w-[180px] truncate">
                  {sku.skuName}
                </td>

                {/* Delivery Cells */}
                {data.stores.map((store) =>
                  data.months.map((month) => {
                    const value = getCellValue(sku, store.id, month.month);
                    const key = getCellKey(sku.skuId, store.id, month.month);
                    const isEdited = editedCells[key] !== undefined;

                    return (
                      <td
                        key={`${sku.skuId}-${store.id}-${month.month}`}
                        className={cn(
                          'px-1 py-1 text-center border-r border-slate-100 dark:border-slate-800',
                          isEdited && 'bg-amber-50 dark:bg-amber-900/20'
                        )}
                      >
                        {editable ? (
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(e) =>
                              handleCellChange(
                                sku.skuId,
                                store.id,
                                month.month,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-14 h-7 text-center text-xs mx-auto"
                          />
                        ) : (
                          <span
                            className={cn(
                              'text-xs',
                              value > 0 ? 'font-medium' : 'text-slate-400'
                            )}
                          >
                            {value || '-'}
                          </span>
                        )}
                      </td>
                    );
                  })
                )}

                {/* Row Total */}
                <td className="px-4 py-2 text-center font-semibold bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300">
                  {getRowTotal(sku)}
                </td>
              </tr>
            ))}

            {/* Totals Row */}
            <tr className="bg-slate-100 dark:bg-slate-800 font-semibold">
              <td
                className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 px-4 py-3 border-r border-slate-200 dark:border-slate-700"
                colSpan={2}
              >
                TOTAL
              </td>
              {data.stores.map((store) =>
                data.months.map((month) => {
                  // Calculate column total with edits
                  const colTotal = filteredSkus.reduce(
                    (sum, sku) => sum + getCellValue(sku, store.id, month.month),
                    0
                  );
                  return (
                    <td
                      key={`total-${store.id}-${month.month}`}
                      className="px-2 py-3 text-center border-r border-slate-200 dark:border-slate-700"
                    >
                      {colTotal}
                    </td>
                  );
                })
              )}
              <td className="px-4 py-3 text-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {filteredSkus.reduce((sum, sku) => sum + getRowTotal(sku), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
        Showing {filteredSkus.length} of {data.skus.length} SKUs
        {hasChanges && (
          <span className="ml-2 text-amber-600">
            ({Object.keys(editedCells).length} unsaved changes)
          </span>
        )}
      </div>
    </div>
  );
}

export default DeliveryMatrix;
