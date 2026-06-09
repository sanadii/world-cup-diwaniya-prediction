import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Night Stadium palette — near-black with subtle pitch-green DNA
        pitch: {
          950: '#070908',   // darkest anchor — body background
          900: '#131C18',   // card / modal backgrounds — distinctly lighter than body
          800: '#1E2C23',   // elevated surfaces — hover areas, inputs
          700: '#263528',   // active / higher surfaces
          600: '#2E4135',   // borders (active)
          500: '#384F40',   // highlights
          400: '#4A6454',   // glows / hover
        },
        gold: {
          100: '#FDF6DC',
          200: '#F7E8A0',
          300: '#EDD06A',
          400: '#D4AF37',  // burnished gold
          500: '#C9A020',
          600: '#A8891A',
          700: '#7A6312',
        },
        border: {
          DEFAULT: '#2E4438',  // lighter — visible as a separator line
          subtle: '#1E2E26',
          glow: '#4A6454',
        },
        live: '#16A34A',
        locked: '#DC2626',
        open: '#2563EB',
        // Semantic text tokens — use text-muted and text-secondary instead of arbitrary values
        muted: '#7A9088',      // WCAG AA ≥ 4.5:1 on pitch-900 background
        secondary: '#8BA898',  // secondary text, marginal AA pass
      },
      fontFamily: {
        // Latin fonts (LTR) — Arabic counterpart (Almarai) applied via [dir="rtl"] CSS
        display: ['"Bebas Neue"', '"Almarai"', 'sans-serif'],
        heading: ['"Oswald"', '"Almarai"', 'sans-serif'],
        body: ['"Outfit"', '"Almarai"', 'sans-serif'],
      },
      backgroundImage: {
        'turf-pattern': `repeating-linear-gradient(
          135deg,
          transparent,
          transparent 20px,
          rgba(22, 163, 74, 0.02) 20px,
          rgba(22, 163, 74, 0.02) 40px
        )`,
        'stadium-glow': 'radial-gradient(ellipse 90% 50% at 50% -5%, rgba(22, 163, 74, 0.15) 0%, rgba(22, 163, 74, 0.04) 55%, transparent 70%)',
        'gold-glow': 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212, 175, 55, 0.14) 0%, rgba(212, 175, 55, 0.04) 50%, transparent 70%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'count-up': 'count-up 0.8s ease-out forwards',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(22, 163, 74, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 8px rgba(22, 163, 74, 0)' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.9)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.2)',
        'live': '0 0 16px rgba(22, 163, 74, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
