import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      /* CSS-variable-driven radius — multiplies to 0 in brutalist portfolio theme */
      borderRadius: {
        DEFAULT: "var(--radius)",
        none: "0",
        sm: "calc(var(--radius) * 0.5)",
        md: "var(--radius)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) * 1.333)",
        "2xl": "calc(var(--radius) * 1.667)",
        "3xl": "calc(var(--radius) * 2)",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      letterSpacing: {
        widest: "0.15em",
        ultrawide: "0.25em",
      },
      boxShadow: {
        "glass": "0 8px 32px -4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        "glass-dark": "0 8px 32px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px -2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 8px 32px -4px rgba(0,0,0,0.06)",
        "elevated": "0 20px 40px -12px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
