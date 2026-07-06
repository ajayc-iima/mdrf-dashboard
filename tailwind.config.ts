import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--border))",
        ring: "hsl(var(--gold))",
        background: "hsl(var(--bg-page))",
        foreground: "hsl(var(--text-1))",
        primary: { DEFAULT: "hsl(var(--navy))", foreground: "#fff" },
        secondary: { DEFAULT: "hsl(var(--bg-muted))", foreground: "hsl(var(--text-2))" },
        destructive: { DEFAULT: "hsl(var(--red))", foreground: "#fff" },
        muted: { DEFAULT: "hsl(var(--bg-muted))", foreground: "hsl(var(--text-3))" },
        accent: { DEFAULT: "hsl(var(--gold))", foreground: "#fff" },
        popover: { DEFAULT: "#fff", foreground: "hsl(var(--text-1))" },
        card: { DEFAULT: "#fff", foreground: "hsl(var(--text-1))" },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-md": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-sm": ["1.375rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,.04)",
        sm: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
        md: "0 4px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)",
        lg: "0 8px 24px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04)",
        card: "0 1px 3px rgba(0,0,0,.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,.08)",
      },
      borderRadius: {
        xl: "10px",
        "2xl": "14px",
        "3xl": "18px",
      },
      animation: {
        "fade-in": "staggerIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
}

export default config
