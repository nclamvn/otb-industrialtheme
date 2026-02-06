'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Info, Target, BarChart3 } from 'lucide-react';

interface KPIBenchmark {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

interface KPIBenchmarkCardProps {
  name: string;
  code: string;
  value: number;
  formattedValue: string;
  unit?: string;
  benchmark: KPIBenchmark;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  trend?: 'up' | 'down' | 'neutral';
  changePercent?: number;
  description?: string;
  isLowerBetter?: boolean;
}

export function KPIBenchmarkCard({
  name,
  code,
  value,
  formattedValue,
  unit,
  benchmark,
  status,
  trend,
  changePercent,
  description,
  isLowerBetter = false,
}: KPIBenchmarkCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'acceptable':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'excellent':
        return 'border-l-green-500';
      case 'good':
        return 'border-l-blue-500';
      case 'acceptable':
        return 'border-l-yellow-500';
      case 'poor':
        return 'border-l-orange-500';
      case 'critical':
        return 'border-l-red-500';
      default:
        return 'border-l-slate-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'acceptable':
        return 'Acceptable';
      case 'poor':
        return 'Poor';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'default';
      case 'acceptable':
        return 'secondary';
      case 'poor':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <TrendingUp className={cn('h-4 w-4', isLowerBetter ? 'text-red-500' : 'text-green-500')} />;
      case 'down':
        return <TrendingDown className={cn('h-4 w-4', isLowerBetter ? 'text-green-500' : 'text-red-500')} />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Calculate position on benchmark scale (0-100)
  const getBenchmarkPosition = () => {
    if (isLowerBetter) {
      // For metrics where lower is better (markdown, WoC high end)
      if (value <= benchmark.excellent) return 100;
      if (value <= benchmark.good) return 75 + (benchmark.excellent - value) / (benchmark.excellent - benchmark.good) * 25;
      if (value <= benchmark.acceptable) return 50 + (benchmark.good - value) / (benchmark.good - benchmark.acceptable) * 25;
      if (value <= benchmark.poor) return 25 + (benchmark.acceptable - value) / (benchmark.acceptable - benchmark.poor) * 25;
      return Math.max(0, 25 - (value - benchmark.poor) * 2);
    } else {
      // For metrics where higher is better
      if (value >= benchmark.excellent) return 100;
      if (value >= benchmark.good) return 75 + (value - benchmark.good) / (benchmark.excellent - benchmark.good) * 25;
      if (value >= benchmark.acceptable) return 50 + (value - benchmark.acceptable) / (benchmark.good - benchmark.acceptable) * 25;
      if (value >= benchmark.poor) return 25 + (value - benchmark.poor) / (benchmark.acceptable - benchmark.poor) * 25;
      return Math.max(0, value / benchmark.poor * 25);
    }
  };

  const benchmarkPosition = getBenchmarkPosition();

  return (
    <Card className={cn('relative overflow-hidden hover:border-border/80 transition-shadow border-l-4', getBorderColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {name}
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </p>
            <Badge variant={getStatusBadgeVariant()} className="mt-1">
              {getStatusLabel()}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground uppercase">{code}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Value and Trend */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{formattedValue}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {(trend || changePercent !== undefined) && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {changePercent !== undefined && (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      changePercent > 0
                        ? isLowerBetter
                          ? 'text-red-500'
                          : 'text-green-500'
                        : changePercent < 0
                        ? isLowerBetter
                          ? 'text-green-500'
                          : 'text-red-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {changePercent > 0 ? '+' : ''}
                    {changePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Benchmark Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>vs Industry Benchmark</span>
              <span>{benchmarkPosition.toFixed(0)}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              {/* Colored segments */}
              <div className="absolute inset-0 flex">
                <div className="w-1/4 bg-red-200" />
                <div className="w-1/4 bg-orange-200" />
                <div className="w-1/4 bg-yellow-200" />
                <div className="w-1/4 bg-green-200" />
              </div>
              {/* Position marker */}
              <div
                className={cn('absolute top-0 h-full w-1 rounded', getStatusColor())}
                style={{ left: `${Math.min(benchmarkPosition, 99)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Benchmark Values */}
          <div className="grid grid-cols-4 gap-1 text-xs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-center p-1 rounded bg-red-100 text-red-700">
                  {isLowerBetter ? `>${benchmark.poor}` : `<${benchmark.poor}`}
                </TooltipTrigger>
                <TooltipContent>Poor threshold</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-center p-1 rounded bg-yellow-100 text-yellow-700">
                  {isLowerBetter ? `<${benchmark.acceptable}` : `>${benchmark.acceptable}`}
                </TooltipTrigger>
                <TooltipContent>Acceptable threshold</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-center p-1 rounded bg-blue-100 text-blue-700">
                  {isLowerBetter ? `<${benchmark.good}` : `>${benchmark.good}`}
                </TooltipTrigger>
                <TooltipContent>Good threshold</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-center p-1 rounded bg-green-100 text-green-700">
                  {isLowerBetter ? `<${benchmark.excellent}` : `>${benchmark.excellent}`}
                </TooltipTrigger>
                <TooltipContent>Excellent threshold</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Watermark icon */}
        <BarChart3 className="absolute bottom-4 right-4 w-24 h-24 text-muted-foreground opacity-[0.08]" />
      </CardContent>
    </Card>
  );
}
