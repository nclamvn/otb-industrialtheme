'use client';

import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  trend?: 'up' | 'down' | 'neutral';
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  trend = 'neutral',
  width = 96,
  height = 32,
  strokeWidth = 2,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    trend === 'up' ? '#10B981' :
    trend === 'down' ? '#EF4444' :
    '#6B7280';

  // Create gradient fill
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const fillColor =
    trend === 'up' ? '#10B981' :
    trend === 'down' ? '#EF4444' :
    '#6B7280';

  // Create area path
  const firstPoint = `${padding},${height - padding}`;
  const lastPoint = `${width - padding},${height - padding}`;
  const areaPath = `M ${firstPoint} L ${points} L ${lastPoint} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />

      {/* Line */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />

      {/* End dot */}
      <circle
        cx={width - padding}
        cy={padding + (1 - (data[data.length - 1] - min) / range) * (height - padding * 2)}
        r={3}
        fill={strokeColor}
      />
    </svg>
  );
}
