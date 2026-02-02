import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // ═══════════════════════════════════════════════════════════════
    // OVERRIDE DEFAULTS - Industrial Scale (Flat Design)
    // ═══════════════════════════════════════════════════════════════
    fontSize: {
      'xs': ['12px', { lineHeight: '16px' }],
      'sm': ['13px', { lineHeight: '18px' }],
      'base': ['14px', { lineHeight: '20px' }],
      'md': ['16px', { lineHeight: '22px' }],
      'lg': ['18px', { lineHeight: '26px' }],
      'xl': ['22px', { lineHeight: '30px' }],
      '2xl': ['26px', { lineHeight: '34px' }],
      '3xl': ['34px', { lineHeight: '42px' }],
    },

    borderRadius: {
      'none': '0',
      'sm': '2px',
      'DEFAULT': '4px',
      'md': '4px',
      'lg': '6px',
      'xl': '8px',
      'full': '9999px',
      'pill': '99px',
    },

    extend: {
      // ═══════════════════════════════════════════════════════════════
      // COLORS - DAFC Brand + Industrial Palette
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // DAFC Brand Colors
        dafc: {
          gold: {
            DEFAULT: '#D7B797',
            light: '#E8D4C0',
            dark: '#B89970',
          },
          green: {
            DEFAULT: '#127749',
            light: '#2A9E6A',
            dark: '#095431',
          },
        },

        // CSS Variable Colors (theme-aware)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        ring: 'hsl(var(--ring))',
        input: 'hsl(var(--input))',

        // Backgrounds - DAFC Industrial Dark
        canvas: '#000000',
        surface: {
          DEFAULT: '#121212',
          secondary: '#1A1A1A',
          elevated: '#242424',
          overlay: 'rgba(36, 36, 36, 0.5)',
        },

        // Borders
        border: {
          DEFAULT: 'hsl(var(--border))',
          muted: '#1A1A1A',
          emphasis: '#3D3D3D',
        },

        // Text
        content: {
          DEFAULT: '#F2F2F2',
          secondary: '#999999',
          muted: '#666666',
          inverse: '#000000',
        },

        // Status - DAFC Brand Aligned
        status: {
          critical: {
            DEFAULT: '#F85149',
            muted: 'rgba(248, 81, 73, 0.15)',
            text: '#FF7B72',
          },
          warning: {
            DEFAULT: '#D29922',
            muted: 'rgba(210, 153, 34, 0.15)',
            text: '#E3B341',
          },
          success: {
            DEFAULT: '#127749', // DAFC Green
            muted: 'rgba(18, 119, 73, 0.15)',
            text: '#2A9E6A',
          },
          info: {
            DEFAULT: '#58A6FF',
            muted: 'rgba(88, 166, 255, 0.15)',
            text: '#79C0FF',
          },
          neutral: {
            DEFAULT: '#8B949E',
            muted: 'rgba(139, 148, 158, 0.15)',
          },
        },

        // Data visualization - DAFC aligned
        data: {
          positive: '#127749', // DAFC Green
          negative: '#F85149',
          neutral: '#8B949E',
        },

        // Accent - DAFC Gold (theme-aware)
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          hover: '#E8D4C0',
          active: '#B89970',
        },

        // AI/Special
        ai: {
          DEFAULT: '#A371F7',
          muted: 'rgba(163, 113, 247, 0.15)',
          text: '#D2A8FF',
        },

        // Chart colors - DAFC First
        chart: {
          1: '#D7B797', // DAFC Gold
          2: '#2A9E6A', // DAFC Green Light
          3: '#D29922', // Amber
          4: '#A371F7', // Purple
          5: '#F85149', // Red
          6: '#8B949E', // Gray
        },
      },

      // ═══════════════════════════════════════════════════════════════
      // TYPOGRAPHY - DAFC Brand
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        brand: ['Montserrat', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'Consolas', 'monospace'],
      },

      // ═══════════════════════════════════════════════════════════════
      // SPACING - Compact Scale
      // ═══════════════════════════════════════════════════════════════
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },

      // ═══════════════════════════════════════════════════════════════
      // SIZING
      // ═══════════════════════════════════════════════════════════════
      height: {
        'header': '48px',
        'row': '36px',
        'row-compact': '32px',
        'input': '36px',
        'input-sm': '32px',
        'input-lg': '40px',
        'btn': '32px',
        'btn-sm': '28px',
        'btn-lg': '40px',
      },

      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '48px',
        'panel-sm': '400px',
        'panel-md': '480px',
        'panel-lg': '560px',
        'btn': '32px',
      },

      // ═══════════════════════════════════════════════════════════════
      // SHADOWS - Flat Design (No shadows, use borders instead)
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        'sm': 'none',
        'DEFAULT': 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
        '2xl': 'none',
        'focus': '0 0 0 3px rgba(212, 135, 90, 0.3)',
        'none': 'none',
      },

      // ═══════════════════════════════════════════════════════════════
      // ANIMATIONS
      // ═══════════════════════════════════════════════════════════════
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
      },

      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-subtle': 'pulse-subtle 2s infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;
