'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface GaugeZone {
  from: number;
  to: number;
  color: string;
}

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  target?: number;
  label?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  zones?: GaugeZone[];
  showValue?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 140, height: 85, strokeWidth: 12, radius: 50, fontSize: 'text-lg', valueSize: 'text-xl' },
  md: { width: 160, height: 100, strokeWidth: 14, radius: 58, fontSize: 'text-sm', valueSize: 'text-2xl' },
  lg: { width: 200, height: 120, strokeWidth: 16, radius: 72, fontSize: 'text-base', valueSize: 'text-3xl' },
};

const defaultZones: GaugeZone[] = [
  { from: 0, to: 40, color: '#ef4444' },
  { from: 40, to: 70, color: '#f59e0b' },
  { from: 70, to: 100, color: '#22c55e' },
];

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  target,
  label,
  unit = '%',
  size = 'md',
  zones = defaultZones,
  showValue = true,
  className,
}: GaugeChartProps) {
  const config = sizeConfig[size];
  const { width, height, strokeWidth, radius } = config;
  const centerX = width / 2;
  const centerY = height - 5;

  // Calculate the arc length for a semi-circle (180 degrees)
  const circumference = Math.PI * radius;

  const { normalizedValue, valueColor, targetAngle } = useMemo(() => {
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));

    // Find the color for current value based on zones
    let valueColor = '#22c55e';
    for (const zone of zones) {
      if (value >= zone.from && value < zone.to) {
        valueColor = zone.color;
        break;
      }
      if (value >= zone.to) {
        valueColor = zone.color;
      }
    }

    // Target angle calculation (0 to 180 degrees, where 0 is left, 180 is right)
    const targetAngle = target !== undefined
      ? ((target - min) / (max - min)) * 180
      : undefined;

    return { normalizedValue, valueColor, targetAngle };
  }, [value, min, max, zones, target]);

  // Arc path for semi-circle (from left to right, 180 degrees)
  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  // Progress arc length
  const progressLength = normalizedValue * circumference;
  const remainingLength = circumference - progressLength;

  // Needle calculations
  const needleAngle = (normalizedValue * 180 - 180) * (Math.PI / 180); // Convert to radians, starting from left
  const needleLength = radius - strokeWidth / 2 - 8;
  const needleX = centerX + needleLength * Math.cos(needleAngle);
  const needleY = centerY + needleLength * Math.sin(needleAngle);

  // Target marker calculations
  const targetMarkerAngle = targetAngle !== undefined
    ? (targetAngle - 180) * (Math.PI / 180)
    : undefined;

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="drop-border border-border"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`gauge-gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {zones.map((zone, i) => {
                const startPct = ((zone.from - min) / (max - min)) * 100;
                const endPct = ((zone.to - min) / (max - min)) * 100;
                return [
                  <stop key={`start-${i}`} offset={`${startPct}%`} stopColor={zone.color} />,
                  <stop key={`end-${i}`} offset={`${endPct}%`} stopColor={zone.color} />,
                ];
              })}
            </linearGradient>
            {/* Drop shadow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.3}
          />

          {/* Colored progress arc with gradient */}
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#gauge-gradient-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${remainingLength}`}
            className="transition-all duration-500 ease-out"
          />

          {/* Target marker */}
          {targetMarkerAngle !== undefined && (
            <g>
              <line
                x1={centerX + (radius - strokeWidth) * Math.cos(targetMarkerAngle)}
                y1={centerY + (radius - strokeWidth) * Math.sin(targetMarkerAngle)}
                x2={centerX + (radius + 4) * Math.cos(targetMarkerAngle)}
                y2={centerY + (radius + 4) * Math.sin(targetMarkerAngle)}
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                opacity={0.6}
              />
            </g>
          )}

          {/* Needle */}
          <g filter="url(#glow)">
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX}
              y2={needleY}
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </g>

          {/* Center circle (pivot point) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill="hsl(var(--background))"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={3}
            fill="hsl(var(--foreground))"
          />

          {/* Min/Max labels */}
          <text
            x={centerX - radius - 2}
            y={centerY + 4}
            textAnchor="end"
            className="text-[9px] fill-muted-foreground font-medium"
          >
            {min}
          </text>
          <text
            x={centerX + radius + 2}
            y={centerY + 4}
            textAnchor="start"
            className="text-[9px] fill-muted-foreground font-medium"
          >
            {max}
          </text>
        </svg>

        {/* Value display - centered in the gauge */}
        {showValue && (
          <div
            className="absolute inset-0 flex items-end justify-center"
            style={{ paddingBottom: '8px' }}
          >
            <div className="text-center">
              <span
                className={cn('font-bold tabular-nums', config.valueSize)}
                style={{ color: valueColor }}
              >
                {value % 1 === 0 ? value : value.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <span className={cn('text-muted-foreground mt-1 font-medium text-center', config.fontSize)}>
          {label}
        </span>
      )}
    </div>
  );
}
