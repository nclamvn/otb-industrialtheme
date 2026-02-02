'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils/budget-calculations';
import {
  BudgetVersion,
  VersionChange,
  VERSION_STATUS_COLORS,
  CHANGE_TYPE_LABELS,
} from './types';
import {
  GitCommit,
  GitBranch,
  User,
  Clock,
  Tag,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Eye,
  GitCompare,
  Check,
  X,
  FileEdit,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface VersionTimelineProps {
  versions: BudgetVersion[];
  selectedVersionId?: string;
  onSelectVersion?: (version: BudgetVersion) => void;
  onCompareVersions?: (leftId: string, rightId: string) => void;
  onRollback?: (version: BudgetVersion) => void;
  onViewDetails?: (version: BudgetVersion) => void;
  className?: string;
}

function ChangeIndicator({ change }: { change: VersionChange }) {
  const isIncrease = change.diff && change.diff > 0;
  const isDecrease = change.diff && change.diff < 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600 dark:text-neutral-400">{change.nodeName}</span>
      {change.diff !== undefined && (
        <span
          className={cn(
            'flex items-center gap-1 font-medium tabular-nums',
            isIncrease && 'text-green-600 dark:text-green-400',
            isDecrease && 'text-red-600 dark:text-red-400'
          )}
        >
          {isIncrease ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : isDecrease ? (
            <ArrowDownRight className="w-3.5 h-3.5" />
          ) : null}
          {isIncrease ? '+' : ''}
          {formatCurrency(change.diff)}
        </span>
      )}
    </div>
  );
}

function VersionCard({
  version,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onCompare,
  onRollback,
  onViewDetails,
}: {
  version: BudgetVersion;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect?: () => void;
  onCompare?: () => void;
  onRollback?: () => void;
  onViewDetails?: () => void;
}) {
  const statusColors = VERSION_STATUS_COLORS[version.status];
  const initials = version.createdBy.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        {/* Top line */}
        {!isFirst && <div className="w-0.5 h-4 bg-slate-200 dark:bg-neutral-700" />}

        {/* Commit dot */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2 z-10',
            isSelected
              ? 'bg-amber-500 border-amber-600'
              : version.isCurrent
              ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
              : 'bg-card dark:bg-neutral-900 border-slate-300 dark:border-neutral-700'
          )}
        >
          {version.createdBy.id === 'system' ? (
            <Sparkles
              className={cn(
                'w-4 h-4',
                isSelected ? 'text-white' : 'text-slate-500 dark:text-neutral-400'
              )}
            />
          ) : (
            <GitCommit
              className={cn(
                'w-4 h-4',
                isSelected ? 'text-white' : 'text-slate-500 dark:text-neutral-400'
              )}
            />
          )}
        </div>

        {/* Bottom line */}
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-neutral-700" />}
      </div>

      {/* Content */}
      <div
        onClick={onSelect}
        className={cn(
          'flex-1 p-4 rounded-xl border transition-all mb-4 cursor-pointer',
          isSelected
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 border-border/80'
            : 'bg-card border-border hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback
                className={cn(
                  'text-xs',
                  version.createdBy.id === 'system'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'bg-muted dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-neutral-100">
                  {version.name}
                </span>
                <Badge className={cn('text-xs', statusColors.bg, statusColors.text)}>
                  {version.status}
                </Badge>
                {version.isCurrent && (
                  <Badge className="text-xs bg-amber-500 text-white">
                    Current
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                <span>{version.createdBy.name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(version.createdAt, { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.();
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {!version.isCurrent && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompare?.();
                        }}
                      >
                        <GitCompare className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Compare with Current</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRollback?.();
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rollback to this version</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {version.description && (
          <p className="text-sm text-slate-600 dark:text-neutral-400 mb-3">{version.description}</p>
        )}

        {/* Changes */}
        {version.changes.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {version.changes.slice(0, 3).map((change) => (
              <ChangeIndicator key={change.id} change={change} />
            ))}
            {version.changes.length > 3 && (
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                +{version.changes.length - 3} more changes
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {version.tags && version.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
            {version.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs px-1.5 py-0 h-5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Version number */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono">
            v{version.versionNumber}.0
          </span>
          <span className="text-xs text-slate-400 dark:text-neutral-500">
            {formatCurrency(version.snapshot.budget)} total budget
          </span>
        </div>
      </div>
    </div>
  );
}

export function VersionTimeline({
  versions,
  selectedVersionId,
  onSelectVersion,
  onCompareVersions,
  onRollback,
  onViewDetails,
  className,
}: VersionTimelineProps) {
  // Sort versions by version number descending
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.versionNumber - a.versionNumber),
    [versions]
  );

  const currentVersion = useMemo(
    () => versions.find((v) => v.isCurrent),
    [versions]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-slate-500 dark:text-neutral-400" />
          <h3 className="font-semibold text-slate-800 dark:text-neutral-100">Version History</h3>
          <Badge variant="secondary" className="text-xs">
            {versions.length} versions
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sortedVersions.map((version, index) => (
          <VersionCard
            key={version.id}
            version={version}
            isSelected={selectedVersionId === version.id}
            isFirst={index === 0}
            isLast={index === sortedVersions.length - 1}
            onSelect={() => onSelectVersion?.(version)}
            onCompare={() =>
              currentVersion &&
              onCompareVersions?.(version.id, currentVersion.id)
            }
            onRollback={() => onRollback?.(version)}
            onViewDetails={() => onViewDetails?.(version)}
          />
        ))}
      </div>
    </div>
  );
}

export default VersionTimeline;
