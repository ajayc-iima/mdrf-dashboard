"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { signOut, ROLE_LABELS } from "@/lib/auth"
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
  const appName = profile.program ? programAppName(profile.program) : "Research Fellows"

  return (
    <div className="sidebar-shell flex h-screen flex-col">
      {/* App branding */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-[hsl(220_38%_24%)]">
        <AppLogoSmall size={24} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight truncate">{appName}</p>
          <p className="text-[11px] text-[hsl(var(--gold-light))] leading-tight">{ROLE_LABELS[profile.role]}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto py-3 px-3">
        <div className="space-y-0.5">
          {nav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-[hsl(var(--gold))/0.15] text-[hsl(var(--gold))] sidebar-nav-active"
                    : "text-[hsl(var(--text-4))] hover:bg-[hsl(220_30%_25%)] hover:text-white hover:translate-x-0.5",
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center text-[14px] transition-transform duration-200">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-[hsl(220_38%_24%)] p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 ring-2 ring-[hsl(var(--gold))/0.3] ring-offset-1 ring-offset-[hsl(var(--navy-dark))]">
            <AvatarFallback className="bg-[hsl(var(--navy-light))] text-white text-[11px] font-semibold">
              {profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{profile.name}</p>
            <p className="text-[11px] text-[hsl(var(--text-4))]">{ROLE_LABELS[profile.role]}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-md p-1.5 text-[hsl(var(--text-4))] hover:text-white hover:bg-[hsl(220_30%_25%)] transition-all duration-200 active:scale-90"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
