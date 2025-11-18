import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a12",
        foreground: "#f9fafb",
        primary: {
          DEFAULT: "#ff7a00",
          foreground: "#0a0a12"
        },
        muted: {
          DEFAULT: "#111827",
          foreground: "#9ca3af"
        },
        card: {
          DEFAULT: "#0d1326",
          foreground: "#f9fafb"
        }
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
