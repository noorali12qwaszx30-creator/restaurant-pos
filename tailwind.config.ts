import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tajawal", "sans-serif"],
      },
      colors: {
        // Design tokens mapped from CSS variables — never use raw Tailwind colors in components
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
          hover: "hsl(var(--color-primary-hover))",
        },
        background: "hsl(var(--color-background))",
        surface: {
          DEFAULT: "hsl(var(--color-surface))",
          elevated: "hsl(var(--color-surface-elevated))",
        },
        border: {
          DEFAULT: "hsl(var(--color-border))",
          subtle: "hsl(var(--color-border-subtle))",
        },
        text: {
          primary: "hsl(var(--color-text-primary))",
          secondary: "hsl(var(--color-text-secondary))",
          muted: "hsl(var(--color-text-muted))",
        },
        status: {
          success: "hsl(var(--color-status-success))",
          warning: "hsl(var(--color-status-warning))",
          error: "hsl(var(--color-status-error))",
          info: "hsl(var(--color-status-info))",
        },
        // shadcn/ui compatibility tokens
        foreground: "hsl(var(--color-text-primary))",
        card: {
          DEFAULT: "hsl(var(--color-surface))",
          foreground: "hsl(var(--color-text-primary))",
        },
        popover: {
          DEFAULT: "hsl(var(--color-surface-elevated))",
          foreground: "hsl(var(--color-text-primary))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-surface-elevated))",
          foreground: "hsl(var(--color-text-secondary))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-surface-elevated))",
          foreground: "hsl(var(--color-text-muted))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-status-error))",
          foreground: "hsl(var(--color-primary-foreground))",
        },
        input: "hsl(var(--color-border))",
        ring: "hsl(var(--color-primary))",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        dialog: "var(--shadow-dialog)",
      },
      spacing: {
        "nav-height": "var(--nav-height)",
        "header-height": "var(--header-height)",
      },
      keyframes: {
        latePulse: {
          "0%, 100%": { opacity: "1",   transform: "scale(1)",    backgroundColor: "hsl(var(--color-status-error))" },
          "40%":       { opacity: "0.7", transform: "scale(1.07)", backgroundColor: "hsl(var(--color-status-error) / 0.7)" },
        },
      },
      animation: {
        latePulse: "latePulse 0.8s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
