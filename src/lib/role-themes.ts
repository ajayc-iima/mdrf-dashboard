import type { UserRole } from "@/types"

export interface RoleTheme {
  primary: string        // Main color (hex)
  primaryLight: string   // Lighter shade for backgrounds
  primaryDark: string    // Darker shade for hover
  accent: string         // Accent color
  gradient: string       // CSS gradient
  label: string          // Display name
  emoji: string          // Role emoji
}

export const ROLE_THEMES: Record<UserRole, RoleTheme> = {
  fellow: {
    primary: "#0ea5e9",
    primaryLight: "#e0f2fe",
    primaryDark: "#0284c7",
    accent: "#38bdf8",
    gradient: "from-sky-500 to-cyan-500",
    label: "Fellow",
    emoji: "📚",
  },
  "data-scientist": {
    primary: "#6366f1",
    primaryLight: "#eef2ff",
    primaryDark: "#4f46e5",
    accent: "#818cf8",
    gradient: "from-indigo-500 to-violet-500",
    label: "Data Scientist",
    emoji: "📊",
  },
  srf: {
    primary: "#8b5cf6",
    primaryLight: "#f5f3ff",
    primaryDark: "#7c3aed",
    accent: "#a78bfa",
    gradient: "from-violet-500 to-purple-500",
    label: "Senior Research Fellow",
    emoji: "🎓",
  },
  "mdrf-coordinator": {
    primary: "#0369a1",
    primaryLight: "#e0f2fe",
    primaryDark: "#075985",
    accent: "#38bdf8",
    gradient: "from-sky-600 to-blue-600",
    label: "MDRF Coordinator",
    emoji: "🏛️",
  },
  "mlrf-coordinator": {
    primary: "#059669",
    primaryLight: "#ecfdf5",
    primaryDark: "#047857",
    accent: "#34d399",
    gradient: "from-emerald-500 to-teal-500",
    label: "MLRF Coordinator",
    emoji: "⚖️",
  },
  director: {
    primary: "#d97706",
    primaryLight: "#fffbeb",
    primaryDark: "#b45309",
    accent: "#fbbf24",
    gradient: "from-amber-500 to-orange-500",
    label: "Director",
    emoji: "👔",
  },
  admin: {
    primary: "#475569",
    primaryLight: "#f8fafc",
    primaryDark: "#334155",
    accent: "#94a3b8",
    gradient: "from-slate-500 to-slate-600",
    label: "Administrator",
    emoji: "⚙️",
  },
}

export function getRoleTheme(role: UserRole | null): RoleTheme {
  return ROLE_THEMES[role || "fellow"]
}
