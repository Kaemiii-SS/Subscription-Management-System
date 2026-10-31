/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: "var(--bg-base)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        surface: "var(--surface)",
        surfaceStrong: "var(--surface-strong)",
        border: "var(--border)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",

        primary: {
          DEFAULT: "var(--accent)",
          50: "rgba(137, 150, 78, 0.08)",
          100: "rgba(137, 150, 78, 0.15)",
          200: "rgba(137, 150, 78, 0.25)",
          300: "rgba(137, 150, 78, 0.40)",
          400: "rgba(137, 150, 78, 0.60)",
          500: "var(--accent)",
          600: "var(--accent)",
          700: "var(--accent-hover)",
          800: "#4d5626",
          900: "#39401c",
        },
        secondary: {
          DEFAULT: "#b5c27a",
          400: "#b5c27a",
        },

        sage: "var(--accent-soft)",
        mint: "var(--accent)",
        teal: {
          DEFAULT: "#4fa8a0",
          100: "rgba(79, 168, 160, 0.15)",
          300: "#5eead4",
          600: "#0d9488",
        },

        amber: {
          DEFAULT: "var(--warning)",
          50: "rgba(224, 180, 90, 0.08)",
          100: "rgba(224, 180, 90, 0.15)",
          400: "var(--warning)",
          700: "#c2973b",
        },
        coral: {
          DEFAULT: "var(--danger)",
          50: "rgba(229, 100, 90, 0.08)",
          100: "rgba(229, 100, 90, 0.15)",
          400: "var(--danger)",
          700: "#e5645a",
        },
        lavender: {
          DEFAULT: "#c4b5fd",
          50: "#f5f3ff",
          100: "#ede9fe",
          300: "#c4b5fd",
          700: "#6d28d9",
        },

        background: "transparent",
      },
    },
  },
  plugins: [],
}
