/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
        }
      }
    },
  },
  plugins: [],
}
