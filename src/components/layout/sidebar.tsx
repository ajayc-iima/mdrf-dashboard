"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { signOut, ROLE_LABELS } from "@/lib/auth"
import { getRoleTheme } from "@/lib/role-themes"
import { programAppName } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AppLogoSmall } from "@/components/shared/app-logo"
import { LogOut } from "lucide-react"
import { NAV, isActive } from "./nav-config"

export function Sidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  if (!profile || !profile.role) return null
  const nav = NAV[profile.role]
  const theme = getRoleTheme(profile.role)
  const appName = profile.program ? programAppName(profile.program) : "Research Fellows"

  return (
    <div className="flex h-screen flex-col" style={{ background: `linear-gradient(180deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)` }}>
      {/* App branding */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/[0.06]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.12]">
          <AppLogoSmall size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-white leading-tight truncate">{appName}</p>
          <p className="text-[11px] text-white/50 leading-tight">{theme.emoji} {ROLE_LABELS[profile.role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto py-4 px-3">
        <div className="space-y-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href)
            if (item.comingSoon) {
              return (
                <div key={item.href} className="flex items-center justify-between gap-1 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/25 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                    {item.label}
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-md">Soon</span>
                </div>
              )
            }
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                    "text-white/45 hover:bg-white/[0.08] hover:text-white/80",
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center transition-transform duration-200">
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-white/[0.15] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                    : "text-white/45 hover:bg-white/[0.08] hover:text-white/80",
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center transition-transform duration-200">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.06] transition-colors">
          <Avatar className="h-9 w-9 ring-2 ring-white/15">
            <AvatarFallback className="bg-white/[0.12] text-white/80 text-[11px] font-semibold">
              {profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white/90 truncate">{profile.name}</p>
            <p className="text-[11px] text-white/40">{ROLE_LABELS[profile.role]}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-lg p-2 text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all duration-200 active:scale-90"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
