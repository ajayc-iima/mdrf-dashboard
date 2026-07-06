"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { getWorkLogs } from "@/lib/firestore"
import { formatDate, formatWeekRange } from "@/lib/utils"
import { WORK_CATEGORIES, LOG_TYPES, type WorkCategory, type WorkLog } from "@/types"
import { getCurrentWeekKey } from "@/lib/utils"
import { ClipboardList } from "lucide-react"

export default function FellowHistory() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [weekFilter, setWeekFilter] = useState<string>("all")
  const [catFilter, setCatFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])

  useEffect(() => {
    if (!profile) return
    getWorkLogs({ fellowId: profile.id, limitCount: 200 }).then((data) => {
      setLogs(data)
      const weeks = Array.from(new Set(data.map((l) => l.weekKey))).sort().reverse()
      setAvailableWeeks(weeks)
      setLoading(false)
    })
  }, [profile])

  const filtered = logs.filter((l) => {
    if (weekFilter !== "all" && l.weekKey !== weekFilter) return false
    if (catFilter !== "all" && l.category !== catFilter) return false
    return true
  })

  // Group by week
  const grouped = filtered.reduce((acc, log) => {
    const k = log.weekKey
    if (!acc[k]) acc[k] = []
    acc[k].push(log)
    return acc
  }, {} as Record<string, typeof logs>)

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My History" icon={<ClipboardList className="h-6 w-6" />} description="All your work logs, grouped by week." />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={weekFilter} onValueChange={setWeekFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Week" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {availableWeeks.map((w) => (
              <SelectItem key={w} value={w}>{formatWeekRange(w)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {WORK_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState title="No logs found" description="Try adjusting the filters or start logging your work." />
      ) : (
        (Object.entries(grouped) as [string, WorkLog[]][])
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([week, weekLogs]) => (
            <Card key={week}>
              <CardHeader className="border-b border-[#E5E0DA]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{formatWeekRange(week)}</CardTitle>
                  <Badge variant="secondary">{weekLogs.length} logs</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2.5">
                  {weekLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 rounded-lg border border-[#E5E0DA] px-3 py-2.5 hover:bg-[#F8F6F3]/50 transition-colors">
                      <span className="text-lg shrink-0">
                        {WORK_CATEGORIES.find((c) => c.value === log.category)?.emoji || "📌"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#161618]">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#98989D]">{WORK_CATEGORIES.find((c) => c.value === log.category)?.label}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{log.type}</Badge>
                          <span className="text-xs text-[#98989D]">{formatDate(log.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  )
}
