// ═══════════════════════════════════════════════════════════════════════════════
// CHART THEME - DAFC Industrial Precision
// Brand: DAFC (Champagne Gold + Forest Green)
// ═══════════════════════════════════════════════════════════════════════════════

// DAFC Brand Colors
const DAFC_COLORS = {
  gold: '#D7B797',
  goldLight: '#E8D4C0',
  goldDark: '#B89970',
  green: '#127749',
  greenLight: '#2A9E6A',
  greenDark: '#095431',
};

export const chartTheme = {
  // ─────────────────────────────────────────────────────────────────────────────
  // COLORS - DAFC Brand Aligned
  // ─────────────────────────────────────────────────────────────────────────────
  colors: {
    // Primary palette - DAFC First
    primary: DAFC_COLORS.gold,           // Champagne Gold
    secondary: DAFC_COLORS.greenLight,   // Forest Green Light
    tertiary: '#58A6FF',                 // Info blue
    quaternary: '#D29922',               // Warning amber
    quinary: '#A371F7',                  // Purple
    senary: '#48CAE4',                   // Teal

    // Semantic - DAFC Aligned
    positive: DAFC_COLORS.green,         // Forest Green for positive
    negative: '#F85149',                 // Red for negative
    neutral: '#8B949E',                  // Gray

    // Grid & Axis - Dark Industrial
    grid: '#2E2E2E',
    axis: '#999999',

    // Backgrounds - Pure black base
    tooltipBg: '#121212',
    tooltipBorder: '#2E2E2E',
    legendBg: '#000000',
  },

  // Series colors array - DAFC Gold first
  series: [
    DAFC_COLORS.gold,       // Champagne Gold
    DAFC_COLORS.greenLight, // Forest Green Light
    '#58A6FF',              // Blue
    '#D29922',              // Amber
    '#A371F7',              // Purple
    '#48CAE4',              // Teal
    '#EC4899',              // Pink
    '#84CC16',              // Lime
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // FONTS - DAFC Brand
  // ─────────────────────────────────────────────────────────────────────────────
  fonts: {
    label: "'JetBrains Mono', monospace",
    value: "'JetBrains Mono', monospace",
    title: "'Montserrat', sans-serif",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GRID STYLE - Dark Industrial
  // ─────────────────────────────────────────────────────────────────────────────
  grid: {
    stroke: '#2E2E2E',
    strokeDasharray: '3 3',
    strokeWidth: 1,
    opacity: 0.4,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AXIS STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  axis: {
    stroke: '#2E2E2E',
    fontSize: 10,
    tickSize: 4,
    strokeWidth: 1,
    tick: {
      fill: '#999999',
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TOOLTIP STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  tooltip: {
    backgroundColor: '#121212',
    borderColor: '#2E2E2E',
    borderRadius: 6,
    padding: 12,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    contentStyle: {
      backgroundColor: '#121212',
      border: '1px solid #2E2E2E',
      borderRadius: '6px',
      padding: '12px',
      fontSize: '11px',
      fontFamily: "'JetBrains Mono', monospace",
    },
    labelStyle: {
      color: '#F2F2F2',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: '#999999',
      padding: '2px 0',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEGEND STYLE
  // ─────────────────────────────────────────────────────────────────────────────
  legend: {
    fontSize: 11,
    fontFamily: "'Montserrat', sans-serif",
    iconSize: 8,
    itemGap: 16,
    wrapperStyle: {
      fontSize: '11px',
      fontFamily: "'Montserrat', sans-serif",
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECHARTS CONFIG HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const rechartsConfig = {
  // Grid props
  cartesianGrid: {
    strokeDasharray: chartTheme.grid.strokeDasharray,
    stroke: chartTheme.grid.stroke,
    strokeOpacity: chartTheme.grid.opacity,
    vertical: false,
  },

  // X Axis props
  xAxis: {
    axisLine: { stroke: chartTheme.axis.stroke },
    tickLine: { stroke: chartTheme.axis.stroke },
    tick: chartTheme.axis.tick,
  },

  // Y Axis props
  yAxis: {
    axisLine: false,
    tickLine: false,
    tick: chartTheme.axis.tick,
  },

  // Tooltip content style
  tooltipContentStyle: chartTheme.tooltip.contentStyle,

  // Legend props
  legend: {
    wrapperStyle: chartTheme.legend.wrapperStyle,
    iconSize: chartTheme.legend.iconSize,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════════════════════

export const chartFormatters = {
  currency: (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  },

  currencyVND: (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} tr`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString('vi-VN');
  },

  percent: (value: number) => `${value.toFixed(1)}%`,

  number: (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString();
  },

  week: (value: string | number) => `W${String(value).padStart(2, '0')}`,

  month: (value: string | number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const index = typeof value === 'number' ? value - 1 : parseInt(value) - 1;
    return months[index] || value;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getSeriesColor(index: number): string {
  return chartTheme.series[index % chartTheme.series.length];
}

export function getStatusColor(status: 'positive' | 'negative' | 'neutral'): string {
  return chartTheme.colors[status];
}

// Helper for area chart confidence bands
export const confidenceBandStyle = {
  fill: chartTheme.colors.primary,
  fillOpacity: 0.1,
  stroke: 'none',
};

// Helper for reference lines
export const referenceLineStyle = {
  stroke: chartTheme.colors.quaternary,
  strokeDasharray: '4 4',
  strokeWidth: 1,
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default chartTheme;
