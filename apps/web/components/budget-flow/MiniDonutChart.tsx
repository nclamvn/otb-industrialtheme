'use client';

import { cn } from '@/lib/utils';

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface MiniDonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export function MiniDonutChart({
  segments,
  size = 120,
  strokeWidth = 12,
  centerLabel,
  centerValue,
  className,
}: MiniDonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke dash offsets for each segment
  let cumulativePercentage = 0;
  const segmentsWithOffsets = segments.map((segment) => {
    const percentage = total > 0 ? segment.value / total : 0;
    const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
    const strokeDashoffset = -circumference * cumulativePercentage;
    cumulativePercentage += percentage;
    return {
      ...segment,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100"
        />

        {/* Segments */}
        {segmentsWithOffsets.map((segment, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              transformOrigin: 'center',
            }}
          />
        ))}
      </svg>

      {/* Center content */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-xs text-slate-500">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Horizontal Bar Chart for allocation breakdown
interface BarSegment {
  value: number;
  color: string;
  label: string;
}

interface HorizontalBarChartProps {
  segments: BarSegment[];
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function HorizontalBarChart({
  segments,
  height = 8,
  showLabels = false,
  className,
}: HorizontalBarChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className={cn('w-full', className)}>
      <div
        className="w-full rounded-full overflow-hidden flex"
        style={{ height }}
      >
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={index}
              className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
                minWidth: percentage > 0 ? '2px' : '0',
              }}
              title={`${segment.label}: ${percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {showLabels && (
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((segment, index) => {
            const percentage = total > 0 ? (segment.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs text-slate-600">
                  {segment.label}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Budget Allocation Visual - combines donut with legend
interface AllocationItem {
  id: string;
  name: string;
  budget: number;
  color: string;
}

interface BudgetAllocationVisualProps {
  items: AllocationItem[];
  totalBudget: number;
  allocatedBudget: number;
  className?: string;
}

export function BudgetAllocationVisual({
  items,
  totalBudget,
  allocatedBudget,
  className,
}: BudgetAllocationVisualProps) {
  const remaining = totalBudget - allocatedBudget;
  const allocationPercentage = totalBudget > 0 ? (allocatedBudget / totalBudget) * 100 : 0;

  const segments = items.map((item) => ({
    value: item.budget,
    color: item.color,
    label: item.name,
  }));

  // Add remaining as gray segment if there's unallocated budget
  if (remaining > 0) {
    segments.push({
      value: remaining,
      color: '#e2e8f0', // slate-200
      label: 'Unallocated',
    });
  }

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <MiniDonutChart
        segments={segments}
        size={100}
        strokeWidth={14}
        centerValue={`${allocationPercentage.toFixed(0)}%`}
        centerLabel="allocated"
      />

      <div className="flex-1 space-y-2">
        {items.map((item) => {
          const percentage = totalBudget > 0 ? (item.budget / totalBudget) * 100 : 0;
          return (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 text-sm text-slate-700 truncate">
                {item.name}
              </span>
              <span className="text-sm font-medium text-slate-900 tabular-nums">
                {percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-slate-200" />
            <span className="flex-1 text-sm text-slate-500 truncate">
              Unallocated
            </span>
            <span className="text-sm font-medium text-slate-500 tabular-nums">
              {((remaining / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiniDonutChart;
