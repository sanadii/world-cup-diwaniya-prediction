import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Night Stadium palette
        pitch: {
          950: '#040807',
          900: '#060B08',
          800: '#0C1510',
          700: '#112018',
          600: '#1A3024',
          500: '#234232',
          400: '#2E5A42',
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
          DEFAULT: '#1E3028',
          subtle: '#162419',
          glow: '#2E5A42',
        },
        live: '#16A34A',
        locked: '#DC2626',
        open: '#2563EB',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        heading: ['"Oswald"', 'sans-serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
      backgroundImage: {
        'turf-pattern': `repeating-linear-gradient(
          135deg,
          transparent,
          transparent 20px,
          rgba(22, 163, 74, 0.03) 20px,
          rgba(22, 163, 74, 0.03) 40px
        )`,
        'stadium-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(22, 163, 74, 0.15), transparent)',
        'gold-glow': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212, 175, 55, 0.12), transparent)',
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
