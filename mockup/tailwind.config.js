/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary dark backgrounds
        'dark-primary': '#0F0F0F',
        'dark-secondary': '#1A1A1A',
        'dark-card': '#232323',
        'dark-border': '#2A2A2A',
        
        // Orange accent (from ui-1.jpeg)
        'orange-primary': '#FF8C42',
        'orange-hover': '#FF9D5C',
        'orange-dark': '#E67A30',
        
        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0A0',
        'text-tertiary': '#666666',
        
        // Gold/yellow for icons and badges
        'gold': '#D4AF37',
        'gold-light': '#E5C158',
      },
      borderRadius: {
        'card': '20px',
        'button': '25px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 6px 30px rgba(255, 140, 66, 0.2)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
