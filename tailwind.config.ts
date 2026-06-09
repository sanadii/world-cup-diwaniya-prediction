import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Football App palette — deep forest greens
        pitch: {
          950: '#071E16',   // page background — deep forest green
          900: '#0E3B2E',   // card/panel surface — dark emerald
          800: '#1A5042',   // inputs, nested surfaces, L2
          700: '#235C4D',   // hover states, interactive
          600: '#2C6858',   // separators, active elements
          500: '#357564',   // highlights
          400: '#3D8270',   // border glows
        },
        gold: {
          100: '#FFF9E0',
          200: '#FFF0A0',
          300: '#F4D03F',   // goldLight — hover, trophy icons
          400: '#D4AF37',   // championship gold — CTAs, rewards, rank numbers
          500: '#C9A020',   // darker gold
          600: '#A8891A',
          700: '#7A6312',
        },
        // Explicit primary/secondary greens
        primary: '#18A558',    // Football green — buttons, active states
        'primary-hover': '#22C46A',
        accent: '#35D07F',     // Pitch green — highlights, badges

        border: {
          DEFAULT: '#1A4A3A',  // visible separator on surface
          subtle: '#0F3026',
          glow: '#3D8270',
        },
        live: '#18A558',
        locked: '#DC2626',
        open: '#2563EB',
        // Semantic text tokens
        muted: '#B7C4BC',      // secondary text, timestamps
        secondary: '#C8D4CF',  // slightly brighter secondary text
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Almarai"', 'sans-serif'],
        heading: ['"Oswald"', '"Almarai"', 'sans-serif'],
        body: ['"Outfit"', '"Almarai"', 'sans-serif'],
      },
      backgroundImage: {
        'turf-pattern': `repeating-linear-gradient(
          135deg,
          transparent,
          transparent 20px,
          rgba(24, 165, 88, 0.025) 20px,
          rgba(24, 165, 88, 0.025) 40px
        )`,
        'stadium-glow': 'radial-gradient(ellipse 90% 50% at 50% -5%, rgba(24, 165, 88, 0.18) 0%, rgba(24, 165, 88, 0.06) 55%, transparent 70%)',
        'gold-glow': 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212, 175, 55, 0.14) 0%, rgba(212, 175, 55, 0.04) 50%, transparent 70%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
        'brand-gradient': 'linear-gradient(135deg, #071E16 0%, #0E3B2E 50%, #18A558 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 60%, #BFF4B0 100%)',
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
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(24, 165, 88, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 8px rgba(24, 165, 88, 0)' },
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
        'live': '0 0 16px rgba(24, 165, 88, 0.45)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.65)',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.07)',
      },
    },
  },
  plugins: [],
} satisfies Config
