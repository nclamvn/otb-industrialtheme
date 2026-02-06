'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  label?: string;
}

interface HeatmapProps {
  data: HeatmapCell[];
  title?: string;
  description?: string;
  xLabels: string[];
  yLabels: string[];
  colorScale?: 'green' | 'blue' | 'red' | 'gradient';
  formatValue?: (value: number) => string;
  className?: string;
}

const colorScales = {
  green: [
    'bg-green-50 text-green-900',
    'bg-green-100 text-green-900',
    'bg-green-200 text-green-900',
    'bg-green-300 text-green-900',
    'bg-green-400 text-white',
    'bg-green-500 text-white',
    'bg-green-600 text-white',
    'bg-green-700 text-white',
  ],
  blue: [
    'bg-blue-50 text-blue-900',
    'bg-blue-100 text-blue-900',
    'bg-blue-200 text-blue-900',
    'bg-blue-300 text-blue-900',
    'bg-blue-400 text-white',
    'bg-blue-500 text-white',
    'bg-blue-600 text-white',
    'bg-blue-700 text-white',
  ],
  red: [
    'bg-red-50 text-red-900',
    'bg-red-100 text-red-900',
    'bg-red-200 text-red-900',
    'bg-red-300 text-red-900',
    'bg-red-400 text-white',
    'bg-red-500 text-white',
    'bg-red-600 text-white',
    'bg-red-700 text-white',
  ],
  gradient: [
    'bg-red-500 text-white',
    'bg-red-400 text-white',
    'bg-orange-400 text-white',
    'bg-yellow-400 text-yellow-900',
    'bg-lime-400 text-lime-900',
    'bg-green-400 text-white',
    'bg-green-500 text-white',
    'bg-green-600 text-white',
  ],
};

export function Heatmap({
  data,
  title,
  description,
  xLabels,
  yLabels,
  colorScale = 'gradient',
  formatValue = (v) => v.toFixed(1),
  className,
}: HeatmapProps) {
  const { min, max, cellMap } = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const cellMap = new Map<string, HeatmapCell>();
    data.forEach((cell) => {
      cellMap.set(`${cell.y}-${cell.x}`, cell);
    });

    return { min, max, cellMap };
  }, [data]);

  const getColorClass = (value: number) => {
    const scale = colorScales[colorScale];
    const normalized = max === min ? 0.5 : (value - min) / (max - min);
    const index = Math.min(Math.floor(normalized * scale.length), scale.length - 1);
    return scale[index];
  };

  const content = (
    <div className={cn('overflow-x-auto', className)}>
      <div className="inline-block min-w-full">
        {/* Header Row */}
        <div className="flex">
          <div className="w-24 flex-shrink-0" /> {/* Empty corner */}
          {xLabels.map((label) => (
            <div
              key={label}
              className="flex-1 min-w-[60px] px-2 py-1 text-center text-xs font-medium text-muted-foreground truncate"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        {yLabels.map((yLabel) => (
          <div key={yLabel} className="flex">
            <div className="w-24 flex-shrink-0 px-2 py-2 text-xs font-medium text-muted-foreground truncate">
              {yLabel}
            </div>
            {xLabels.map((xLabel) => {
              const cell = cellMap.get(`${yLabel}-${xLabel}`);
              const value = cell?.value ?? 0;
              const colorClass = getColorClass(value);

              return (
                <TooltipProvider key={`${yLabel}-${xLabel}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex-1 min-w-[60px] h-10 flex items-center justify-center text-xs font-medium border border-background/50 cursor-pointer transition-opacity hover:opacity-80',
                          colorClass
                        )}
                      >
                        {formatValue(value)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{cell?.label || `${yLabel} × ${xLabel}`}</p>
                        <p>Value: {formatValue(value)}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 px-2">
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="flex">
            {colorScales[colorScale].map((color, i) => (
              <div key={i} className={cn('w-6 h-4', color)} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );

  if (title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
}
