'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  MoreVertical,
  Target,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { KPIDisplay } from '@/types/kpi';
import { Sparklines, SparklinesLine } from 'react-sparklines';

interface KPICardProps {
  kpi: KPIDisplay;
  onViewDetails?: (kpi: KPIDisplay) => void;
  onSetTarget?: (kpi: KPIDisplay) => void;
  onConfigureAlert?: (kpi: KPIDisplay) => void;
  compact?: boolean;
}

export function KPICard({
  kpi,
  onViewDetails,
  onSetTarget,
  onConfigureAlert,
  compact = false,
}: KPICardProps) {
  const getTrendIcon = () => {
    switch (kpi.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = () => {
    switch (kpi.status) {
      case 'on_track':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'off_track':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (kpi.status) {
      case 'on_track':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'at_risk':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'off_track':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (kpi.status) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'off_track':
        return 'Off Track';
      default:
        return 'No Target';
    }
  };

  const progressPercent = kpi.target
    ? Math.min((kpi.value / kpi.target.value) * 100, 100)
    : 0;

  // Get border color based on status
  const getBorderColor = () => {
    switch (kpi.status) {
      case 'on_track':
        return 'border-l-green-500';
      case 'at_risk':
        return 'border-l-amber-500';
      case 'off_track':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  if (compact) {
    return (
      <Card className={cn('border-l-4 transition-colors hover:border-border/80', getBorderColor())}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {kpi.name}
            </span>
            {getStatusIcon()}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{kpi.formattedValue}</span>
            {kpi.changePercent !== undefined && (
              <span
                className={cn(
                  'text-sm font-medium',
                  kpi.changePercent > 0 ? 'text-green-500' : kpi.changePercent < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                {kpi.changePercent > 0 ? '+' : ''}
                {kpi.changePercent.toFixed(1)}%
              </span>
            )}
          </div>
          {kpi.target && (
            <div className="mt-2">
              <Progress value={progressPercent} className="h-1.5" />
              <span className="text-xs text-muted-foreground mt-1 block">
                Target: {kpi.target.formattedValue}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-l-4 transition-colors hover:border-border/80', getBorderColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              {kpi.name}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{kpi.description}</p>
                    {kpi.formula && (
                      <p className="text-xs mt-1 font-mono">{kpi.formula}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <Badge variant="outline" className={cn('mt-1', getStatusColor())}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusLabel()}</span>
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(kpi)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetTarget?.(kpi)}>
                <Target className="h-4 w-4 mr-2" />
                Set Target
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConfigureAlert?.(kpi)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Configure Alert
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Value and trend */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{kpi.formattedValue}</span>
              {kpi.unit && (
                <span className="text-sm text-muted-foreground">{kpi.unit}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              {kpi.changePercent !== undefined && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    kpi.trend === 'up'
                      ? 'text-green-500'
                      : kpi.trend === 'down'
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  )}
                >
                  {kpi.changePercent > 0 ? '+' : ''}
                  {kpi.changePercent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Progress to target */}
          {kpi.target && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to Target</span>
                <span className="font-medium">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {kpi.formattedValue}</span>
                <span>Target: {kpi.target.formattedValue}</span>
              </div>
            </div>
          )}

          {/* Sparkline */}
          {kpi.sparklineData && kpi.sparklineData.length > 0 && (
            <div className="h-12">
              <Sparklines data={kpi.sparklineData} height={48} margin={2}>
                <SparklinesLine
                  color={
                    kpi.trend === 'up'
                      ? '#22c55e'
                      : kpi.trend === 'down'
                      ? '#ef4444'
                      : '#6b7280'
                  }
                  style={{ strokeWidth: 2, fill: 'none' }}
                />
              </Sparklines>
            </div>
          )}

          {/* Period info */}
          {kpi.periodLabel && (
            <div className="text-xs text-muted-foreground text-right">
              {kpi.periodLabel}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
