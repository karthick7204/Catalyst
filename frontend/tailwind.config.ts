import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#f8f5ee',
          surface: '#ffffff',
          panel: '#f3efe6',
          sidebar: '#1f1b18',
          sidebarHover: '#2a2420',
          border: '#e5ded3',
          borderDark: '#d8cfc2',
          text: '#221f1d',
          muted: '#78716c',
          subtle: '#a8a29e',
        },
        badge: {
          reviewBg: '#fef3c7',
          reviewText: '#b45309',
          reviewBorder: '#fde68a',
          mergedBg: '#dcfce7',
          mergedText: '#15803d',
          mergedBorder: '#bbf7d0',
          fixingBg: '#e0f2fe',
          fixingText: '#0369a1',
          fixingBorder: '#bae6fd',
          failedBg: '#fee2e2',
          failedText: '#b91c1c',
          failedBorder: '#fecaca',
        }
      }
    },
  },
  plugins: [],
};

export default config;
