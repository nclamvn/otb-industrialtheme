'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
  sales: number;
  target: number;
  units: number;
  margin: number;
  trend: number;
  status: 'on-track' | 'at-risk' | 'exceeded';
}

interface DAFCCategoryTableProps {
  data: CategoryData[];
  title?: string;
  subtitle?: string;
  onRowClick?: (category: CategoryData) => void;
  className?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const StatusBadge = ({ status }: { status: CategoryData['status'] }) => {
  const config = {
    'on-track': {
      label: 'On Track',
      className: 'dafc-badge-green',
    },
    'at-risk': {
      label: 'At Risk',
      className: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    },
    'exceeded': {
      label: 'Exceeded',
      className: 'dafc-badge-gold',
    },
  };

  const { label, className } = config[status];

  return (
    <span className={cn('dafc-badge text-[10px]', className)}>
      {label}
    </span>
  );
};

const TrendIndicator = ({ value }: { value: number }) => {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const colorClass = value > 0
    ? 'text-[hsl(152_73%_27%)]'
    : value < 0
    ? 'text-red-500'
    : 'text-muted-foreground';

  return (
    <div className={cn('flex items-center gap-1 font-data text-sm', colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
};

const ProgressBar = ({ value, target }: { value: number; target: number }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const isExceeded = value >= target;

  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          isExceeded
            ? 'bg-[hsl(152_73%_27%)]'
            : percentage >= 80
            ? 'bg-[hsl(30_43%_72%)]'
            : 'bg-amber-500'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export function DAFCCategoryTable({
  data,
  title = 'Category Performance',
  subtitle = 'Sales by product category',
  onRowClick,
  className,
}: DAFCCategoryTableProps) {
  return (
    <div className={cn('dafc-card-gold overflow-hidden', className)}>
      {/* Header */}
      <div className="dafc-card-header flex items-center justify-between">
        <div>
          <h3 className="font-brand font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <button className="dafc-btn-secondary text-xs py-1.5 px-4">
          View All
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="dafc-table">
          <thead>
            <tr>
              <th className="w-[200px]">Category</th>
              <th data-align="right">Sales</th>
              <th data-align="right">Units</th>
              <th data-align="center" className="w-[120px]">Progress</th>
              <th data-align="right">Margin</th>
              <th data-align="right">Trend</th>
              <th data-align="center" className="w-[100px]">Status</th>
              <th className="w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((category) => (
              <tr
                key={category.id}
                onClick={() => onRowClick?.(category)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-[hsl(30_43%_72%/0.05)]'
                )}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{
                        background: category.status === 'exceeded'
                          ? 'hsl(152 73% 27%)'
                          : category.status === 'on-track'
                          ? 'hsl(30 43% 72%)'
                          : 'hsl(38 92% 50%)'
                      }}
                    />
                    <span className="font-medium text-foreground">{category.name}</span>
                  </div>
                </td>
                <td data-align="right">
                  <span className="font-data font-semibold tabular-nums">
                    {formatCurrency(category.sales)}
                  </span>
                </td>
                <td data-align="right">
                  <span className="font-data tabular-nums text-muted-foreground">
                    {category.units.toLocaleString()}
                  </span>
                </td>
                <td>
                  <div className="flex flex-col items-center gap-1">
                    <ProgressBar value={category.sales} target={category.target} />
                    <span className="text-[10px] text-muted-foreground font-data">
                      {formatPercent((category.sales / category.target) * 100)} of target
                    </span>
                  </div>
                </td>
                <td data-align="right">
                  <span className="font-data tabular-nums">
                    {formatPercent(category.margin)}
                  </span>
                </td>
                <td data-align="right">
                  <TrendIndicator value={category.trend} />
                </td>
                <td data-align="center">
                  <StatusBadge status={category.status} />
                </td>
                <td>
                  {onRowClick && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DAFCCategoryTable;
