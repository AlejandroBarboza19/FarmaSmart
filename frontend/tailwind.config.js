/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "background":                "#f6faff",
        "primary":                   "#00527b",
        "primary-container":         "#1a6b9a",
        "on-primary":                "#ffffff",
        "secondary":                 "#4a6175",
        "secondary-container":       "#cde5fd",
        "on-secondary":              "#ffffff",
        "surface":                   "#f6faff",
        "surface-variant":           "#dce3eb",
        "surface-container":         "#e8eff7",
        "surface-container-low":     "#edf4fc",
        "surface-container-high":    "#e2e9f1",
        "surface-container-lowest":  "#ffffff",
        "surface-container-highest": "#dce3eb",
        "on-surface":                "#151c22",
        "on-surface-variant":        "#40484f",
        "outline":                   "#707880",
        "outline-variant":           "#c0c7d0",
        "error":                     "#ba1a1a",
        "tertiary":                  "#6d4400",
        "tertiary-container":        "#8d5a02",
      },
      fontFamily: {
        headline: ["Manrope"],
        body:     ["Plus Jakarta Sans"],
        label:    ["Plus Jakarta Sans"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
      },
    },
  },
  plugins: [],
}