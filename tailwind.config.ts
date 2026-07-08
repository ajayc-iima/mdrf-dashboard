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
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "Cabinet Grotesk", "Plus Jakarta Sans", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-md": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-sm": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,.03)",
        sm: "0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.02)",
        md: "0 4px 16px rgba(0,0,0,.05), 0 1px 3px rgba(0,0,0,.03)",
        lg: "0 12px 32px rgba(0,0,0,.06), 0 2px 6px rgba(0,0,0,.03)",
        xl: "0 20px 48px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04)",
        card: "0 1px 3px rgba(0,0,0,.03), 0 0 0 1px rgba(0,0,0,.02)",
        "card-hover": "0 8px 24px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.03)",
      },
      borderRadius: {
        xl: "10px",
        "2xl": "14px",
        "3xl": "20px",
      },
      animation: {
        "fade-in": "staggerIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
}

export default config
