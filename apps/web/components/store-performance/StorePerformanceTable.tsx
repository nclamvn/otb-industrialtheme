'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StoreComparisonData, STORE_GROUP_CONFIG } from './types';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface StorePerformanceTableProps {
  data: StoreComparisonData[];
  className?: string;
  onRowClick?: (item: StoreComparisonData) => void;
}

type SortField = 'sku' | 'rex' | 'ttp' | 'variance';
type SortDirection = 'asc' | 'desc';

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export function StorePerformanceTable({
  data,
  className,
  onRowClick,
}: StorePerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('variance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRow = (skuId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(skuId)) {
      newExpanded.delete(skuId);
    } else {
      newExpanded.add(skuId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedData = [...data].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'sku':
        comparison = a.sku.code.localeCompare(b.sku.code);
        break;
      case 'rex':
        comparison = a.rex.sellThruPercent - b.rex.sellThruPercent;
        break;
      case 'ttp':
        comparison = a.ttp.sellThruPercent - b.ttp.sellThruPercent;
        break;
      case 'variance':
        comparison = Math.abs(a.variance.sellThru) - Math.abs(b.variance.sellThru);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        'ml-1 h-4 w-4 inline',
        sortField === field ? 'text-blue-600' : 'text-slate-400'
      )}
    />
  );

  const TrendBadge = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
    if (!trend) return null;
    const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const color = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500';
    return <Icon className={cn('h-4 w-4', color)} />;
  };

  const VarianceBadge = ({ variance }: { variance: number }) => {
    const isPositive = variance > 0.01;
    const isNegative = variance < -0.01;

    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          isPositive && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
          isNegative && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
          !isPositive && !isNegative && 'bg-muted text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        )}
      >
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
        {formatPercentage(Math.abs(variance))}
      </div>
    );
  };

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('sku')}
              >
                SKU <SortIcon field="sku" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-auto p-0 font-semibold hover:bg-transparent', STORE_GROUP_CONFIG.REX.color)}
                onClick={() => handleSort('rex')}
              >
                REX ST% <SortIcon field="rex" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-auto p-0 font-semibold hover:bg-transparent', STORE_GROUP_CONFIG.TTP.color)}
                onClick={() => handleSort('ttp')}
              >
                TTP ST% <SortIcon field="ttp" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('variance')}
              >
                Variance <SortIcon field="variance" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Winner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item) => {
            const isExpanded = expandedRows.has(item.sku.id);
            const winner = item.variance.sellThru > 0.01 ? 'REX' : item.variance.sellThru < -0.01 ? 'TTP' : 'TIE';

            return (
              <>
                <TableRow
                  key={item.sku.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-800/50',
                    isExpanded && 'bg-muted/50'
                  )}
                  onClick={() => toggleRow(item.sku.id)}
                >
                  <TableCell className="w-8">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-mono text-sm text-slate-500">{item.sku.code}</div>
                      <div className="font-medium text-slate-900 dark:text-white">{item.sku.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn('font-semibold', STORE_GROUP_CONFIG.REX.color)}>
                        {formatPercentage(item.rex.sellThruPercent)}
                      </span>
                      <TrendBadge trend={item.rex.trend} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn('font-semibold', STORE_GROUP_CONFIG.TTP.color)}>
                        {formatPercentage(item.ttp.sellThruPercent)}
                      </span>
                      <TrendBadge trend={item.ttp.trend} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <VarianceBadge variance={item.variance.sellThru} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        winner === 'REX' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                        winner === 'TTP' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                        winner === 'TIE' && 'bg-muted text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      )}
                    >
                      {winner}
                    </span>
                  </TableCell>
                </TableRow>

                {/* Expanded Details Row */}
                {isExpanded && (
                  <TableRow key={`${item.sku.id}-details`} className="bg-muted/50/50 dark:bg-slate-800/30">
                    <TableCell colSpan={6}>
                      <div className="grid grid-cols-2 gap-6 py-3 px-4">
                        {/* REX Details */}
                        <div className={cn('rounded-lg p-4', STORE_GROUP_CONFIG.REX.bgColor)}>
                          <div className={cn('font-semibold mb-3', STORE_GROUP_CONFIG.REX.color)}>
                            REX Details
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500">Sold</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {item.rex.qtySold.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">On Hand</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {item.rex.qtyOnHand.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">Sales Value</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(item.rex.salesValue)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* TTP Details */}
                        <div className={cn('rounded-lg p-4', STORE_GROUP_CONFIG.TTP.bgColor)}>
                          <div className={cn('font-semibold mb-3', STORE_GROUP_CONFIG.TTP.color)}>
                            TTP Details
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-slate-500">Sold</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {item.ttp.qtySold.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">On Hand</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {item.ttp.qtyOnHand.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500">Sales Value</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(item.ttp.salesValue)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default StorePerformanceTable;
