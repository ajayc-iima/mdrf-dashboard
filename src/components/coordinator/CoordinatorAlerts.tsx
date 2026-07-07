"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { getSupportRequests, getAllTasks, getFellows } from "@/lib/firestore"
import { updateSupportStatus } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { PROGRAM_META } from "@/lib/constants"
import { SUPPORT_CATEGORIES } from "@/types"
import type { Program } from "@/types"
import { AlertTriangle, Volume2, HelpCircle, ClipboardList, CheckCircle2, ArrowRight } from "lucide-react"

interface Props { program: Program }

export function CoordinatorAlerts({ program }: Props) {
  const [requests, setRequests] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [fellows, setFellows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const meta = PROGRAM_META[program]

  useEffect(() => { loadData() }, [program])

  async function loadData() {
    setLoading(true)
    const [r, t, f] = await Promise.all([
      getSupportRequests({ program }),
      getAllTasks(),
      getFellows(program),
    ])
    setRequests(r)
    setTasks(t)
    setFellows(f)
    setLoading(false)
  }

  const silentFellows = fellows.filter((f) => {
    if (!f.lastLogDate) return true
    return (Date.now() - f.lastLogDate.getTime()) / 86400000 > 3
  })
  const stuckTasks = tasks.filter((t) => t.status === "stuck")
  const urgentRequests = requests.filter((r) => r.status === "open" && r.urgency === "high")
  const openRequests = requests.filter((r) => r.status === "open")

  async function resolveRequest(id: string) {
    await updateSupportStatus(id, "in_progress")
    loadData()
  }

  if (loading) {
    return (
      <div className="space-y-6 stagger-children">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={`${meta.app} Alerts`} icon={<AlertTriangle className="h-6 w-6" />} description={`${meta.full} — issues needing attention`} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 stagger-children">
        <StatCard title="Silent Fellows" value={silentFellows.length} icon={<Volume2 className="h-4 w-4" />}
          variant={silentFellows.length > 0 ? "destructive" : "success"} />
        <StatCard title="Stuck Tasks" value={stuckTasks.length} icon={<AlertTriangle className="h-4 w-4 text-[hsl(var(--red))]" />}
          variant={stuckTasks.length > 0 ? "destructive" : "success"} />
        <StatCard title="Urgent Requests" value={urgentRequests.length} icon={<HelpCircle className="h-4 w-4 text-[hsl(var(--red))]" />}
          variant={urgentRequests.length > 0 ? "destructive" : "success"} />
        <StatCard title="Open Requests" value={openRequests.length} icon={<ClipboardList className="h-4 w-4" />} variant="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Silent Fellows</CardTitle>
            <CardDescription>No activity for 3+ days</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-72 overflow-auto">
              {silentFellows.length === 0 ? <p className="py-4 text-center text-sm text-[hsl(var(--text-3))]">All fellows are active! 🎉</p> :
                silentFellows.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--red))]/[0.12] bg-[hsl(var(--red))]/[0.02] px-3 py-2.5">
                    <div><p className="text-sm font-medium text-[hsl(var(--text-1))]">{f.name}</p><p className="text-xs text-[hsl(var(--text-3))]">{f.program === "mlrf" ? (f.constituencies?.join(", ") || "—") : f.district}</p></div>
                    <p className="text-sm text-[hsl(var(--red))] font-medium">{f.lastLogDate ? formatRelativeTime(f.lastLogDate) : "Never"}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[hsl(var(--red))]" /> Stuck Tasks</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-72 overflow-auto">
              {stuckTasks.length === 0 ? <p className="py-4 text-center text-sm text-[hsl(var(--text-3))]">No stuck tasks</p> :
                stuckTasks.map((t) => (
                  <div key={t.id} className="rounded-lg border border-[hsl(var(--red))]/[0.12] bg-[hsl(var(--red))]/[0.02] px-3 py-2.5">
                    <p className="text-sm font-medium text-[hsl(var(--text-1))]">{t.title}</p>
                    <p className="text-xs text-[hsl(var(--text-3))]">{t.fellowName} · {program === "mlrf" ? "—" : t.district}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> All Open Requests</CardTitle>
          <CardDescription>{openRequests.length} pending</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2 max-h-96 overflow-auto">
            {openRequests.length === 0 ? <p className="py-4 text-center text-sm text-[hsl(var(--text-3))]">No open requests</p> :
              openRequests.map((r) => (
                <div key={r.id} className={`rounded-lg border p-3 ${r.urgency === "high" ? "border-[hsl(var(--red))]/20 bg-[hsl(var(--red))]/[0.02]" : "border-[hsl(var(--border))]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[hsl(var(--text-1))]">{r.fellowName}</span>
                        <Badge variant="secondary" className="text-[10px]">{SUPPORT_CATEGORIES.find((c) => c.value === r.category)?.label}</Badge>
                        <Badge variant={r.urgency === "high" ? "destructive" : r.urgency === "medium" ? "warning" : "secondary"}>{r.urgency}</Badge>
                      </div>
                      <p className="text-sm text-[hsl(var(--text-2))]">{r.description}</p>
                      <p className="text-xs text-[hsl(var(--text-3))]">{r.program === "mlrf" ? "—" : r.district} · {formatRelativeTime(r.createdAt)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => resolveRequest(r.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Take
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
