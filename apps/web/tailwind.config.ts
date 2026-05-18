import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff3e0',
          100: '#ffe0b2',
          500: '#e8610a',
          600: '#d4550f',
          700: '#b84a0d',
          900: '#7c2d12',
        },
        surface: {
          DEFAULT: '#0f0f0f',
          card:    '#161616',
          border:  '#242424',
          800:     '#1a1a1a',
        },
        silver: {
          400: '#9ca3af',
          500: '#b8c4cc',
          600: '#8a9ba8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
