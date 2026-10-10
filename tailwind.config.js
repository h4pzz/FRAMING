/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: '#fdf8f4',
          100: '#f7eee4',
          200: '#edd8c4',
          300: '#dfbc9b',
          400: '#d09b71',
          500: '#c57f50',
          600: '#b76a44',
          700: '#985239',
          800: '#7c4333',
          900: '#64392c',
        }
      }
    },
  },
  plugins: [],
}
