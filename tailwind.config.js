/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neon theme colors
        cyan: {
          400: '#31E1F7',
          500: '#00D7FE'
        },
        pink: {
          400: '#FF54F8',
          500: '#F034E3'
        },
        yellow: {
          400: '#FFF338',
          500: '#FFE500'
        },
        gray: {
          700: '#2A2A3A',
          800: '#1E1E2C',
          900: '#14141F'
        }
      },
      boxShadow: {
        'neon': '0 0 5px rgba(49, 225, 247, 0.3), 0 0 10px rgba(49, 225, 247, 0.2)',
        'neon-hover': '0 0 8px rgba(49, 225, 247, 0.5), 0 0 15px rgba(49, 225, 247, 0.3)'
      },
      animation: {
        'pulse-slow': 'pulse 4s infinite'
      }
    },
  },
  plugins: [],
};