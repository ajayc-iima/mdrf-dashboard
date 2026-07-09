"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "./sidebar"
import { MobileNav } from "./mobile-nav"
import { signOut, getRoleHome } from "@/lib/auth"
import { getRoleTheme } from "@/lib/role-themes"
import { LogOut } from "lucide-react"
import { AppLogoSmall } from "@/components/shared/app-logo"
import type { UserRole } from "@/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const theme = getRoleTheme(profile?.role ?? null)
  const pageTitle = profile?.program === "mlrf" ? "MLRF Connect" : "MDRF Connect"

  useEffect(() => {
    if (loading) return
    if (!user) { router.push("/"); return }
    if (profile && (profile.status === "pending" || profile.status === "rejected")) { router.push("/pending"); return }
    if (profile && profile.status === "approved" && !profile.role) { router.push("/pending"); return }
    if (profile && profile.role && profile.role !== "admin" && !allowedRoles.includes(profile.role)) { router.push(getRoleHome(profile.role)) }
  }, [user, profile, loading, router, allowedRoles])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--bg-page))]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--border))]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[hsl(var(--navy))] animate-spin" />
          </div>
          <p className="text-[13px] text-[hsl(var(--text-4))] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div data-role={profile.role} className="grid h-screen w-full md:grid-cols-[256px_1fr] bg-[hsl(var(--bg-page))]">
      <div className="hidden md:block"><Sidebar /></div>
      <div className="flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between bg-white border-b border-[hsl(var(--border))] px-4 h-14 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primary }}>
              <AppLogoSmall size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold" style={{ color: theme.primary }}>{pageTitle}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: theme.primaryLight, color: theme.primary }}>
                {theme.emoji} {theme.label}
              </span>
            </div>
          </div>
          <button onClick={() => signOut()} className="rounded-lg p-2 text-[hsl(var(--text-4))] hover:bg-[hsl(var(--bg-muted))] transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="container p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
