/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: { 850: '#1e293b', 900: '#0f172a', 950: '#020617' },
        gold: { 500: '#eab308', 600: '#ca8a04' }
      }
    },
  },
  plugins: [],
}