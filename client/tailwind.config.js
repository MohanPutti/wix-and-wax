/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm amber/gold palette
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        // Cream tones
        cream: {
          50: '#FFFDF7',
          100: '#FFFBEB',
          200: '#FEF7E0',
          300: '#FDF2D0',
        },
        // Warm browns
        warm: {
          50: '#FAF5F0',
          100: '#F5EBE0',
          200: '#E6D5C3',
          300: '#D4B896',
          400: '#C4A574',
          500: '#A68B5B',
          600: '#8B7355',
          700: '#705C45',
          800: '#5A4A38',
          900: '#78350F',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'warm': '0 4px 20px -2px rgba(245, 158, 11, 0.15)',
      },
    },
  },
  plugins: [],
}
