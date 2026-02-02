'use client';

import { cn } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Types
interface BudgetSegment {
  label: string;
  allocated: number;
  color: string;
}

interface BudgetHealthCardProps {
  title: string;
  totalBudget: number;
  allocated: number;
  committed: number;
  spent: number;
  segments?: BudgetSegment[];
  currency?: string;
  className?: string;
}

// Format currency helper
const formatVND = (v: number) => {
  if (v >= 1e9) return `₫${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `₫${(v / 1e6).toFixed(0)}M`;
  return `₫${v.toLocaleString('vi-VN')}`;
};

// Status configuration
type BudgetStatus = 'critical' | 'warning' | 'healthy' | 'underutilized';

const statusConfig: Record<
  BudgetStatus,
  {
    icon: typeof AlertTriangle;
    color: string;
    bg: string;
    label: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'Gần hết',
  },
  warning: {
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    label: 'Cần theo dõi',
  },
  healthy: {
    icon: CheckCircle2,
    color: 'text-[#127749]',
    bg: 'bg-[#127749]/10',
    label: 'Ổn định',
  },
  underutilized: {
    icon: TrendingDown,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'Thấp',
  },
};

export function BudgetHealthCard({
  title,
  totalBudget,
  allocated,
  committed,
  spent,
  segments,
  currency = 'VND',
  className,
}: BudgetHealthCardProps) {
  const remaining = totalBudget - allocated;
  const utilizationPct = (allocated / totalBudget) * 100;
  const commitPct = (committed / totalBudget) * 100;
  const spentPct = (spent / totalBudget) * 100;

  // Determine status based on utilization
  const status: BudgetStatus =
    utilizationPct >= 95
      ? 'critical'
      : utilizationPct >= 85
        ? 'warning'
        : utilizationPct >= 50
          ? 'healthy'
          : 'underutilized';

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(184, 134, 11, 0.2)' }}
            >
              <PieChart className="h-4 w-4" style={{ color: '#B8860B' }} />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>
                Tổng ngân sách: {formatVND(totalBudget)}
              </CardDescription>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
              config.bg,
              config.color
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            {/* Spent (darkest) */}
            <div
              className="absolute h-full bg-[#127749] rounded-l-full transition-all"
              style={{ width: `${spentPct}%` }}
            />
            {/* Committed */}
            <div
              className="absolute h-full transition-all"
              style={{
                left: `${spentPct}%`,
                width: `${Math.max(0, commitPct - spentPct)}%`,
                backgroundColor: 'rgba(184, 134, 11, 0.6)',
              }}
            />
            {/* Allocated but not committed */}
            <div
              className="absolute h-full transition-all"
              style={{
                left: `${commitPct}%`,
                width: `${Math.max(0, utilizationPct - commitPct)}%`,
                backgroundColor: 'rgba(184, 134, 11, 0.25)',
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-[#127749]" />
              <span className="text-muted-foreground">
                Đã chi: {formatVND(spent)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-2 rounded-sm"
                style={{ backgroundColor: 'rgba(184, 134, 11, 0.6)' }}
              />
              <span className="text-muted-foreground">
                Đã cam kết: {formatVND(committed)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-2 rounded-sm"
                style={{ backgroundColor: 'rgba(184, 134, 11, 0.25)' }}
              />
              <span className="text-muted-foreground">
                Đã phân bổ: {formatVND(allocated)}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Sử dụng
            </span>
            <span className={cn('text-lg font-mono font-bold', config.color)}>
              {utilizationPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Còn lại
            </span>
            <span className="text-lg font-mono font-bold">
              {formatVND(remaining)}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
              Cam kết
            </span>
            <span
              className="text-lg font-mono font-bold"
              style={{ color: '#B8860B' }}
            >
              {commitPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Category Segments */}
        {segments && segments.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Phân bổ theo danh mục
            </h4>
            {segments.map((seg, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 truncate">
                  {seg.label}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(seg.allocated / totalBudget) * 100}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                  {formatVND(seg.allocated)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for dashboard widgets
export function BudgetHealthWidget({
  title,
  totalBudget,
  allocated,
  className,
}: {
  title: string;
  totalBudget: number;
  allocated: number;
  className?: string;
}) {
  const utilizationPct = (allocated / totalBudget) * 100;
  const remaining = totalBudget - allocated;

  const status: BudgetStatus =
    utilizationPct >= 95
      ? 'critical'
      : utilizationPct >= 85
        ? 'warning'
        : utilizationPct >= 50
          ? 'healthy'
          : 'underutilized';

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border border-border bg-background',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        <span className={cn('text-xs font-mono font-bold', config.color)}>
          {utilizationPct.toFixed(0)}%
        </span>
      </div>
      <Progress value={utilizationPct} className="h-2" />
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{formatVND(allocated)} đã dùng</span>
        <span>{formatVND(remaining)} còn lại</span>
      </div>
    </div>
  );
}
