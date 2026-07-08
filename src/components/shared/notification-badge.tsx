"use client"

import { useUnreadCount } from "@/hooks/useNotifications"
import { useAuth } from "@/hooks/useAuth"

export function NotificationBadge() {
  const { profile } = useAuth()
  const role = profile?.role as 'data-scientist' | 'srf' | null
  const count = useUnreadCount(role || 'data-scientist')

  if (!role || !['data-scientist', 'srf'].includes(role) || count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--red))] text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
