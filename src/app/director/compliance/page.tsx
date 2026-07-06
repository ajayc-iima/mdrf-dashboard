"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { FellowDetail } from "@/components/shared/fellow-detail"
import { EmptyState } from "@/components/shared/empty-state"
import { getWeeklyCompliance, type WeeklyCompliance as WC } from "@/lib/firestore"
import { downloadCSV, formatRelativeTime, getWorkloadStatus, getCurrentWeekKey, formatWeekRange } from "@/lib/utils"
import { WEEKLY_LOG_TARGET, PROGRAM_META } from "@/lib/constants"
import { WORKLOAD_LABELS } from "@/types"
import type { Program, UserProfile } from "@/types"
import { ClipboardList, Download, Users, Gauge, AlertTriangle, Flame } from "lucide-react"

export default function DirectorCompliancePage() {
  const [mdrfCompliance, setMdrfCompliance] = useState<WC[]>([])
  const [mlrfCompliance, setMlrfCompliance] = useState<WC[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFellow, setSelectedFellow] = useState<UserProfile | null>(null)
  const [programFilter, setProgramFilter] = useState<"all" | Program>("all")
  const weekKey = getCurrentWeekKey()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [mc, lc] = await Promise.all([
      getWeeklyCompliance(weekKey, "mdrf", WEEKLY_LOG_TARGET),
      getWeeklyCompliance(weekKey, "mlrf", WEEKLY_LOG_TARGET),
    ])
    setMdrfCompliance(mc)
    setMlrfCompliance(lc)
    setLoading(false)
  }

  const all = programFilter === "all"
    ? [...mdrfCompliance, ...mlrfCompliance]
    : programFilter === "mdrf" ? mdrfCompliance : mlrfCompliance

  const metCount = all.filter((c) => c.metTarget).length
  const totalCount = all.length
  const complianceRate = totalCount ? Math.round((metCount / totalCount) * 100) : 0

  function handleExport() {
    const data = all.map((c) => ({
      Name: c.fellow.name,
      Program: PROGRAM_META[c.fellow.program].label,
      District: c.fellow.district,
      "Week Logs": c.logCount,
      "Met Target": c.metTarget ? "Yes" : "No",
      Workload: c.pressure ? WORKLOAD_LABELS[c.pressure] : "Not declared",
      "Last Active": c.fellow.lastLogDate ? formatRelativeTime(c.fellow.lastLogDate) : "Never",
      Streak: c.fellow.streak || 0,
    }))
    downloadCSV(data, `director-compliance-${weekKey}`)
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
        title="Compliance Overview"
        icon={<ClipboardList className="h-6 w-6" />}
        description={`Week of ${formatWeekRange(weekKey)} · Target: ${WEEKLY_LOG_TARGET} logs/week`}
        actions={<Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" /> Export</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 stagger-children">
        <StatCard title="Total Fellows" value={totalCount} icon={<Users className="h-4 w-4" />} variant="default" />
        <StatCard title="Compliance Rate" value={`${complianceRate}%`} icon={<Gauge className="h-4 w-4" />}
          variant={complianceRate >= 70 ? "success" : complianceRate >= 40 ? "accent" : "destructive"}
          description={`${metCount} of ${totalCount} met target`} />
        <StatCard title="Below Target" value={totalCount - metCount} icon={<AlertTriangle className="h-4 w-4" />}
          variant={totalCount - metCount > 0 ? "destructive" : "success"} />
      </div>

      <div className="flex gap-2">
        {(["all", "mdrf", "mlrf"] as const).map((p) => (
          <Button key={p} variant={programFilter === p ? "default" : "outline"} size="sm" onClick={() => setProgramFilter(p)}>
            {p === "all" ? "All Programs" : PROGRAM_META[p].label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-[#E5E0DA]">
          <CardTitle>Fellows — Weekly Compliance</CardTitle>
          <CardDescription>{all.length} fellows</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E0DA] text-left text-xs font-medium uppercase tracking-wider text-[#98989D]">
                  <th className="px-4 py-3">Fellow</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Week Logs</th>
                  <th className="px-4 py-3">Workload</th>
                  <th className="px-4 py-3">Streak</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0DA]">
                {all.map((c) => {
                  const f = c.fellow
                  const status = getWorkloadStatus(f.lastLogDate)
                  return (
                    <tr key={f.id} className="hover:bg-[#F8F6F3]/50 transition-colors cursor-pointer" onClick={() => setSelectedFellow(f)}>
                      <td className="px-4 py-3 text-sm font-medium text-[#161618]">{f.name}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{PROGRAM_META[f.program].label}</Badge></td>
                      <td className="px-4 py-3 text-sm text-[#98989D]">{f.program === "mlrf" ? (f.constituencies?.join(", ") || "—") : f.district}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${c.metTarget ? "text-[#1A8A3A]" : "text-[#FF453A]"}`}>{c.logCount}</span>
                        <span className="text-xs text-[#98989D]">/{WEEKLY_LOG_TARGET}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.pressure && <Badge variant={c.pressure === "over" ? "destructive" : c.pressure === "under" ? "warning" : "success"} className="text-[10px]">{WORKLOAD_LABELS[c.pressure]}</Badge>}
                      </td>
                      <td className="px-4 py-3">{f.streak > 0 && <span className="flex items-center gap-1 text-sm"><Flame className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />{f.streak}d</span>}</td>
                      <td className="px-4 py-3 text-sm text-[#98989D]">{f.lastLogDate ? formatRelativeTime(f.lastLogDate) : "Never"}</td>
                      <td className="px-4 py-3"><Badge variant={status === "green" ? "success" : status === "yellow" ? "warning" : "destructive"}>
                        {status === "green" ? "Active" : status === "yellow" ? "Slowing" : "Silent"}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {all.length === 0 && <EmptyState title="No fellows" description="No fellows found for this filter." />}
        </CardContent>
      </Card>
    </div>
  )
}
