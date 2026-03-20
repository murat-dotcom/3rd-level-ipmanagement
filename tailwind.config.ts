import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--c-primary-hover) / <alpha-value>)',
        'primary-light': 'rgb(var(--c-primary-light) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--c-accent-hover) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        error: 'rgb(var(--c-error) / <alpha-value>)',
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--c-surface-alt) / <alpha-value>)',
        'surface-hover': 'rgb(var(--c-surface-hover) / <alpha-value>)',
        't-primary': 'rgb(var(--c-text) / <alpha-value>)',
        't-secondary': 'rgb(var(--c-text-secondary) / <alpha-value>)',
        't-muted': 'rgb(var(--c-text-muted) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        'border-light': 'rgb(var(--c-border-light) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--c-card-radius)',
      },
      boxShadow: {
        card: 'var(--c-card-shadow)',
      },
    },
  },
  plugins: [],
};

export default config;
