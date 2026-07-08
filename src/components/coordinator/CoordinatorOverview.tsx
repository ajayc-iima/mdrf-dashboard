"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatCard } from "@/components/ui/stat-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { FellowDetail } from "@/components/shared/fellow-detail"
import { EmptyState } from "@/components/shared/empty-state"
import { getWeeklyCompliance, getAllTasks, getSupportRequests, type WeeklyCompliance as WC } from "@/lib/firestore"
import { downloadCSV, formatRelativeTime, getWorkloadStatus, getCurrentWeekKey, formatWeekRange } from "@/lib/utils"
import { WEEKLY_LOG_TARGET, PROGRAM_META } from "@/lib/constants"
import { DISTRICTS, CONSTITUENCIES, WORKLOAD_LABELS } from "@/types"
import type { Program, UserProfile } from "@/types"
import { Map, Download, Users, AlertTriangle, HelpCircle, Flame, Gauge } from "lucide-react"

interface Props { program: Program }

export function CoordinatorOverview({ program }: Props) {
  const [compliance, setCompliance] = useState<WC[]>([])
  const [openRequests, setOpenRequests] = useState<any[]>([])
  const [stuckTasks, setStuckTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFellow, setSelectedFellow] = useState<UserProfile | null>(null)
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const weekKey = getCurrentWeekKey()

  const meta = PROGRAM_META[program]
  const isMDRF = program === "mdrf"
  const locationOptions = isMDRF ? [...DISTRICTS] : [...CONSTITUENCIES]

  useEffect(() => { loadData() }, [program])

  async function loadData() {
    setLoading(true)
    const [c, reqs, tasks] = await Promise.all([
      getWeeklyCompliance(weekKey, program, WEEKLY_LOG_TARGET),
      getSupportRequests({ program, status: "open" }),
      getAllTasks(),
    ])
    setCompliance(c)
    setOpenRequests(reqs)
    setStuckTasks(tasks.filter((t) => t.status === "stuck"))
    setLoading(false)
  }

  const filtered = locationFilter === "all"
    ? compliance
    : compliance.filter((c) =>
        isMDRF ? c.fellow.district === locationFilter : c.fellow.constituencies?.includes(locationFilter)
      )

  const metCount = compliance.filter((c) => c.metTarget).length
  const totalCount = compliance.length
  const complianceRate = totalCount ? Math.round((metCount / totalCount) * 100) : 0
  const silentFellows = compliance.filter((c) => {
    if (!c.fellow.lastLogDate) return true
    return (Date.now() - c.fellow.lastLogDate.getTime()) / 86400000 > 3
  })

  function handleExport() {
    const data = filtered.map((c) => ({
      Name: c.fellow.name,
      District: c.fellow.district,
      Constituencies: c.fellow.constituencies?.join(", ") || "",
      "Week Logs": c.logCount,
      "Met Target": c.metTarget ? "Yes" : "No",
      Workload: c.pressure ? WORKLOAD_LABELS[c.pressure] : "Not declared",
      "Last Active": c.fellow.lastLogDate ? formatRelativeTime(c.fellow.lastLogDate) : "Never",
      Streak: c.fellow.streak || 0,
      "Total Logs": c.fellow.totalLogs || 0,
    }))
    downloadCSV(data, `${program}-compliance-${weekKey}`)
  }

  if (loading) {
    return (
      <div className="space-y-6 stagger-children">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}
      </div>
    )
  }

  if (selectedFellow) {
    return (
      <div className="max-w-3xl">
        <FellowDetail fellow={selectedFellow} onClose={() => setSelectedFellow(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={`${meta.app} Overview`}
        icon={<Map className="h-6 w-6" />}
        description={`${meta.full} — Week of ${formatWeekRange(weekKey)}`}
        actions={<Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 stagger-children">
        <StatCard title="Fellows" value={totalCount} icon={<Users className="h-4 w-4" />} variant="default" />
        <StatCard title="Weekly Compliance" value={`${complianceRate}%`} icon={<Gauge className="h-4 w-4" />}
          variant={complianceRate >= 70 ? "success" : complianceRate >= 40 ? "accent" : "destructive"}
          description={`${metCount} of ${totalCount} met target`} />
        <StatCard title="Silent 3+ Days" value={silentFellows.length} icon={<AlertTriangle className="h-4 w-4" />}
          variant={silentFellows.length > 0 ? "destructive" : "success"} />
        <StatCard title="Open Requests" value={openRequests.length} icon={<HelpCircle className="h-4 w-4" />} variant="default" />
      </div>

      <Select value={locationFilter} onValueChange={setLocationFilter}>
        <SelectTrigger className="w-64">
          <Map className="mr-1.5 h-4 w-4 text-[hsl(var(--text-3))]" />
          <SelectValue placeholder="All locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {isMDRF ? "Districts" : "Constituencies"}</SelectItem>
          {locationOptions.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
        </SelectContent>
      </Select>

      <Card>
        <CardHeader className="border-b border-[hsl(var(--border))]">
          <CardTitle>Fellows — Weekly Compliance</CardTitle>
          <CardDescription>{filtered.length} fellows · Target: {WEEKLY_LOG_TARGET} logs/week</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--text-4))]">
                  <th className="px-4 py-3">Fellow</th>
                  <th className="px-4 py-3">{isMDRF ? "District" : "Constituency"}</th>
                  <th className="px-4 py-3">Week Logs</th>
                  <th className="px-4 py-3">Workload</th>
                  <th className="px-4 py-3">Streak</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filtered.map((c) => {
                  const f = c.fellow
                  const status = getWorkloadStatus(f.lastLogDate)
                  const loc = isMDRF ? f.district : f.constituencies?.join(", ") || "—"
                  return (
                    <tr key={f.id} className="hover:bg-[hsl(var(--bg-muted))]/50 transition-colors cursor-pointer" onClick={() => setSelectedFellow(f)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8"><AvatarFallback className="bg-[hsl(var(--bg-muted))] text-[hsl(var(--text-2))] text-[10px] font-semibold">
                            {f.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback></Avatar>
                          <span className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{loc}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[13px] font-bold ${c.metTarget ? "text-[hsl(var(--green))]" : "text-[hsl(var(--red))]"}`}>{c.logCount}</span>
                        <span className="text-[11px] text-[hsl(var(--text-3))]">/{WEEKLY_LOG_TARGET}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.pressure && <Badge variant={c.pressure === "over" ? "destructive" : c.pressure === "under" ? "warning" : "success"} className="text-[10px]">{WORKLOAD_LABELS[c.pressure]}</Badge>}
                      </td>
                      <td className="px-4 py-3">{f.streak > 0 && <span className="flex items-center gap-1 text-[13px]"><Flame className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />{f.streak}d</span>}</td>
                      <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{f.lastLogDate ? formatRelativeTime(f.lastLogDate) : "Never"}</td>
                      <td className="px-4 py-3"><Badge variant={status === "green" ? "success" : status === "yellow" ? "warning" : "destructive"}>
                        {status === "green" ? "Active" : status === "yellow" ? "Slowing" : "Silent"}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState title="No fellows" description="No fellows assigned to this location." />}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-[hsl(var(--red))]" />Stuck Tasks</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-64 overflow-auto">
              {stuckTasks.length === 0 ? <p className="py-4 text-center text-[13px] text-[hsl(var(--text-3))]">No stuck tasks</p> :
                stuckTasks.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--red))]/[0.12] bg-[hsl(var(--red))]/[0.02] px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--red))] shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{t.title}</p><p className="text-[11px] text-[hsl(var(--text-3))]">{t.fellowName} · {isMDRF ? t.district : "—"}</p></div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="h-4 w-4" />Open Support Requests</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-64 overflow-auto">
              {openRequests.length === 0 ? <p className="py-4 text-center text-[13px] text-[hsl(var(--text-3))]">No open requests</p> :
                openRequests.slice(0, 10).map((r) => (
                  <div key={r.id} className={`rounded-xl border p-3 ${r.urgency === "high" ? "border-[hsl(var(--red))]/20 bg-[hsl(var(--red))]/[0.02]" : "border-[hsl(var(--border))]"}`}>
                    <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{r.fellowName}</span>
                      <Badge variant={r.urgency === "high" ? "destructive" : r.urgency === "medium" ? "warning" : "secondary"}>{r.urgency}</Badge></div>
                    <p className="mt-1 text-[13px] text-[hsl(var(--text-2))]">{r.description}</p>
                    <p className="mt-1 text-[11px] text-[hsl(var(--text-3))]">{isMDRF ? r.district : "—"} · {formatRelativeTime(r.createdAt)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
