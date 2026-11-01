import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050914',
          900: '#0A1024',
          800: '#111A36',
          700: '#1A274E',
          600: '#263768',
        },
        cyan: {
          DEFAULT: '#00F0FF',
          hover: '#33F3FF',
          dim: 'rgba(0, 240, 255, 0.12)',
        },
        electric: {
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        surface: {
          DEFAULT: '#0D152A',
          card: '#121B35',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-highlight': 'rgba(0, 240, 255, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.3)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
};

export default config;
