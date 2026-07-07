"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { FellowDetail } from "@/components/shared/fellow-detail"
import { EmptyState } from "@/components/shared/empty-state"
import { getWeeklyCompliance, getFellows, getWeeklyTrend, getSupportRequests, type WeeklyCompliance as WC } from "@/lib/firestore"
import { formatRelativeTime, getWorkloadStatus, getCurrentWeekKey, formatWeekRange } from "@/lib/utils"
import { WEEKLY_LOG_TARGET, PROGRAM_META, CHART_COLORS } from "@/lib/constants"
import type { Program, UserProfile } from "@/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { BarChart3, Building2, MapPin, Users, TrendingUp, AlertTriangle, HelpCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DirectorOverviewPage() {
  const [mdrfCompliance, setMdrfCompliance] = useState<WC[]>([])
  const [mlrfCompliance, setMlrfCompliance] = useState<WC[]>([])
  const [mdrfTrend, setMdrfTrend] = useState<{ weekKey: string; rate: number }[]>([])
  const [mlrfTrend, setMlrfTrend] = useState<{ weekKey: string; rate: number }[]>([])
  const [mdrfRequests, setMdrfRequests] = useState<any[]>([])
  const [mlrfRequests, setMlrfRequests] = useState<any[]>([])
  const [selectedFellow, setSelectedFellow] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const weekKey = getCurrentWeekKey()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [mc, lc, mt, lt, mr, lr] = await Promise.all([
      getWeeklyCompliance(weekKey, "mdrf", WEEKLY_LOG_TARGET),
      getWeeklyCompliance(weekKey, "mlrf", WEEKLY_LOG_TARGET),
      getWeeklyTrend("mdrf", WEEKLY_LOG_TARGET, 8),
      getWeeklyTrend("mlrf", WEEKLY_LOG_TARGET, 8),
      getSupportRequests({ program: "mdrf", status: "open" }),
      getSupportRequests({ program: "mlrf", status: "open" }),
    ])
    setMdrfCompliance(mc)
    setMlrfCompliance(lc)
    setMdrfTrend(mt)
    setMlrfTrend(lt)
    setMdrfRequests(mr)
    setMlrfRequests(lr)
    setLoading(false)
  }

  const mdrfMet = mdrfCompliance.filter((c) => c.metTarget).length
  const mlrfMet = mlrfCompliance.filter((c) => c.metTarget).length
  const mdrfRate = mdrfCompliance.length ? Math.round((mdrfMet / mdrfCompliance.length) * 100) : 0
  const mlrfRate = mlrfCompliance.length ? Math.round((mlrfMet / mlrfCompliance.length) * 100) : 0
  const totalFellows = mdrfCompliance.length + mlrfCompliance.length
  const totalMet = mdrfMet + mlrfMet
  const overallRate = totalFellows ? Math.round((totalMet / totalFellows) * 100) : 0

  const mdrfSilent = mdrfCompliance.filter((c) => !c.fellow.lastLogDate || (Date.now() - c.fellow.lastLogDate.getTime()) / 86400000 > 3).length
  const mlrfSilent = mlrfCompliance.filter((c) => !c.fellow.lastLogDate || (Date.now() - c.fellow.lastLogDate.getTime()) / 86400000 > 3).length

  // District breakdown for MDRF
  const districtData = mdrfCompliance.reduce((acc, c) => {
    const d = c.fellow.district
    if (!acc[d]) acc[d] = { district: d, total: 0, met: 0 }
    acc[d].total++
    if (c.metTarget) acc[d].met++
    return acc
  }, {} as Record<string, { district: string; total: number; met: number }>)
  const districtChart = Object.values(districtData).map((d) => ({
    name: d.district.length > 12 ? d.district.slice(0, 12) + "..." : d.district,
    fullName: d.district,
    compliance: d.total > 0 ? Math.round((d.met / d.total) * 100) : 0,
    fellows: d.total,
  })).sort((a, b) => b.compliance - a.compliance)

  // Program comparison pie
  const pieData = [
    { name: "MDRF", value: mdrfCompliance.length, color: CHART_COLORS[0] },
    { name: "MLRF", value: mlrfCompliance.length, color: CHART_COLORS[1] },
  ]

  // Trend data merged
  const trendMap = new Map<string, { mdrf: number; mlrf: number }>()
  for (const t of mdrfTrend) {
    const existing = trendMap.get(t.weekKey) || { mdrf: 0, mlrf: 0 }
    trendMap.set(t.weekKey, { ...existing, mdrf: t.rate })
  }
  for (const t of mlrfTrend) {
    const existing = trendMap.get(t.weekKey) || { mdrf: 0, mlrf: 0 }
    trendMap.set(t.weekKey, { ...existing, mlrf: t.rate })
  }
  const trendChart = Array.from(trendMap.entries()).map(([weekKey, rates]) => ({
    week: weekKey.replace(/^\d{4}-/, ""),
    MDRF: rates.mdrf,
    MLRF: rates.mlrf,
  }))

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
        title="Director Overview"
        icon={<BarChart3 className="h-6 w-6" />}
        description={`Big picture across MDRF & MLRF — Week of ${formatWeekRange(weekKey)}`}
      />

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 stagger-children">
        <StatCard title="Total Fellows" value={totalFellows} icon={<Users className="h-4 w-4" />} variant="default" />
        <StatCard title="Overall Compliance" value={`${overallRate}%`} icon={<TrendingUp className="h-4 w-4" />}
          variant={overallRate >= 70 ? "success" : overallRate >= 40 ? "accent" : "destructive"}
          description={`${totalMet} of ${totalFellows} met target`} />
        <StatCard title="Silent 3+ Days" value={mdrfSilent + mlrfSilent} icon={<AlertTriangle className="h-4 w-4" />}
          variant={mdrfSilent + mlrfSilent > 0 ? "destructive" : "success"} />
        <StatCard title="Open Requests" value={mdrfRequests.length + mlrfRequests.length} icon={<HelpCircle className="h-4 w-4" />}
          variant={mdrfRequests.length + mlrfRequests.length > 0 ? "destructive" : "default"} />
      </div>

      {/* Program comparison */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="text-base">Programme Split</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {(["mdrf", "mlrf"] as Program[]).map((p) => {
                const meta = PROGRAM_META[p]
                const comp = p === "mdrf" ? mdrfCompliance : mlrfCompliance
                const rate = p === "mdrf" ? mdrfRate : mlrfRate
                const silent = p === "mdrf" ? mdrfSilent : mlrfSilent
                return (
                  <Link key={p} href={`/${p === "mdrf" ? "mdrf" : "mlrf"}-coordinator`} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] px-3 py-2 hover:bg-[hsl(var(--bg-muted))] transition-colors">
                    <div className="flex items-center gap-2">
                      {p === "mdrf" ? <Building2 className="h-4 w-4 text-[hsl(var(--text-3))]" /> : <MapPin className="h-4 w-4 text-[hsl(var(--green))]" />}
                      <span className="text-sm font-medium text-[hsl(var(--text-1))]">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${rate >= 70 ? "text-[hsl(var(--green))]" : "text-[hsl(var(--text-2))]"}`}>{rate}%</span>
                      {silent > 0 && <Badge variant="destructive" className="text-[10px]">{silent} silent</Badge>}
                      <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--text-3))]" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weekly trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="text-base">8-Week Compliance Trend</CardTitle>
            <CardDescription>% of fellows meeting weekly target</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="MDRF" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="MLRF" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* District heat map (MDRF) */}
      {districtChart.length > 0 && (
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-[hsl(var(--text-2))]" /> MDRF District Compliance
            </CardTitle>
            <CardDescription>This week&apos;s compliance rate by district</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={Math.max(200, districtChart.length * 32)}>
              <BarChart data={districtChart} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: any, name: string, props: any) => [`${v}% (${props.payload.fellows} fellows)`, props.payload.fullName]} />
                <Bar dataKey="compliance" radius={[0, 4, 4, 0]}>
                  {districtChart.map((entry, i) => (
                    <Cell key={i} fill={entry.compliance >= 70 ? CHART_COLORS[1] : entry.compliance >= 40 ? CHART_COLORS[2] : CHART_COLORS[3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Silent fellows across both programs */}
      {(mdrfSilent + mlrfSilent > 0) && (
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--red))]" /> Silent Fellows (3+ days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {[...mdrfCompliance, ...mlrfCompliance]
                .filter((c) => !c.fellow.lastLogDate || (Date.now() - c.fellow.lastLogDate.getTime()) / 86400000 > 3)
                .map((c) => (
                  <div key={c.fellow.id} onClick={() => setSelectedFellow(c.fellow)} className="flex items-center justify-between rounded-lg border border-[hsl(var(--red))]/[0.12] bg-[hsl(var(--red))]/[0.02] px-3 py-2 cursor-pointer hover:bg-[hsl(var(--red))]/[0.06] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--text-1))]">{c.fellow.name}</p>
                      <p className="text-xs text-[hsl(var(--text-3))]">{c.fellow.district} · {PROGRAM_META[c.fellow.program].label}</p>
                    </div>
                    <p className="text-xs text-[hsl(var(--red))] font-medium">{c.fellow.lastLogDate ? formatRelativeTime(c.fellow.lastLogDate) : "Never"}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
