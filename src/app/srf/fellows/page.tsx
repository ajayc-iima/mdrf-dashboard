"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getFellows } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { Users, AlertTriangle } from "lucide-react"
import type { UserProfile } from "@/types"

export default function SrfFellowsPage() {
  const { profile } = useAuth()
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    getFellows(profile.program).then((f) => {
      setFellows(f)
      setLoading(false)
    })
  }, [profile])

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="MDRF Fellows"
        icon={<Users className="h-6 w-6" />}
        description="View fellow activity and provide guidance"
      />

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
      ) : fellows.length === 0 ? (
        <EmptyState title="No fellows" description="Fellows will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fellows.map((f) => {
            const daysSinceActive = f.lastLogDate
              ? Math.floor((Date.now() - f.lastLogDate.getTime()) / 86400000)
              : null
            const isInactive = daysSinceActive === null || daysSinceActive > 3

            return (
              <Card key={f.id} className={isInactive ? "border-[hsl(var(--red))]/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[hsl(var(--text-1))]">{f.name}</p>
                      <p className="text-[12px] text-[hsl(var(--text-3))]">{f.district}</p>
                    </div>
                    {isInactive && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11px] text-[hsl(var(--text-4))]">
                    <span>{f.totalLogs || 0} logs</span>
                    <span>•</span>
                    <span>{f.lastLogDate ? formatRelativeTime(f.lastLogDate) : "Never active"}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
