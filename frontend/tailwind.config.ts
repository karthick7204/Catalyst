import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          panel: 'var(--panel)',
          sidebar: 'var(--sidebar)',
          sidebarHover: 'var(--sidebar-hover)',
          sidebarText: 'var(--sidebar-text)',
          sidebarBorder: 'var(--sidebar-border)',
          border: 'var(--border)',
          borderDark: 'var(--border-dark)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          subtle: 'var(--subtle)',
        },
        primaryBtn: {
          bg: 'var(--btn-primary-bg)',
          hover: 'var(--btn-primary-hover)',
          text: 'var(--btn-primary-text)',
        },
        cardHero: {
          bg: 'var(--card-hero-bg)',
          text: 'var(--card-hero-text)',
        },
        codeArea: {
          bg: 'var(--code-editor-bg)',
          headerBg: 'var(--code-header-bg)',
        },
        badge: {
          reviewBg: 'var(--badge-review-bg)',
          reviewText: 'var(--badge-review-text)',
          reviewBorder: 'var(--badge-review-border)',
          mergedBg: 'var(--badge-merged-bg)',
          mergedText: 'var(--badge-merged-text)',
          mergedBorder: 'var(--badge-merged-border)',
          fixingBg: 'var(--badge-fixing-bg)',
          fixingText: 'var(--badge-fixing-text)',
          fixingBorder: 'var(--badge-fixing-border)',
          failedBg: 'var(--badge-failed-bg)',
          failedText: 'var(--badge-failed-text)',
          failedBorder: 'var(--badge-failed-border)',
        }
      }
    },
  },
  plugins: [],
};

export default config;
