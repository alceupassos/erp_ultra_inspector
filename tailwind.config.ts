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
        background: "#0a0a0f",
        foreground: "#ff8a1f",
        primary: {
          DEFAULT: "#ff8a1f",
          foreground: "#0a0a0f",
          50: "#fff4e6",
          100: "#ffe0b3",
          200: "#ffcc80",
          300: "#ffb84d",
          400: "#ffa64d",
          500: "#ff8a1f",
          600: "#e67a1c",
          700: "#cc6a19",
          800: "#b35a16",
          900: "#994a13"
        },
        muted: {
          DEFAULT: "#1a1a1f",
          foreground: "#ffb366"
        },
        card: {
          DEFAULT: "#0f0f15",
          foreground: "#ff8a1f"
        },
        border: "rgba(255, 138, 31, 0.2)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 138, 31, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 138, 31, 0.4)',
        'glow-xl': '0 0 60px rgba(255, 138, 31, 0.5)'
      }
    }
  },
  plugins: []
};

export default config;
