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
        // Light, premium "White + Light Blue" theme
        navy: {
          950: '#F2F7FE', // page background — airy blue-white
          900: '#FFFFFF', // main panels & cards
          800: '#EAF1FC', // subtle secondary panels
          700: '#D8E6F9',
          600: '#C2D8F3',
        },
        cyan: {
          DEFAULT: '#1E7CF7', // rich sky-blue accent
          hover: '#3D8DFF',
          dim: 'rgba(30, 124, 247, 0.10)',
        },
        electric: {
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#F7FAFF',
          border: 'rgba(13, 74, 148, 0.12)',
          'border-highlight': 'rgba(30, 124, 247, 0.35)',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 6px 22px -6px rgba(30, 124, 247, 0.45)',
        'glow-card': '0 10px 32px -14px rgba(13, 74, 148, 0.22)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out both',
        fadeInUp: 'fadeInUp 0.45s ease-out both',
        scaleIn: 'scaleIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
