/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6f8',
          100: '#e9ecf1',
          200: '#ccd4df',
          300: '#a3b2c6',
          400: '#738aa6',
          500: '#4c6585',
          600: '#3a506b', // Slate primary
          700: '#2c3d52',
          800: '#1e2938',
          900: '#111822',
        },
        emergency: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa8a8',
          400: '#ff8787',
          500: '#fa5252',
          600: '#e03131', // Red warning
          700: '#c92a2a',
        },
        warning: {
          50: '#fff9db',
          100: '#fff3bf',
          200: '#ffec99',
          300: '#ffe066',
          400: '#ffd43b',
          500: '#fcc419',
          600: '#fab005', // Orange warning
          700: '#f59f00',
        },
        success: {
          50: '#ebfbee',
          100: '#d3f9d8',
          200: '#b2f2bb',
          300: '#8ce99a',
          400: '#69db7c',
          500: '#51cf66',
          600: '#40c057', // Green success
          700: '#37b24d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'premium-dark': '0 8px 30px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
