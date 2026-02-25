/**
 * DAFC Design Tokens
 * Warm Golden Light Theme Design System
 *
 * Framework: Minimalist Premium UI
 * Brand: DAFC (Warm Golden Copper + Forest Green)
 * Philosophy: Light-only, Semi-compact, Data-First
 */

// ===== BRAND COLORS =====
export const DAFC_BRAND = {
  gold: {
    DEFAULT: '#C4975A',
    light: '#D4B082',
    lighter: '#EDE0D0',
    dark: '#A67B3D',
    darker: '#7D5A28',
  },
  green: {
    DEFAULT: '#1B6B45',
    light: '#2A9E6A',
    dark: '#095431',
  },
};

// ===== SURFACE COLORS =====
export const SURFACE = {
  DEFAULT: '#FFFFFF',
  secondary: '#FBF9F7',
  elevated: '#FFFFFF',
  overlay: 'rgba(44, 36, 23, 0.4)',
  canvas: '#FAF8F5',
};

// ===== CONTENT/TEXT COLORS =====
export const CONTENT = {
  DEFAULT: '#2C2417',
  secondary: '#6B5D4F',
  muted: '#8C8178',
  inverse: '#FFFFFF',
};

// ===== BORDER COLORS =====
export const BORDER = {
  DEFAULT: '#E8E2DB',
  muted: '#F0EBE5',
  emphasis: '#D4CBBC',
};

// ===== STATUS COLORS =====
export const STATUS = {
  critical: {
    DEFAULT: '#DC3545',
    muted: 'rgba(220, 53, 69, 0.1)',
    text: '#DC3545',
  },
  warning: {
    DEFAULT: '#D97706',
    muted: 'rgba(217, 119, 6, 0.1)',
    text: '#D97706',
  },
  success: {
    DEFAULT: '#1B6B45',
    muted: 'rgba(27, 107, 69, 0.1)',
    text: '#1B6B45',
  },
  info: {
    DEFAULT: '#2563EB',
    muted: 'rgba(37, 99, 235, 0.1)',
    text: '#2563EB',
  },
  neutral: {
    DEFAULT: '#8C8178',
    muted: 'rgba(140, 129, 120, 0.1)',
  },
};

// ===== DATA VISUALIZATION COLORS =====
export const DATA = {
  positive: '#1B6B45',
  negative: '#DC3545',
  neutral: '#8C8178',
};

// ===== CHART COLORS =====
export const CHART_COLORS = {
  1: '#C4975A', // DAFC Gold
  2: '#1B6B45', // DAFC Green
  3: '#D97706', // Amber
  4: '#7C3AED', // Purple
  5: '#DC3545', // Red
  6: '#8C8178', // Gray
  7: '#2563EB', // Blue
  8: '#0891B2', // Teal
};

export const CHART_SERIES = [
  '#C4975A', // Golden Copper
  '#1B6B45', // Forest Green
  '#2563EB', // Blue
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#0891B2', // Teal
  '#EC4899', // Pink
  '#84CC16', // Lime
];

// ===== AI COLORS =====
export const AI = {
  DEFAULT: '#7C3AED',
  muted: 'rgba(124, 58, 237, 0.1)',
  text: '#7C3AED',
};

// ===== HIERARCHY COLORS (Tree Structure) =====
export const HIERARCHY_COLORS = {
  0: { // Root - Dark accent
    bg: 'bg-transparent',
    accent: 'bg-slate-800',
    accentWidth: 'w-1',
    text: 'text-slate-900',
    indent: 0,
  },
  1: { // Collection - Blue accent
    bg: 'bg-transparent',
    accent: 'bg-blue-500',
    accentWidth: 'w-1',
    text: 'text-slate-800',
    indent: 0,
  },
  2: { // Gender - Teal accent
    bg: 'bg-transparent',
    accent: 'bg-teal-500',
    accentWidth: 'w-1',
    text: 'text-slate-700',
    indent: 24,
  },
  3: { // Category - Amber accent
    bg: 'bg-transparent',
    accent: 'bg-amber-500',
    accentWidth: 'w-0.5',
    text: 'text-slate-700',
    indent: 24,
  },
  4: { // Product - Rose accent
    bg: 'bg-transparent',
    accent: 'bg-rose-400',
    accentWidth: 'w-0.5',
    text: 'text-slate-600',
    indent: 24,
  },
  5: { // SKU - Gray accent
    bg: 'bg-transparent',
    accent: 'bg-slate-300',
    accentWidth: 'w-0.5',
    text: 'text-slate-600',
    indent: 24,
  },
};

// ===== STATUS COLORS FOR TREE NODES =====
export const STATUS_COLORS = {
  draft: { badge: 'text-slate-500', dot: 'bg-slate-400' },
  verified: { badge: 'text-emerald-600', dot: 'bg-emerald-500' },
  warning: { badge: 'text-amber-600', dot: 'bg-amber-500' },
  error: { badge: 'text-red-600', dot: 'bg-red-500' },
  locked: { badge: 'text-slate-400', dot: 'bg-slate-400' },
};

// ===== CHART THEME =====
export const chartTheme = {
  colors: {
    primary: '#C4975A',
    secondary: '#1B6B45',
    tertiary: '#2563EB',
    quaternary: '#D97706',
    quinary: '#7C3AED',
    senary: '#0891B2',
    positive: '#1B6B45',
    negative: '#DC3545',
    neutral: '#8C8178',
    grid: '#E8E2DB',
    axis: '#6B5D4F',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E8E2DB',
  },

  series: CHART_SERIES,

  fonts: {
    label: "'JetBrains Mono', monospace",
    value: "'JetBrains Mono', monospace",
    title: "'Montserrat', sans-serif",
  },

  grid: {
    stroke: '#E8E2DB',
    strokeDasharray: '3 3',
    strokeWidth: 1,
    opacity: 0.6,
  },

  axis: {
    stroke: '#E8E2DB',
    fontSize: 10,
    tickSize: 4,
    tick: {
      fill: '#6B5D4F',
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
    },
  },

  tooltip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E2DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },

  legend: {
    fontSize: 11,
    fontFamily: "'Montserrat', sans-serif",
    iconSize: 8,
    itemGap: 16,
  },
};

// ===== RECHARTS CONFIG HELPER =====
export const rechartsConfig = {
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: '#E8E2DB',
    strokeOpacity: 0.6,
    vertical: false,
  },

  xAxis: {
    axisLine: { stroke: '#E8E2DB' },
    tickLine: { stroke: '#E8E2DB' },
    tick: {
      fill: '#6B5D4F',
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
    },
  },

  yAxis: {
    axisLine: false,
    tickLine: false,
    tick: {
      fill: '#6B5D4F',
      fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace",
    },
  },

  tooltipContentStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E8E2DB',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: '0 4px 12px rgba(44,36,23,0.12)',
  },
};

// ===== NUMBER FORMATTERS =====
export const chartFormatters = {
  currency: (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value}`;
  },

  currencyVND: (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)} tỷ`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)} tr`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString('vi-VN');
  },

  percent: (value) => `${value.toFixed(1)}%`,

  number: (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  },

  week: (value) => `W${String(value).padStart(2, '0')}`,
};

// ===== COMPLETE TOKEN OBJECT =====
export const DAFC = {
  colors: {
    gold: '#C4975A',
    goldDark: '#A67B3D',
    goldLight: '#D4B082',
    goldLighter: '#EDE0D0',
    goldDarker: '#7D5A28',
    green: '#1B6B45',
    greenLight: '#2A9E6A',
    greenDark: '#095431',
    canvas: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#FBF9F7',
    white: '#FFFFFF',
    status: STATUS,
  },
  fonts: {
    display: "'Montserrat', sans-serif",
    mono: "'JetBrains Mono', monospace",
    body: "'Inter', sans-serif",
  },
  radius: {
    pill: '9999px',
    card: '12px',
    button: '8px',
    input: '8px',
  },
  shadows: {
    glow: '0 0 20px rgba(196, 151, 90, 0.15)',
    card: '0 2px 8px rgba(44,36,23,0.06)',
    elevated: '0 8px 24px rgba(44,36,23,0.10)',
  },
  media: {
    heroSize: { width: 1200, height: 1600 },
    cardSize: { width: 600, height: 800 },
    thumbSize: { width: 400, height: 400 },
    miniSize: { width: 64, height: 64 },
    aspectRatio: '3/4',
    background: '#FAF8F5',
    format: 'webp',
  },
};

export default DAFC;
