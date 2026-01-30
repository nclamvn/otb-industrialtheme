'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Clock, FileText, DollarSign, Package, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BudgetStatusBadge,
  formatBudgetCurrency,
  BudgetCardStatus,
} from '@/components/ui/budget';

export interface PendingApproval {
  id: string;
  type: 'budget' | 'otb' | 'sku';
  title: string;
  description: string;
  submittedBy: {
    name: string;
    avatar?: string;
  };
  submittedAt: Date;
  priority?: 'high' | 'medium' | 'low';
  amount?: number;
  href: string;
}

interface PendingApprovalsProps {
  approvals: PendingApproval[];
  viewAllHref?: string;
}

const typeIcons = {
  budget: DollarSign,
  otb: FileText,
  sku: Package,
};

// Map type to unified border colors
const typeBorderColors = {
  budget: 'border-l-slate-800',
  otb: 'border-l-slate-600',
  sku: 'border-l-slate-400',
};

// Map priority to unified status
const priorityToStatus: Record<string, BudgetCardStatus> = {
  high: 'error',
  medium: 'warning',
  low: 'verified',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function PendingApprovals({ approvals, viewAllHref }: PendingApprovalsProps) {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('navigation');

  const typeLabels: Record<string, string> = {
    budget: tNav('budget'),
    otb: tNav('otb'),
    sku: tNav('sku'),
  };

  return (
    <div
      className={cn(
        // Unified: rounded-xl, shadow-sm, hover:shadow-md, border
        'rounded-xl border border-slate-200 bg-white overflow-hidden',
        'shadow-sm'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              {t('pendingApprovals')}
              {approvals.length > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  {approvals.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('itemsWaitingReview')}</p>
          </div>
          {viewAllHref && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={viewAllHref} className="text-xs">
                {t('viewAll')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-2">
          {approvals.map((approval) => {
            const Icon = typeIcons[approval.type];

            return (
              <Link
                key={approval.id}
                href={approval.href}
                className={cn(
                  // Unified: rounded-xl, p-4, border-l-4, shadow-sm, hover:shadow-md
                  'block p-3 rounded-xl border border-slate-200',
                  'border-l-4 shadow-sm hover:shadow-md transition-all duration-200',
                  'hover:bg-slate-50',
                  typeBorderColors[approval.type]
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Unified: w-10 h-10 rounded-xl icon container */}
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{approval.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {approval.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {typeLabels[approval.type]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600">
                            {getInitials(approval.submittedBy.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-500">
                          {approval.submittedBy.name}
                        </span>
                      </div>
                      {approval.amount !== undefined && (
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatBudgetCurrency(approval.amount)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(approval.submittedAt, { addSuffix: true })}
                      </span>
                      {approval.priority && (
                        <BudgetStatusBadge status={priorityToStatus[approval.priority]} />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {approvals.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('noPendingApprovals')}</p>
              <p className="text-xs">{t('allCaughtUp')}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
