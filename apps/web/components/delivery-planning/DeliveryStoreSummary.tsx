'use client';

import { cn } from '@/lib/utils';
import { DeliveryMatrix, STORE_GROUP_COLORS } from './types';
import { Building2, Package, TrendingUp, Calendar } from 'lucide-react';

interface DeliveryStoreSummaryProps {
  data: DeliveryMatrix;
  className?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return value.toLocaleString();
};

export function DeliveryStoreSummary({ data, className }: DeliveryStoreSummaryProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {data.stores.map((store) => {
        const total = data.totals.byStore[store.id] || 0;
        const colors = STORE_GROUP_COLORS[store.storeGroup];

        // Calculate by month for this store
        const byMonth = data.months.map((m) => ({
          label: m.label,
          units: data.skus.reduce(
            (sum, sku) => sum + (sku.byStore[store.id]?.byMonth[m.month] || 0),
            0
          ),
        }));

        // Calculate percentage of total
        const percentage = data.totals.grand > 0 ? (total / data.totals.grand) * 100 : 0;

        return (
          <div
            key={store.id}
            className={cn(
              'rounded-xl border-l-4 bg-white dark:bg-slate-800 overflow-hidden transition-all hover:shadow-md',
              colors.border
            )}
          >
            {/* Header */}
            <div className={cn('px-4 py-3 border-b border-slate-200 dark:border-slate-700', colors.bg)}>
              <div className="flex items-center gap-2">
                <Building2 className={cn('w-5 h-5', colors.text)} />
                <div>
                  <div className={cn('font-semibold', colors.text)}>
                    {store.shortName || store.name}
                  </div>
                  <div className="text-xs text-slate-500">{store.storeCode}</div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Total Units */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Package className="w-4 h-4" />
                  Total Units
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {total.toLocaleString()}
                </div>
              </div>

              {/* Percentage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <TrendingUp className="w-4 h-4" />
                  Share
                </div>
                <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {percentage.toFixed(1)}%
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Calendar className="w-3 h-3" />
                  Monthly Breakdown
                </div>
                <div className="space-y-2">
                  {byMonth.map((m) => {
                    const monthPct = total > 0 ? (m.units / total) * 100 : 0;
                    return (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400">{m.label}</span>
                          <span className="font-medium">{m.units.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              store.storeGroup === 'REX' && 'bg-blue-500',
                              store.storeGroup === 'TTP' && 'bg-purple-500',
                              store.storeGroup === 'ALL' && 'bg-slate-500'
                            )}
                            style={{ width: `${monthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DeliveryStoreSummary;
