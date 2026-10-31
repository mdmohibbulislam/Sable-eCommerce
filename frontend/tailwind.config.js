/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#faf8f5',
          100: '#f4efe8',
          150: '#efe8de',
          200: '#e8dfd4',
          300: '#d8cbba',
        },
        ink: {
          DEFAULT: '#1c1917',
          soft: '#44403c',
          muted: '#78716c',
          faint: '#a8a29e',
        },
        ember: {
          DEFAULT: '#c2410c',
          dark: '#9a3412',
          light: '#ea580c',
          wash: '#fff7ed',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,0.05), 0 12px 32px -18px rgba(28,25,23,0.35)',
        lift: '0 2px 4px rgba(28,25,23,0.06), 0 24px 48px -24px rgba(28,25,23,0.45)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'slide-in': 'slide-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
