'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  UserCheck,
  Calculator,
  Shield,
  Lock,
  Check,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type WorkflowStatus =
  | 'draft'
  | 'pending_md_review'
  | 'pending_finance_review'
  | 'pending_final_approval'
  | 'approved'
  | 'locked'
  | 'rejected';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  completedAt?: string;
  completedBy?: string;
  comments?: string;
}

export interface WorkflowTrackerProps {
  currentStatus: WorkflowStatus;
  steps?: WorkflowStep[];
  onStepClick?: (stepId: string) => void;
  compact?: boolean;
  showTimeline?: boolean;
  className?: string;
}

const DEFAULT_WORKFLOW_STEPS: {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  statusKey: WorkflowStatus[];
}[] = [
  {
    id: 'draft',
    name: 'Draft',
    icon: FileEdit,
    statusKey: ['draft'],
  },
  {
    id: 'md_review',
    name: 'MD Review',
    icon: UserCheck,
    statusKey: ['pending_md_review'],
  },
  {
    id: 'finance_review',
    name: 'Finance Review',
    icon: Calculator,
    statusKey: ['pending_finance_review'],
  },
  {
    id: 'final_approval',
    name: 'Final Approval',
    icon: Shield,
    statusKey: ['pending_final_approval'],
  },
  {
    id: 'locked',
    name: 'Locked',
    icon: Lock,
    statusKey: ['approved', 'locked'],
  },
];

function getStepStatus(
  step: (typeof DEFAULT_WORKFLOW_STEPS)[0],
  currentStatus: WorkflowStatus,
  stepIndex: number,
  currentStepIndex: number
): 'completed' | 'current' | 'pending' | 'rejected' {
  if (currentStatus === 'rejected') {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'rejected';
    return 'pending';
  }

  if (step.statusKey.includes(currentStatus)) return 'current';
  if (stepIndex < currentStepIndex) return 'completed';
  return 'pending';
}

function getCurrentStepIndex(currentStatus: WorkflowStatus): number {
  const index = DEFAULT_WORKFLOW_STEPS.findIndex((step) =>
    step.statusKey.includes(currentStatus)
  );
  return index >= 0 ? index : 0;
}

export function WorkflowTracker({
  currentStatus,
  steps,
  onStepClick,
  compact = false,
  showTimeline = true,
  className,
}: WorkflowTrackerProps) {
  const currentStepIndex = useMemo(
    () => getCurrentStepIndex(currentStatus),
    [currentStatus]
  );

  const workflowSteps = useMemo(() => {
    return DEFAULT_WORKFLOW_STEPS.map((step, index) => {
      const customStep = steps?.find((s) => s.id === step.id);
      const status = customStep?.status || getStepStatus(step, currentStatus, index, currentStepIndex);

      return {
        ...step,
        status,
        completedAt: customStep?.completedAt,
        completedBy: customStep?.completedBy,
        comments: customStep?.comments,
      };
    });
  }, [currentStatus, currentStepIndex, steps]);

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-1', className)}>
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === workflowSteps.length - 1;

            return (
              <div key={step.id} className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onStepClick?.(step.id)}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full transition-all',
                        step.status === 'completed' &&
                          'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                        step.status === 'current' &&
                          'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-1 dark:bg-blue-900/30 dark:text-blue-400',
                        step.status === 'pending' &&
                          'bg-muted text-muted-foreground',
                        step.status === 'rejected' &&
                          'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                        onStepClick && 'cursor-pointer hover:ring-2 hover:ring-offset-1'
                      )}
                    >
                      {step.status === 'completed' ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : step.status === 'rejected' ? (
                        <AlertCircle className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="font-medium">{step.name}</p>
                    {step.completedBy && (
                      <p className="text-xs text-muted-foreground">
                        By: {step.completedBy}
                      </p>
                    )}
                    {step.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(step.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>

                {!isLast && (
                  <div
                    className={cn(
                      'mx-0.5 h-0.5 w-3',
                      index < currentStepIndex
                        ? 'bg-emerald-500'
                        : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === workflowSteps.length - 1;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex flex-1 items-center',
                  !isLast && 'relative'
                )}
              >
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onStepClick?.(step.id)}
                        className={cn(
                          'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                          step.status === 'completed' &&
                            'border-emerald-500 bg-emerald-500 text-white',
                          step.status === 'current' &&
                            'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                          step.status === 'pending' &&
                            'border-muted bg-background text-muted-foreground',
                          step.status === 'rejected' &&
                            'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                          onStepClick && 'cursor-pointer hover:scale-105'
                        )}
                      >
                        {step.status === 'completed' ? (
                          <Check className="h-5 w-5" />
                        ) : step.status === 'rejected' ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : step.status === 'current' ? (
                          <Clock className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}

                        {/* Pulse animation for current step */}
                        {step.status === 'current' && (
                          <span className="absolute -inset-1 animate-ping rounded-full bg-blue-400 opacity-25" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <div className="space-y-1">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          Status: {step.status}
                        </p>
                        {step.completedBy && (
                          <p className="text-xs text-muted-foreground">
                            Completed by: {step.completedBy}
                          </p>
                        )}
                        {step.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(step.completedAt).toLocaleString()}
                          </p>
                        )}
                        {step.comments && (
                          <p className="text-xs italic text-muted-foreground">
                            "{step.comments}"
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Step Label */}
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      step.status === 'completed' && 'text-emerald-600 dark:text-emerald-400',
                      step.status === 'current' && 'text-blue-600 dark:text-blue-400',
                      step.status === 'pending' && 'text-muted-foreground',
                      step.status === 'rejected' && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {step.name}
                  </span>

                  {/* Timeline info */}
                  {showTimeline && step.completedAt && (
                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(step.completedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="relative mx-2 flex-1">
                    <div
                      className={cn(
                        'h-0.5 w-full transition-colors',
                        index < currentStepIndex
                          ? 'bg-emerald-500'
                          : 'bg-muted'
                      )}
                    />
                    {/* Animated progress for current step */}
                    {index === currentStepIndex - 1 && (
                      <div className="absolute inset-y-0 left-0 h-0.5 w-1/2 animate-pulse bg-gradient-to-r from-emerald-500 to-blue-500" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Mini version for table rows or compact displays
export function WorkflowStatusBadge({
  status,
  className,
}: {
  status: WorkflowStatus;
  className?: string;
}) {
  const config = useMemo(() => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        };
      case 'pending_md_review':
        return {
          label: 'MD Review',
          icon: UserCheck,
          className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        };
      case 'pending_finance_review':
        return {
          label: 'Finance',
          icon: Calculator,
          className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
      case 'pending_final_approval':
        return {
          label: 'Final',
          icon: Shield,
          className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        };
      case 'approved':
        return {
          label: 'Approved',
          icon: Check,
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        };
      case 'locked':
        return {
          label: 'Locked',
          icon: Lock,
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: AlertCircle,
          className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          className: 'bg-muted text-muted-foreground',
        };
    }
  }, [status]);

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export default WorkflowTracker;
