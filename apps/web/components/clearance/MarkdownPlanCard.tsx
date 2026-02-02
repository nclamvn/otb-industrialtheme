'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, TrendingDown, Zap, ArrowRight, Loader2 } from 'lucide-react';
import type { MarkdownPlan, MarkdownPlanStatus } from '@/types/clearance';
import { cn } from '@/lib/utils';

// Unified status colors with border colors (supports dark mode)
const STATUS_COLORS: Record<MarkdownPlanStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  PENDING_APPROVAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  APPROVED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  ACTIVE: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
  COMPLETED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
};

// Unified border-l colors
const STATUS_BORDER_COLORS: Record<MarkdownPlanStatus, string> = {
  DRAFT: 'border-l-slate-400',
  PENDING_APPROVAL: 'border-l-amber-500',
  APPROVED: 'border-l-blue-500',
  ACTIVE: 'border-l-green-500',
  COMPLETED: 'border-l-purple-500',
  CANCELLED: 'border-l-red-500',
};

const STATUS_KEYS: Record<MarkdownPlanStatus, string> = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pendingApproval',
  APPROVED: 'approved',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

interface Props {
  plan: MarkdownPlan;
  onOptimize: () => void;
  isOptimizing?: boolean;
}

export function MarkdownPlanCard({ plan, onOptimize, isOptimizing }: Props) {
  const t = useTranslations('clearance');
  const tCommon = useTranslations('common');
  const statusColor = STATUS_COLORS[plan.status];
  const borderColor = STATUS_BORDER_COLORS[plan.status];
  const statusKey = STATUS_KEYS[plan.status];

  return (
    <div
      className={cn(
        // Unified: rounded-xl, p-4, border border-border, hover:border-border/80, border-l-4
        'rounded-xl border border-border bg-card overflow-hidden',
        'hover:border-border/80 transition-all duration-200',
        'border-l-4',
        borderColor
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-foreground">{plan.planName}</h3>
          <Badge className={cn('border', statusColor)}>{t(`status.${statusKey}`)}</Badge>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(plan.planStartDate), 'MMM d')} - {format(new Date(plan.planEndDate), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <span>Target ST: <span className="font-medium tabular-nums">{plan.targetSellThroughPct}%</span></span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </div>
            <span>Max MD: <span className="font-medium tabular-nums">{plan.maxMarkdownPct}%</span></span>
          </div>
        </div>

        <div className="flex gap-1">
          {plan.phases.map((phase) => (
            <div key={phase.id} className="flex-1 bg-primary/10 rounded-lg px-2 py-1.5 text-xs text-center text-primary font-medium tabular-nums">
              {phase.markdownPct}%
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {plan.status === 'DRAFT' && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onOptimize} disabled={isOptimizing}>
              {isOptimizing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{t('optimizing')}</>
              ) : (
                <><Zap className="h-4 w-4 mr-1" />{t('optimize')}</>
              )}
            </Button>
          )}
          <Link href={`/clearance/${plan.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              {tCommon('view')}<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
