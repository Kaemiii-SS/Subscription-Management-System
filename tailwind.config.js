/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#edf7f1",
        surface: "#f7fcf9",

        primary: {
          DEFAULT: "#16a34a",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        secondary: {
          DEFAULT: "#34d399",
          400: "#34d399",
        },

        sage: "#d1fae5",
        mint: "#6ee7b7",
        teal: {
          DEFAULT: "#5eead4",
          100: "#ccfbf1",
          300: "#5eead4",
          600: "#0d9488",
        },

        amber: {
          DEFAULT: "#fbbf24",
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          700: "#b45309",
        },
        coral: {
          DEFAULT: "#fb7185",
          50: "#fff1f2",
          100: "#ffe4e6",
          400: "#fb7185",
          700: "#be123c",
        },
        lavender: {
          DEFAULT: "#c4b5fd",
          50: "#f5f3ff",
          100: "#ede9fe",
          300: "#c4b5fd",
          700: "#6d28d9",
        },

        textPrimary: "#1f2937",
        textSecondary: "#6b7280",
        border: "#dbe7df",
      },
    },
  },
  plugins: [],
}
