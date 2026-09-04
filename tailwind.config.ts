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
          DEFAULT: "#1c2b28",
          muted: "#5a6b66",
        },
        desk: {
          DEFAULT: "#2f453c",
          deep: "#24362f",
        },
        binding: {
          DEFAULT: "#0f6e6a",
          hover: "#0b5855",
        },
        paper: {
          DEFAULT: "#fffcf5",
          line: "#b8c9dc",
          margin: "#d97878",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      fontSize: {
        cooking: ["1.125rem", { lineHeight: "32px" }],
        "cooking-lg": ["1.25rem", { lineHeight: "32px" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
