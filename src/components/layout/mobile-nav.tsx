"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { NAV_MOBILE, isActive } from "./nav-config"

export function MobileNav() {
  const pathname = usePathname()
  const { profile } = useAuth()

  if (!profile || !profile.role) return null
  const nav = NAV_MOBILE[profile.role]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-[hsl(var(--border))] safe-bottom-nav">
      <div className="flex">
        {nav.map((item) => {
          const active = isActive(pathname, item.href)
          const cls = cn(
            "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-all duration-200 relative",
            active ? "text-[hsl(var(--navy))]" : "text-[hsl(var(--text-4))] active:scale-95",
          )
          const inner = (
            <>
              {active && !item.external && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[hsl(var(--navy))]" />
              )}
              <span className={cn(
                "relative text-[18px] transition-transform duration-200",
                active && "scale-105"
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold leading-tight tracking-wide">{item.label}</span>
            </>
          )
          if (item.external) {
            return (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            )
          }
          return (
            <Link key={item.href} href={item.href} className={cls}>
              {inner}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
