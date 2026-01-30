'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wallet,
  PieChart,
  Send,
  Calendar,
  Ruler,
  CheckCircle,
  Circle,
  Loader2,
  Lock,
} from 'lucide-react';
import { WorkflowStep, WorkflowState, WORKFLOW_STEPS, WORKFLOW_STEP_CONFIG } from './types';

interface WorkflowStatusProps {
  state: WorkflowState;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  className?: string;
}

const stepIcons: Record<WorkflowStep, typeof Wallet> = {
  budget: Wallet,
  otb: PieChart,
  submit: Send,
  wssi: Calendar,
  sizing: Ruler,
  approval: CheckCircle,
};

export function WorkflowStatus({
  state,
  variant = 'horizontal',
  showLabels = true,
  className,
}: WorkflowStatusProps) {
  const t = useTranslations('workflow');

  const getStepStatus = (step: WorkflowStep): 'completed' | 'current' | 'pending' | 'blocked' => {
    if (state.completedSteps.includes(step)) return 'completed';
    if (state.currentStep === step) {
      return state.isBlocked ? 'blocked' : 'current';
    }
    return 'pending';
  };

  const currentStepIndex = WORKFLOW_STEPS.indexOf(state.currentStep);
  const progressPercent = ((currentStepIndex) / (WORKFLOW_STEPS.length - 1)) * 100;

  // Compact variant - just a badge
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5',
                state.isBlocked
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-blue-500 text-blue-600 dark:text-blue-400',
                className
              )}
            >
              {state.isBlocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {t(`steps.${state.currentStep}`)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('currentStep')}: {t(`steps.${state.currentStep}`)}</p>
            {state.blockedReason && (
              <p className="text-amber-400 mt-1">{state.blockedReason}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Vertical variant
  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-1', className)}>
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(step);
          const Icon = stepIcons[step];
          const config = WORKFLOW_STEP_CONFIG[step];

          return (
            <div key={step} className="flex items-start gap-3">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    status === 'completed' && 'bg-emerald-500 border-emerald-500 text-white',
                    status === 'current' && 'bg-blue-500 border-blue-500 text-white animate-pulse',
                    status === 'blocked' && 'bg-amber-500 border-amber-500 text-white',
                    status === 'pending' && 'bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 text-slate-400'
                  )}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : status === 'blocked' ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {/* Connector line */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-8 my-1',
                      status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-neutral-700'
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1.5">
                <p
                  className={cn(
                    'font-medium',
                    status === 'completed' && 'text-emerald-600 dark:text-emerald-400',
                    status === 'current' && 'text-blue-600 dark:text-blue-400',
                    status === 'blocked' && 'text-amber-600 dark:text-amber-400',
                    status === 'pending' && 'text-slate-400 dark:text-neutral-500'
                  )}
                >
                  {t(`steps.${step}`)}
                </p>
                {showLabels && (
                  <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                    {config.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              state.isBlocked
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-blue-500 to-emerald-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-0">
          {WORKFLOW_STEPS.map((step) => {
            const status = getStepStatus(step);
            const Icon = stepIcons[step];

            return (
              <TooltipProvider key={step}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-neutral-900 transition-all',
                        status === 'completed' && 'border-emerald-500 text-emerald-500',
                        status === 'current' && 'border-blue-500 text-blue-500 ring-4 ring-blue-100 dark:ring-blue-900',
                        status === 'blocked' && 'border-amber-500 text-amber-500 ring-4 ring-amber-100 dark:ring-amber-900',
                        status === 'pending' && 'border-slate-300 dark:border-neutral-600 text-slate-400'
                      )}
                    >
                      {status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : status === 'blocked' ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{t(`steps.${step}`)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {WORKFLOW_STEP_CONFIG[step].description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs">
          {WORKFLOW_STEPS.map((step) => {
            const status = getStepStatus(step);
            return (
              <span
                key={step}
                className={cn(
                  'w-16 text-center truncate',
                  status === 'completed' && 'text-emerald-600 dark:text-emerald-400',
                  status === 'current' && 'text-blue-600 dark:text-blue-400 font-medium',
                  status === 'blocked' && 'text-amber-600 dark:text-amber-400 font-medium',
                  status === 'pending' && 'text-slate-400 dark:text-neutral-500'
                )}
              >
                {t(`steps.${step}`)}
              </span>
            );
          })}
        </div>
      )}

      {/* Blocked message */}
      {state.isBlocked && state.blockedReason && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
          <Lock className="h-4 w-4 flex-shrink-0" />
          <span>{state.blockedReason}</span>
        </div>
      )}
    </div>
  );
}

export default WorkflowStatus;
