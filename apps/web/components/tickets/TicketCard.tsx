'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Ticket as TicketIcon,
  Eye,
  Edit,
  XCircle,
  Calendar,
  DollarSign,
  Paperclip,
  Clock,
  CheckCircle,
  Send,
  FileEdit,
  RefreshCw,
  Ban,
  PieChart,
  Package,
  Ruler,
} from 'lucide-react';
import {
  Ticket,
  TicketStatus,
  TicketType,
  TicketPriority,
  TICKET_STATUS_CONFIG,
  TICKET_TYPE_CONFIG,
  TICKET_PRIORITY_CONFIG,
} from './types';

interface TicketCardProps {
  ticket: Ticket;
  onView?: () => void;
  onUpdate?: () => void;
  onCancel?: () => void;
  compact?: boolean;
  className?: string;
}

const statusIcons: Record<TicketStatus, typeof Clock> = {
  draft: FileEdit,
  submitted: Send,
  in_review: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  updated: RefreshCw,
  cancelled: Ban,
};

const typeIcons: Record<TicketType, typeof PieChart> = {
  otb_plan: PieChart,
  sku_proposal: Package,
  sizing_change: Ruler,
};

export function TicketCard({
  ticket,
  onView,
  onUpdate,
  onCancel,
  compact = false,
  className,
}: TicketCardProps) {
  const t = useTranslations('ticket');
  const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
  const typeConfig = TICKET_TYPE_CONFIG[ticket.type];
  const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority];
  const StatusIcon = statusIcons[ticket.status];
  const TypeIcon = typeIcons[ticket.type];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const canUpdate = ['draft', 'rejected'].includes(ticket.status);
  const canCancel = ['draft', 'submitted'].includes(ticket.status);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-lg border',
          'bg-white dark:bg-neutral-900',
          'border-slate-200 dark:border-neutral-700',
          'hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer',
          className
        )}
        onClick={onView}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge
            variant="outline"
            className={cn('text-xs', priorityConfig.color, priorityConfig.bgColor)}
          >
            {priorityConfig.dot}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                {ticket.number}
              </span>
              <span className="text-slate-300 dark:text-neutral-600">|</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {ticket.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-neutral-400">
              <span>{formatCurrency(ticket.totalBudget)}</span>
              <span>|</span>
              <span>{ticket.createdBy.name}</span>
              <span>|</span>
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(statusConfig.color, statusConfig.bgColor)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`status.${ticket.status}`)}
          </Badge>
          <Eye className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800">
              <TicketIcon className="h-5 w-5 text-slate-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-500 dark:text-neutral-400">
                  {ticket.number}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    priorityConfig.color,
                    priorityConfig.bgColor,
                    priorityConfig.borderColor
                  )}
                >
                  {priorityConfig.dot} {t(`priority.${ticket.priority}`)}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mt-1">
                {ticket.title}
              </h3>
            </div>
          </div>
          <Badge className={cn(statusConfig.color, statusConfig.bgColor)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`status.${ticket.status}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Type & Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-neutral-400">
              {t(`type.${ticket.type}`)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {formatCurrency(ticket.totalBudget)}
            </span>
          </div>
        </div>

        {/* Items */}
        {ticket.items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
              <Paperclip className="h-4 w-4" />
              <span>{t('fields.items')} ({ticket.items.length}):</span>
            </div>
            <div className="space-y-1 pl-6">
              {ticket.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600 dark:text-neutral-300">
                    {item.name} {item.version}
                  </span>
                  <span className="text-slate-500 dark:text-neutral-400">
                    {formatCurrency(item.budget)}
                  </span>
                </div>
              ))}
              {ticket.items.length > 3 && (
                <span className="text-xs text-slate-400">
                  +{ticket.items.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400">
            <Avatar className="h-5 w-5">
              <AvatarImage src={ticket.createdBy.avatar} />
              <AvatarFallback className="text-[8px]">
                {ticket.createdBy.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span>{ticket.createdBy.name}</span>
            <span>|</span>
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
          {ticket.deadline && (
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(ticket.deadline)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            {t('view')}
          </Button>
          {canUpdate && (
            <Button variant="outline" size="sm" onClick={onUpdate} className="flex-1">
              <Edit className="h-4 w-4 mr-1" />
              {t('update')}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <XCircle className="h-4 w-4 mr-1" />
              {t('cancel')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketCard;
