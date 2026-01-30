'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ProposalProduct,
  SizeAllocation,
  formatCurrency,
  formatPercent,
  SKUWarning,
} from './types';
import { useAutoGenerate } from './hooks/useAutoGenerate';
import {
  Pencil,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

interface SizeBreakdownTableProps {
  product: ProposalProduct;
  onUpdateProduct: (updates: Partial<ProposalProduct>) => void;
  onUpdateSizes: (sizes: SizeAllocation[]) => void;
  warnings?: SKUWarning[];
  isEditable?: boolean;
  className?: string;
}

interface EditableCell {
  sizeCode: string;
  field: 'salesMixPercent' | 'units';
}

export function SizeBreakdownTable({
  product,
  onUpdateProduct,
  onUpdateSizes,
  warnings = [],
  isEditable = true,
  className,
}: SizeBreakdownTableProps) {
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingTotalQty, setEditingTotalQty] = useState(false);
  const [editingTotalValue, setEditingTotalValue] = useState(false);
  const [totalQtyInput, setTotalQtyInput] = useState('');
  const [totalValueInput, setTotalValueInput] = useState('');

  const {
    generateFromTotalQty,
    generateFromTotalValue,
    updateSalesMix,
    updateSizeUnits,
  } = useAutoGenerate();

  // Get warnings for specific size
  const getWarningsForSize = useCallback(
    (sizeCode: string) => {
      return warnings.filter((w) => w.sizeCode === sizeCode);
    },
    [warnings]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalSalesMix = product.sizes.reduce((sum, s) => sum + s.salesMixPercent, 0);
    const totalUnits = product.sizes.reduce((sum, s) => sum + s.units, 0);
    const totalValue = product.sizes.reduce((sum, s) => sum + s.value, 0);

    return { totalSalesMix, totalUnits, totalValue };
  }, [product.sizes]);

  // Handle cell edit start
  const handleStartEdit = useCallback(
    (sizeCode: string, field: 'salesMixPercent' | 'units', currentValue: number) => {
      if (!isEditable) return;
      setEditingCell({ sizeCode, field });
      setEditValue(currentValue.toString());
    },
    [isEditable]
  );

  // Handle cell edit confirm
  const handleConfirmEdit = useCallback(() => {
    if (!editingCell) return;

    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      setEditingCell(null);
      return;
    }

    let result;
    if (editingCell.field === 'salesMixPercent') {
      result = updateSalesMix(product, editingCell.sizeCode, value, true);
    } else {
      result = updateSizeUnits(product, editingCell.sizeCode, value);
    }

    onUpdateSizes(result.sizes);
    onUpdateProduct({
      totalQty: result.totalQty,
      totalValue: result.totalValue,
    });

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, product, updateSalesMix, updateSizeUnits, onUpdateSizes, onUpdateProduct]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Handle total qty edit
  const handleTotalQtyEdit = useCallback(() => {
    const value = parseInt(totalQtyInput);
    if (isNaN(value) || value < 0) {
      setEditingTotalQty(false);
      return;
    }

    const result = generateFromTotalQty(product, value);
    onUpdateSizes(result.sizes);
    onUpdateProduct({
      totalQty: result.totalQty,
      totalValue: result.totalValue,
    });

    setEditingTotalQty(false);
    setTotalQtyInput('');
  }, [totalQtyInput, product, generateFromTotalQty, onUpdateSizes, onUpdateProduct]);

  // Handle total value edit
  const handleTotalValueEdit = useCallback(() => {
    const value = parseFloat(totalValueInput);
    if (isNaN(value) || value < 0) {
      setEditingTotalValue(false);
      return;
    }

    const result = generateFromTotalValue(product, value);
    onUpdateSizes(result.sizes);
    onUpdateProduct({
      totalQty: result.totalQty,
      totalValue: result.totalValue,
    });

    setEditingTotalValue(false);
    setTotalValueInput('');
  }, [totalValueInput, product, generateFromTotalValue, onUpdateSizes, onUpdateProduct]);

  // Handle key press in editable input
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, confirmFn: () => void, cancelFn: () => void) => {
      if (e.key === 'Enter') {
        confirmFn();
      } else if (e.key === 'Escape') {
        cancelFn();
      }
    },
    []
  );

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Product Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-slate-500">Product:</span>
              <span className="ml-2 font-medium text-slate-800">
                {product.styleName}
              </span>
            </div>
            <Badge variant="outline" className="text-slate-500">
              {product.styleCode}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-slate-500">Unit Price:</span>
              <span className="ml-2 font-semibold text-slate-800">
                {formatCurrency(product.unitPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Size Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-20">Size</TableHead>
                <TableHead className="text-center">% Sales Mix</TableHead>
                <TableHead className="text-center">% Sell-Thru</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {product.sizes.map((size) => {
                const sizeWarnings = getWarningsForSize(size.sizeCode);
                const isEditingSalesMix =
                  editingCell?.sizeCode === size.sizeCode &&
                  editingCell?.field === 'salesMixPercent';
                const isEditingUnits =
                  editingCell?.sizeCode === size.sizeCode &&
                  editingCell?.field === 'units';

                return (
                  <TableRow
                    key={size.sizeCode}
                    className={cn(
                      size.isManuallyEdited && 'bg-amber-50/50',
                      sizeWarnings.some((w) => w.severity === 'error') && 'bg-red-50/50'
                    )}
                  >
                    {/* Size Code */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {size.sizeCode}
                        {sizeWarnings.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle
                                className={cn(
                                  'w-4 h-4',
                                  sizeWarnings.some((w) => w.severity === 'error')
                                    ? 'text-red-500'
                                    : 'text-amber-500'
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {sizeWarnings.map((w) => (
                                <div key={w.id} className="text-xs">
                                  {w.message}
                                </div>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>

                    {/* Sales Mix % */}
                    <TableCell className="text-center">
                      {isEditingSalesMix ? (
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              handleKeyPress(e, handleConfirmEdit, handleCancelEdit)
                            }
                            className="w-20 h-8 text-center text-sm"
                            autoFocus
                            min={0}
                            max={100}
                            step={1}
                          />
                          <span className="text-slate-400">%</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleConfirmEdit}
                          >
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 transition-colors',
                            isEditable && 'group'
                          )}
                          onClick={() =>
                            handleStartEdit(size.sizeCode, 'salesMixPercent', size.salesMixPercent)
                          }
                        >
                          <span className="tabular-nums">
                            {formatPercent(size.salesMixPercent)}
                          </span>
                          {isEditable && (
                            <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Sell-Thru % */}
                    <TableCell className="text-center">
                      {size.sellThruPercent !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={cn(
                              'tabular-nums',
                              size.sellThruPercent >= 50
                                ? 'text-green-600'
                                : size.sellThruPercent >= 30
                                ? 'text-amber-600'
                                : 'text-red-600'
                            )}
                          >
                            {formatPercent(size.sellThruPercent)}
                          </span>
                          {size.sellThruPercent >= 50 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : size.sellThruPercent < 30 ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-300">
                          <Minus className="w-4 h-4 mx-auto" />
                        </span>
                      )}
                    </TableCell>

                    {/* Units */}
                    <TableCell className="text-right">
                      {isEditingUnits ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              handleKeyPress(e, handleConfirmEdit, handleCancelEdit)
                            }
                            className="w-20 h-8 text-right text-sm"
                            autoFocus
                            min={0}
                            step={1}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleConfirmEdit}
                          >
                            <Check className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 transition-colors',
                            isEditable && 'group'
                          )}
                          onClick={() =>
                            handleStartEdit(size.sizeCode, 'units', size.units)
                          }
                        >
                          <span className="tabular-nums font-medium">
                            {size.units.toLocaleString()}
                          </span>
                          {isEditable && (
                            <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Value */}
                    <TableCell className="text-right tabular-nums text-slate-600">
                      {formatCurrency(size.value)}
                    </TableCell>

                    {/* Indicator */}
                    <TableCell>
                      {size.isManuallyEdited && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs px-1">
                              M
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Manually edited</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            {/* Footer - Totals */}
            <TableFooter>
              <TableRow className="bg-slate-100 font-medium">
                <TableCell>TOTAL</TableCell>

                {/* Total Sales Mix */}
                <TableCell className="text-center">
                  <span
                    className={cn(
                      'tabular-nums',
                      Math.abs(totals.totalSalesMix - 100) > 0.5
                        ? 'text-amber-600'
                        : 'text-slate-600'
                    )}
                  >
                    {formatPercent(totals.totalSalesMix)}
                  </span>
                  {Math.abs(totals.totalSalesMix - 100) > 0.5 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="w-4 h-4 text-amber-500 ml-1 inline" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Sales mix should total 100%
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>

                <TableCell></TableCell>

                {/* Total Units */}
                <TableCell className="text-right">
                  {editingTotalQty ? (
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        value={totalQtyInput}
                        onChange={(e) => setTotalQtyInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleKeyPress(
                            e,
                            handleTotalQtyEdit,
                            () => setEditingTotalQty(false)
                          )
                        }
                        className="w-24 h-8 text-right text-sm"
                        autoFocus
                        min={0}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleTotalQtyEdit}
                      >
                        <Check className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setEditingTotalQty(false)}
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors',
                        isEditable && 'group'
                      )}
                      onClick={() => {
                        if (isEditable) {
                          setEditingTotalQty(true);
                          setTotalQtyInput(totals.totalUnits.toString());
                        }
                      }}
                    >
                      <span className="tabular-nums font-semibold">
                        {totals.totalUnits.toLocaleString()}
                      </span>
                      {isEditable && (
                        <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Total Value */}
                <TableCell className="text-right">
                  {editingTotalValue ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-400">$</span>
                      <Input
                        type="number"
                        value={totalValueInput}
                        onChange={(e) => setTotalValueInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleKeyPress(
                            e,
                            handleTotalValueEdit,
                            () => setEditingTotalValue(false)
                          )
                        }
                        className="w-28 h-8 text-right text-sm"
                        autoFocus
                        min={0}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleTotalValueEdit}
                      >
                        <Check className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setEditingTotalValue(false)}
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors',
                        isEditable && 'group'
                      )}
                      onClick={() => {
                        if (isEditable) {
                          setEditingTotalValue(true);
                          setTotalValueInput(totals.totalValue.toString());
                        }
                      }}
                    >
                      <span className="tabular-nums font-semibold text-slate-800">
                        {formatCurrency(totals.totalValue)}
                      </span>
                      {isEditable && (
                        <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  )}
                </TableCell>

                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Helper Text */}
        {isEditable && (
          <p className="text-xs text-slate-400">
            Click on any editable value to modify. Changes will auto-calculate related fields.
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

export default SizeBreakdownTable;
