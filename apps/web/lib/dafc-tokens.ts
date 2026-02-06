// lib/dafc-tokens.ts — DAFC OTB Platform Design System Tokens

export const DAFC = {
  colors: {
    gold: '#D7B797',
    goldDark: '#B8860B',
    goldLight: '#F5E6D3',
    green: '#127749',
    greenLight: '#1a9d5f',
    black: '#000000',
    charcoal: '#1a1a1a',
    slate: '#2a2a2a',
    cream: '#FAFAFA',
    white: '#FFFFFF',
    status: {
      critical: '#DC2626',
      warning: '#F59E0B',
      success: '#127749',
      info: '#3B82F6',
      muted: '#6B7280',
    },
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
    glow: '0 0 20px rgba(215, 183, 151, 0.3)',
    card: '0 4px 24px rgba(0, 0, 0, 0.12)',
    elevated: '0 8px 32px rgba(0, 0, 0, 0.24)',
  },
  media: {
    heroSize: { width: 1200, height: 1600 },
    cardSize: { width: 600, height: 800 },
    thumbSize: { width: 400, height: 400 },
    miniSize: { width: 64, height: 64 },
    aspectRatio: '3/4',
    background: '#FAFAFA',
    format: 'webp',
  },
} as const;

export type DAFCColors = typeof DAFC.colors;
export type DAFCStatusColor = keyof typeof DAFC.colors.status;
