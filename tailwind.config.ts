import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#2a322c",
          muted: "#6b756f",
        },
        canvas: "#f0eee9",
        surface: "#ffffff",
        sage: {
          DEFAULT: "#4a6b52",
          hover: "#3d5a44",
        },
        coral: {
          DEFAULT: "#e06b5c",
          hover: "#c95a4d",
        },
        /* legacy aliases used in a few places */
        binding: {
          DEFAULT: "#4a6b52",
          hover: "#3d5a44",
        },
        desk: {
          DEFAULT: "#f0eee9",
          deep: "#ffffff",
        },
        paper: {
          DEFAULT: "#ffffff",
          line: "#d8d4cc",
          margin: "#e06b5c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        cooking: ["1.05rem", { lineHeight: "1.65" }],
        "cooking-lg": ["1.125rem", { lineHeight: "1.55" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
