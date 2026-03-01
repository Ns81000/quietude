import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class", "[data-theme='midnight']"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        "bg-2": "hsl(var(--bg-2))",
        surface: "hsl(var(--surface))",
        border: "hsl(var(--border))",
        text: "hsl(var(--text))",
        "text-soft": "hsl(var(--text-soft))",
        "text-muted": "hsl(var(--text-muted))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          soft: "hsl(var(--accent-soft))",
          text: "hsl(var(--accent-text))",
        },
        correct: "hsl(var(--correct))",
        incorrect: "hsl(var(--incorrect))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--accent))",
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--text))",
        primary: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-text))",
        },
        secondary: {
          DEFAULT: "hsl(var(--bg-2))",
          foreground: "hsl(var(--text))",
        },
        destructive: {
          DEFAULT: "hsl(var(--incorrect))",
          foreground: "hsl(var(--accent-text))",
        },
        muted: {
          DEFAULT: "hsl(var(--bg-2))",
          foreground: "hsl(var(--text-muted))",
        },
        popover: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text))",
        },
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--text))",
        },
      },
      fontFamily: {
        display: ["Lora", "Georgia", "serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        sm: "0 1px 3px hsl(var(--shadow) / 0.08)",
        md: "0 4px 12px hsl(var(--shadow) / 0.08)",
        lg: "0 8px 24px hsl(var(--shadow) / 0.08)",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        breathe: "breathe 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) both",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      maxWidth: {
        content: "1200px",
        prose: "680px",
        quiz: "640px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
