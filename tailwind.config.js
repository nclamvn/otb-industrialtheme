/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      // ===== DAFC BRAND COLORS =====
      colors: {
        // Brand Colors
        dafc: {
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
        },

        // Surface Colors (Light Theme)
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#FBF9F7',
          elevated: '#FFFFFF',
          overlay: 'rgba(44, 36, 23, 0.4)',
        },
        canvas: '#FAF8F5',

        // Content/Text Colors
        content: {
          DEFAULT: '#2C2417',
          secondary: '#6B5D4F',
          muted: '#8C8178',
          inverse: '#FFFFFF',
        },

        // Border Colors
        border: {
          DEFAULT: '#E8E2DB',
          muted: '#F0EBE5',
          emphasis: '#D4CBBC',
        },

        // Status Colors
        status: {
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
        },

        // Data Visualization
        data: {
          positive: '#1B6B45',
          negative: '#DC3545',
          neutral: '#8C8178',
        },

        // Chart Colors
        chart: {
          1: '#C4975A',
          2: '#1B6B45',
          3: '#D97706',
          4: '#7C3AED',
          5: '#DC3545',
          6: '#8C8178',
          7: '#2563EB',
          8: '#0891B2',
        },

        // AI/Special Colors
        ai: {
          DEFAULT: '#7C3AED',
          muted: 'rgba(124, 58, 237, 0.1)',
          text: '#7C3AED',
        },
      },

      // ===== TYPOGRAPHY =====
      fontFamily: {
        brand: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        display: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        data: ['var(--font-jetbrains-mono)', 'Consolas', 'monospace'],
        mono: ['var(--font-jetbrains-mono)', 'Consolas', 'monospace'],
      },

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

      // ===== SPACING (Compact Scale - 2px base) =====
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

      // ===== COMPONENT HEIGHTS =====
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

      // ===== COMPONENT WIDTHS =====
      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '48px',
        'panel-sm': '400px',
        'panel-md': '480px',
        'panel-lg': '560px',
        'btn': '32px',
      },

      // ===== BORDER RADIUS =====
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '6px',
        'xl': '8px',
        '2xl': '12px',
        'full': '9999px',
        'pill': '99px',
      },

      // ===== SHADOWS (Warm Light Theme) =====
      boxShadow: {
        'sm': '0 1px 2px rgba(44,36,23,0.04)',
        'DEFAULT': '0 2px 8px rgba(44,36,23,0.06)',
        'md': '0 4px 16px rgba(44,36,23,0.06)',
        'lg': '0 8px 24px rgba(44,36,23,0.08)',
        'xl': '0 12px 32px rgba(44,36,23,0.10)',
        '2xl': '0 16px 48px rgba(44,36,23,0.12)',
        'focus': '0 0 0 3px rgba(196, 151, 90, 0.25)',
        'glow': '0 0 20px rgba(196, 151, 90, 0.15)',
        'card': '0 2px 8px rgba(44,36,23,0.06)',
        'elevated': '0 8px 24px rgba(44,36,23,0.10)',
        'tooltip': '0 4px 12px rgba(44,36,23,0.12)',
        'none': 'none',
      },

      // ===== TRANSITIONS =====
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
      },

      // ===== ANIMATIONS =====
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slideDown': {
          'from': { opacity: '0', maxHeight: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', maxHeight: '2000px', transform: 'translateY(0)' },
        },
        'slideUp': {
          'from': { opacity: '1', maxHeight: '2000px' },
          'to': { opacity: '0', maxHeight: '0' },
        },
        'fadeIn': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'scaleIn': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
      },

      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-subtle': 'pulse-subtle 2s infinite',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
