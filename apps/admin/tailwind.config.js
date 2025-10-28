/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'dark-primary': '#0F0F0F',
        'dark-secondary': '#1A1A1A',
        'dark-card': '#232323',
        'dark-border': '#2A2A2A',
        'dark-elevated': '#2D2D2D',
        
        // Orange accent
        orange: {
          50: '#FFF5ED',
          100: '#FFE6D5',
          200: '#FFCBAA',
          300: '#FFB47A',
          400: '#FF9D5C',
          500: '#FF8C42',
          600: '#FF7A1C',
          700: '#E67A30',
          800: '#CC5F1A',
          900: '#994714',
          primary: '#FF8C42',
          hover: '#FF9D5C',
          dark: '#E67A30',
          light: '#FFB47A',
        },
        
        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0A0',
        'text-tertiary': '#666666',
        
        // Legacy colors (keeping for compatibility)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}