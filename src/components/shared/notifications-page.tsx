"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { useNotifications } from "@/hooks/useNotifications"
import { markNotificationRead, markNotificationResolved } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { Bell, Check, CheckCircle2, Clock, MessageSquare } from "lucide-react"
import type { UserRole } from "@/types"

interface Props {
  role: 'data-scientist' | 'srf'
  label: string
}

export function NotificationsPage({ role, label }: Props) {
  const { notifications, loading, refresh } = useNotifications(role)
  const [filter, setFilter] = useState<'all' | 'unread' | 'resolved'>('all')

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return n.status === 'unread'
    if (filter === 'resolved') return n.status === 'resolved'
    return true
  })

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    refresh()
  }

  async function handleResolve(id: string) {
    await markNotificationResolved(id)
    refresh()
  }

  const unreadCount = notifications.filter((n) => n.status === 'unread').length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Notifications"
        icon={<Bell className="h-6 w-6" />}
        description={`Help requests and messages from MDRF fellows`}
      />

      <div className="flex gap-2">
        {(["all", "unread", "resolved"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-[hsl(var(--red))] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-[hsl(var(--text-4))] mb-3" />
            <p className="text-[14px] text-[hsl(var(--text-3))]">No notifications yet</p>
            <p className="text-[12px] text-[hsl(var(--text-4))] mt-1">When fellows need help, you&apos;ll see their requests here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card key={n.id} className={n.status === 'unread' ? 'border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/[0.02]' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={n.status === 'unread' ? 'default' : n.status === 'resolved' ? 'success' : 'secondary'}>
                        {n.status}
                      </Badge>
                      <Badge variant="outline">{n.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <h3 className="text-[14px] font-semibold text-[hsl(var(--text-1))]">{n.title}</h3>
                    <p className="text-[13px] text-[hsl(var(--text-2))] mt-1">{n.message}</p>
                    <p className="text-[11px] text-[hsl(var(--text-4))] mt-2">
                      From {n.fromName} · {n.fromRole.replace(/-/g, ' ')} · {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {n.status === 'unread' && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkRead(n.id)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Mark Read
                      </Button>
                    )}
                    {n.status !== 'resolved' && (
                      <Button size="sm" onClick={() => handleResolve(n.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
