// Theme-aware chart colors utility
// Use CSS variables that adapt to light/dark mode

export const chartColors = {
  // Primary colors for main data series
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',

  // Status colors - use CSS variables
  success: 'var(--color-success-500)',
  warning: 'var(--color-warning-500)',
  error: 'var(--color-error-500)',
  info: 'var(--color-info-500)',

  // Chart specific colors using Tailwind's chart variables
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',

  // Muted for grid lines, axes
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',

  // For backgrounds
  background: 'hsl(var(--background))',
  card: 'hsl(var(--card))',
  foreground: 'hsl(var(--foreground))',
};

// Get color for trend direction
export function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return chartColors.success;
    case 'down':
      return chartColors.error;
    default:
      return chartColors.mutedForeground;
  }
}

// Recharts tooltip style that adapts to theme
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  labelStyle: {
    color: 'hsl(var(--foreground))',
    fontWeight: 600,
  },
  itemStyle: {
    color: 'hsl(var(--muted-foreground))',
  },
};

// Grid line color for charts
export const gridColor = 'hsl(var(--border))';

// Axis tick color
export const axisColor = 'hsl(var(--muted-foreground))';
