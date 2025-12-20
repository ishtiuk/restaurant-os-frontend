import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        sans: ['Inter', 'Noto Sans Bengali', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Noto Sans Bengali', 'sans-serif'],
        bengali: ['Noto Sans Bengali', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: {
          DEFAULT: "hsl(38 95% 55%)",
          light: "hsl(45 90% 60%)",
          dark: "hsl(35 90% 45%)",
        },
        coral: {
          DEFAULT: "hsl(18 75% 45%)",
          light: "hsl(25 80% 55%)",
          dark: "hsl(15 70% 35%)",
        },
        mint: {
          DEFAULT: "hsl(158 65% 45%)",
          light: "hsl(165 60% 55%)",
          dark: "hsl(155 60% 35%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(38 95% 55% / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(38 95% 55% / 0.6), 0 0 60px hsl(38 95% 55% / 0.3)" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "hsl(251 146 60 / 0.2)", boxShadow: "0 0 0 0 hsl(251 146 60 / 0.4)" },
          "50%": { borderColor: "hsl(251 146 60 / 0.4)", boxShadow: "0 0 0 4px hsl(251 146 60 / 0.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "pulse-border": "pulse-border 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, hsl(38 95% 55%), hsl(45 90% 60%))",
        "gradient-coral": "linear-gradient(135deg, hsl(18 75% 45%), hsl(25 80% 55%))",
        "gradient-mint": "linear-gradient(135deg, hsl(158 65% 45%), hsl(165 60% 55%))",
        "gradient-hero": "linear-gradient(135deg, hsl(38 95% 55%), hsl(18 75% 50%))",
        "gradient-dark": "linear-gradient(180deg, hsl(220 20% 6%), hsl(220 18% 10%))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
