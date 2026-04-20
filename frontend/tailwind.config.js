/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#00527b",
        "primary-container": "#1a6b9a",
        "on-primary": "#ffffff",
        "background": "#f6faff",
        "surface": "#f6faff",
        "surface-container": "#e8eff7",
        "surface-container-low": "#edf4fc",
        "surface-container-high": "#e2e9f1",
        "surface-container-highest": "#dce3eb",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#151c22",
        "on-surface-variant": "#40484f",
        "outline": "#707880",
        "outline-variant": "#c0c7d0",
        "error": "#ba1a1a",
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      }
    },
  },
  plugins: [],
}
