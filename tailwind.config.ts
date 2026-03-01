import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", ".dark, .charcoal"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        sidebar: "var(--sidebar)",
        surface: "var(--surface)",
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        // shadcn compatibility
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-secondary)",
        },
        muted: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-muted)",
        },
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "#FFFFFF",
        },
        input: "var(--border)",
        ring: "var(--accent)",
      },
      fontFamily: {
        geist: ["var(--font-geist)"],
        inter: ["var(--font-inter)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        card: "var(--card-radius)",
        lg: "var(--card-radius)",
        md: "calc(var(--card-radius) - 2px)",
        sm: "calc(var(--card-radius) - 4px)",
      },
      boxShadow: {
        glow: "0 0 0 1px var(--accent)",
        "glow-lg": "0 0 20px rgba(124, 58, 237, 0.15)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulse_glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124, 58, 237, 0)" },
          "50%": { boxShadow: "0 0 12px 2px rgba(124, 58, 237, 0.3)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        pulse_glow: "pulse_glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
