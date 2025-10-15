/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                 // 👈 include main HTML file (required for Vite)
    "./src/**/*.{js,jsx,ts,tsx}",   // all source files
  ],
  theme: {
    extend: {
      colors: {
        'custom-teal': '#00C4B4',
      },
    },
  },
  plugins: [],
}

