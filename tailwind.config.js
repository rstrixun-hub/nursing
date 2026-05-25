/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        primaryCyan: '#06b6d4',
        secondaryBlue: '#3b82f6',
      }
    },
  },
  plugins: [],
}