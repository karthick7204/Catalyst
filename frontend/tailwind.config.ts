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
        background: '#0b0f17',
        surface: '#0f172a',
        card: '#131d33',
        brand: {
          500: '#10b981',
          600: '#059669',
        }
      }
    },
  },
  plugins: [],
};

export default config;

