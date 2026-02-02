'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  BarChart3,
  Package,
  Ruler,
  Ticket,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  FileCheck,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflowProgress } from './hooks/useWorkflowProgress';

interface StepConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  pathMatch: string[];
  description: string;
}

const WORKFLOW_STEPS: StepConfig[] = [
  {
    id: 'budget',
    label: 'Budget Allocation',
    shortLabel: 'Budget',
    icon: DollarSign,
    path: '/budget-flow',
    pathMatch: ['/budget', '/budget-flow', '/budget-alloc'],
    description: 'Allocate budget by Brand, Season, Store',
  },
  {
    id: 'otb',
    label: 'OTB Planning',
    shortLabel: 'OTB',
    icon: BarChart3,
    path: '/otb-analysis',
    pathMatch: ['/otb-plans', '/otb-analysis'],
    description: 'Enter OTB allocation by Collection, Gender, Category',
  },
  {
    id: 'sku',
    label: 'SKU Proposal',
    shortLabel: 'SKU',
    icon: Package,
    path: '/sku-proposal',
    pathMatch: ['/sku-proposal', '/sku-import'],
    description: 'Select SKUs based on Final OTB Plan',
  },
  {
    id: 'sizing',
    label: 'Sizing Plan',
    shortLabel: 'Sizing',
    icon: Ruler,
    path: '/size-profiles',
    pathMatch: ['/size-profiles', '/sizing', '/size-allocation'],
    description: 'Enter size distribution for selected SKUs',
  },
  {
    id: 'ticket',
    label: 'Create Ticket',
    shortLabel: 'Ticket',
    icon: Ticket,
    path: '/tickets',
    pathMatch: ['/tickets'],
    description: 'Bundle plans and submit for approval',
  },
  {
    id: 'approval',
    label: 'Approval',
    shortLabel: 'Approval',
    icon: CheckCircle2,
    path: '/approvals',
    pathMatch: ['/approvals'],
    description: 'GSM → Finance → CEO review chain',
  },
];

export function GlobalWorkflowStepper() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const { progress, activeSeasons } = useWorkflowProgress();

  // Determine current step based on pathname
  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) =>
    step.pathMatch.some((p) => pathname.startsWith(p))
  );

  // Also show on dashboard
  const isWorkflowPage = currentStepIndex >= 0 || pathname === '/';
  if (!isWorkflowPage) return null;

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' | 'warning' => {
    const stepProgress = progress[WORKFLOW_STEPS[index].id];
    if (stepProgress?.hasWarning) return 'warning';
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    // Check if step has data even if not current
    if (stepProgress?.itemCount && stepProgress.itemCount > 0) return 'completed';
    return 'upcoming';
  };

  const statusStyles = {
    completed: {
      circle: 'bg-[#127749] border-[#127749] text-white',
      line: 'bg-[#127749]',
      label: 'text-[#127749] font-medium',
    },
    current: {
      circle: 'bg-[#D7B797] border-[#D7B797] text-[#127749] ring-4 ring-[#D7B797]/20',
      line: 'bg-gradient-to-r from-[#127749] to-border',
      label: 'text-foreground font-semibold',
    },
    upcoming: {
      circle: 'bg-muted border-border text-muted-foreground',
      line: 'bg-border',
      label: 'text-muted-foreground',
    },
    warning: {
      circle: 'bg-amber-500 border-amber-500 text-white',
      line: 'bg-amber-300',
      label: 'text-amber-600 font-medium',
    },
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        {/* Compact Stepper Bar */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-1">
            {WORKFLOW_STEPS.map((step, index) => {
              const status = getStepStatus(index);
              const styles = statusStyles[status];
              const Icon = step.icon;
              const stepData = progress[step.id];

              return (
                <React.Fragment key={step.id}>
                  {/* Step */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => router.push(step.path)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
                          status === 'current' && 'bg-[#D7B797]/10',
                          status !== 'upcoming' && 'cursor-pointer hover:bg-muted',
                          status === 'upcoming' && 'opacity-50 cursor-pointer hover:opacity-70'
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
                            styles.circle
                          )}
                        >
                          {status === 'completed' ? (
                            <FileCheck className="w-3.5 h-3.5" />
                          ) : status === 'warning' ? (
                            <AlertCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className={cn('text-xs hidden lg:inline', styles.label)}>
                          {step.shortLabel}
                        </span>
                        {stepData?.versionStatus && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] h-4 hidden xl:inline-flex',
                              stepData.versionStatus === 'final'
                                ? 'border-green-300 text-green-700 bg-green-50'
                                : 'border-yellow-300 text-yellow-700 bg-yellow-50'
                            )}
                          >
                            {stepData.versionStatus === 'final' ? 'Final' : `v${stepData.version}`}
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                        {stepData && (
                          <div className="text-xs pt-1 border-t border-border">
                            {stepData.itemCount !== undefined && stepData.itemCount > 0 && (
                              <p>{stepData.itemCount} items</p>
                            )}
                            {stepData.totalValue !== undefined && stepData.totalValue > 0 && (
                              <p className="font-mono">${stepData.totalValue.toLocaleString()}</p>
                            )}
                            {stepData.lastModified && (
                              <p className="text-muted-foreground">
                                Updated {new Date(stepData.lastModified).toLocaleDateString()}
                              </p>
                            )}
                            {stepData.hasWarning && stepData.warningMessage && (
                              <p className="text-amber-600 dark:text-amber-400 mt-1">{stepData.warningMessage}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Connector */}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 min-w-[8px] max-w-[40px]">
                      <div className={cn('h-full rounded-full', styles.line)} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Detail Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {WORKFLOW_STEPS.map((step, index) => {
                    const status = getStepStatus(index);
                    const stepData = progress[step.id];
                    const Icon = step.icon;

                    return (
                      <button
                        key={step.id}
                        onClick={() => router.push(step.path)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all hover:shadow-sm',
                          status === 'current' && 'border-[#D7B797] bg-[#D7B797]/5',
                          status === 'completed' && 'border-[#127749]/30 bg-[#127749]/5',
                          status === 'warning' && 'border-amber-300 bg-amber-50 dark:bg-amber-950/20',
                          status === 'upcoming' && 'border-border opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{step.shortLabel}</span>
                        </div>
                        {stepData && (stepData.version || stepData.itemCount) ? (
                          <div className="space-y-1 text-[11px] text-muted-foreground">
                            {stepData.version && (
                              <p>Version: v{stepData.version} ({stepData.versionStatus})</p>
                            )}
                            {stepData.itemCount !== undefined && stepData.itemCount > 0 && (
                              <p>{stepData.itemCount} items</p>
                            )}
                            {stepData.totalValue !== undefined && stepData.totalValue > 0 && (
                              <p className="font-mono">${(stepData.totalValue / 1000).toFixed(0)}K</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">Not started</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Season Selector */}
                {activeSeasons.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Active:</span>
                    {activeSeasons.map((season) => (
                      <Badge key={season.id} variant="secondary" className="text-[10px]">
                        {season.code} - {season.brand}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
