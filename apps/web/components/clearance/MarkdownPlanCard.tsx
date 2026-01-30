'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, TrendingDown, Zap, ArrowRight, Loader2 } from 'lucide-react';
import type { MarkdownPlan, MarkdownPlanStatus } from '@/types/clearance';
import { cn } from '@/lib/utils';

// Unified status colors with border colors
const STATUS_COLORS: Record<MarkdownPlanStatus, string> = {
  DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  COMPLETED: 'bg-purple-50 text-purple-700 border-purple-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
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
        // Unified: rounded-xl, p-4, shadow-sm, hover:shadow-md, border-l-4
        'rounded-xl border border-slate-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'border-l-4',
        borderColor
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{plan.planName}</h3>
          <Badge className={cn('border', statusColor)}>{t(`status.${statusKey}`)}</Badge>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(plan.planStartDate), 'MMM d')} - {format(new Date(plan.planEndDate), 'MMM d, yyyy')}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <span>Target ST: <span className="font-medium tabular-nums">{plan.targetSellThroughPct}%</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-amber-600" />
            </div>
            <span>Max MD: <span className="font-medium tabular-nums">{plan.maxMarkdownPct}%</span></span>
          </div>
        </div>

        <div className="flex gap-1">
          {plan.phases.map((phase) => (
            <div key={phase.id} className="flex-1 bg-blue-50 rounded-lg px-2 py-1 text-xs text-center text-blue-700 font-medium tabular-nums">
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
