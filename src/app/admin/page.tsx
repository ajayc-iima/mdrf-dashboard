"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import {
  getAllUsers, getSupportRequests, getDistrictStats, getPendingUsers, approveUser, rejectUser,
} from "@/lib/firestore"
import { ROLE_LABELS } from "@/lib/auth"
import { formatRelativeTime } from "@/lib/utils"
import { ASSIGNABLE_ROLES, DISTRICTS, CONSTITUENCIES, type Program, type UserProfile, type UserRole } from "@/types"
import { Users, Activity, FileText, HelpCircle, AlertTriangle, Trophy, Shield, Check, X, Building2, MapPin } from "lucide-react"

interface ApprovalDraft { role: UserRole; program: Program; district: string; constituencies: string[] }

export default function AdminDashboard() {
  const [dashboardType, setDashboardType] = useState<Program>("mdrf")
  const [fellows, setFellows] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<Record<string, any>>({})
  const [requests, setRequests] = useState<any[]>([])
  const [pending, setPending] = useState<UserProfile[]>([])
  const [drafts, setDrafts] = useState<Record<string, ApprovalDraft>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [dashboardType])

  async function loadData() {
    setLoading(true)
    const [users, districtStats, reqs, pendingUsers] = await Promise.all([
      getAllUsers(dashboardType), getDistrictStats(dashboardType), getSupportRequests(), getPendingUsers(),
    ])
    setFellows(users); setStats(districtStats); setRequests(reqs); setPending(pendingUsers)
    const next: Record<string, ApprovalDraft> = {}
    for (const p of pendingUsers) next[p.id] = { role: "fellow", program: dashboardType, district: DISTRICTS[0], constituencies: [] }
    setDrafts(next)
    setLoading(false)
  }

  const totalLogs = Object.values(stats).reduce((acc: number, d: any) => acc + (d.totalLogs || 0), 0)
  const activeFellows = Object.values(stats).reduce((acc: number, d: any) => acc + (d.activeFellows || 0), 0)
  const openRequests = requests.filter((r) => r.status === "open")
  const NON_FELLOW_ROLES = ["admin", "director", "mdrf-coordinator", "mlrf-coordinator", "coordinator"]
  const fellowOnly = fellows.filter((f) => !NON_FELLOW_ROLES.includes(f.role || ""))
  const silentFellows = fellowOnly.filter((f) => !f.lastLogDate || (Date.now() - f.lastLogDate.getTime()) / 86400000 > 3)

  const districtSummary = Object.entries(stats)
    .map(([name, data]: [string, any]) => ({ name, logs: data.totalLogs || 0, active: data.activeFellows || 0, total: data.totalFellows || 0 }))
    .sort((a, b) => b.logs - a.logs)

  async function handleApprove(uid: string) {
    const draft = drafts[uid]
    if (!draft) return
    await approveUser(uid, draft.role, draft.program, draft.district, draft.constituencies)
    await loadData()
  }

  async function handleReject(uid: string) { await rejectUser(uid); await loadData() }

  function toggleConstituency(uid: string, c: string) {
    setDrafts((d) => {
      const current = d[uid]?.constituencies || []
      const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
      return { ...d, [uid]: { ...d[uid], constituencies: next } }
    })
  }

  if (loading) {
    return <div className="space-y-6 stagger-children">{[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />)}</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[hsl(var(--text-1))]">Admin Overview</h1>
        <p className="text-[14px] text-[hsl(var(--text-3))] mt-1">Programme oversight & account approvals</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setDashboardType("mdrf")}
          className={`flex-1 flex items-center gap-3 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-left transition-all duration-200 ${
            dashboardType === "mdrf"
              ? "bg-[hsl(var(--navy))] text-white shadow-md ring-2 ring-[hsl(var(--navy))]/30"
              : "bg-white text-[hsl(var(--text-2))] border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--navy))]/30 hover:bg-[hsl(var(--bg-muted))]"
          }`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dashboardType === "mdrf" ? "bg-white/15" : "bg-[hsl(var(--bg-muted))]"}`}>
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[13px]">MDRF</p>
            <p className={`text-[11px] ${dashboardType === "mdrf" ? "text-white/60" : "text-[hsl(var(--text-3))]"}`}>District Research Fellows</p>
          </div>
        </button>
        <button onClick={() => setDashboardType("mlrf")}
          className={`flex-1 flex items-center gap-3 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-left transition-all duration-200 ${
            dashboardType === "mlrf"
              ? "bg-[hsl(var(--green))] text-white shadow-md ring-2 ring-[hsl(var(--green))]"
              : "bg-white text-[hsl(var(--text-2))] border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--green))]/80 hover:bg-[hsl(var(--green))]/[0.06]"
          }`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dashboardType === "mlrf" ? "bg-white/15" : "bg-[hsl(var(--green))]/[0.12]"}`}>
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-[13px]">MLRF</p>
            <p className={`text-[11px] ${dashboardType === "mlrf" ? "text-white/60" : "text-[hsl(var(--text-3))]"}`}>Legislative Research Fellows</p>
          </div>
        </button>
      </div>

      <div id="approvals">
        <Card className="border-[hsl(var(--orange))]/20">
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[hsl(var(--orange))]" /> Pending Approvals</CardTitle>
            <CardDescription>{pending.length === 0 ? "No accounts waiting for approval" : `${pending.length} account${pending.length === 1 ? "" : "s"} awaiting a role assignment`}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {pending.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[hsl(var(--text-3))]">All caught up</p>
            ) : (
              <div className="space-y-4">
                {pending.map((p) => {
                  const draft = drafts[p.id]
                  const isMLRF = draft?.program === "mlrf"
                  return (
                    <div key={p.id} className="rounded-2xl border-2 border-[hsl(var(--border))] p-4 hover:bg-[hsl(var(--bg-muted))] transition-colors">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{p.name}</p>
                          <p className="truncate text-[11px] text-[hsl(var(--text-3))]">{p.email} &bull; requested {formatRelativeTime(p.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select value={draft?.role} onValueChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], role: v as UserRole } }))}>
                            <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>{ASSIGNABLE_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={draft?.program} onValueChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], program: v as Program, constituencies: [] } }))}>
                            <SelectTrigger className="h-9 w-28"><SelectValue placeholder="Program" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mdrf">MDRF</SelectItem>
                              <SelectItem value="mlrf">MLRF</SelectItem>
                            </SelectContent>
                          </Select>
                          {draft?.role === "fellow" && (
                            <Select value={draft?.district} onValueChange={(v) => setDrafts((d) => ({ ...d, [p.id]: { ...d[p.id], district: v } }))}>
                              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="District" /></SelectTrigger>
                              <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                          <Button size="sm" onClick={() => handleApprove(p.id)}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(p.id)}><X className="mr-1 h-4 w-4" /> Reject</Button>
                        </div>
                        {draft?.role === "fellow" && isMLRF && (
                          <div className="rounded-xl bg-[hsl(var(--green))]/[0.04] border border-[hsl(var(--green))]/15 p-3">
                            <p className="text-[11px] font-semibold text-[hsl(var(--green))] mb-2">Assign Constituencies</p>
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto">
                              {CONSTITUENCIES.map((c) => {
                                const selected = draft?.constituencies?.includes(c)
                                return (
                                  <button key={c} type="button" onClick={() => toggleConstituency(p.id, c)}
                                    className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all duration-150 ${
                                      selected ? "border-[hsl(var(--green))]/40 bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]" : "border-[hsl(var(--border))] bg-white text-[hsl(var(--text-3))] hover:border-[hsl(var(--green))]/30 hover:text-[hsl(var(--text-2))]"
                                    }`}>{selected ? "✓ " : ""}{c}</button>
                                )
                              })}
                            </div>
                            {draft?.constituencies?.length > 0 && <p className="mt-2 text-[11px] text-[hsl(var(--text-3))]">{draft.constituencies.length} constituenc{draft.constituencies.length === 1 ? "y" : "ies"} selected</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 stagger-children">
        <StatCard title={dashboardType === "mdrf" ? "MDRF Fellows" : "MLRF Fellows"} value={fellowOnly.length} icon={<Users className="h-4 w-4" />} variant="default" />
        <StatCard title="Active (7 days)" value={activeFellows} icon={<Activity className="h-4 w-4" />} variant="success" description={`${Math.round((activeFellows / Math.max(fellowOnly.length, 1)) * 100)}% of total`} />
        <StatCard title="Work Logs" value={totalLogs} icon={<FileText className="h-4 w-4" />} variant="accent" />
        <StatCard title="Open Issues" value={openRequests.length} icon={<HelpCircle className="h-4 w-4" />} variant={openRequests.length > 0 ? "destructive" : "default"} />
      </div>

      {silentFellows.length > 0 && (
        <div className="rounded-2xl border-2 border-[hsl(var(--orange))]/20 bg-[hsl(var(--orange))]/[0.03] p-4">
          <h3 className="flex items-center gap-2 text-[13px] font-bold text-[hsl(var(--orange))]"><AlertTriangle className="h-4 w-4" /> {silentFellows.length} Fellows Inactive (3+ days)</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {silentFellows.map((f) => <Badge key={f.id} variant="warning">{f.name} &mdash; {f.program === "mlrf" ? (f.constituencies?.join(", ") || "—") : f.district}</Badge>)}
          </div>
        </div>
      )}

      {dashboardType === "mdrf" ? (
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[hsl(var(--text-2))]" /> District Performance</CardTitle>
            <CardDescription>Fellow activity across Meghalaya districts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--text-4))]">
                    <th className="px-4 py-3">District</th><th className="px-4 py-3">Fellows</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Total Logs</th><th className="px-4 py-3">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {districtSummary.map((d) => (
                    <tr key={d.name} className="hover:bg-[hsl(var(--bg-muted))] transition-colors">
                      <td className="px-4 py-3 text-[13px] font-semibold text-[hsl(var(--text-1))]">{d.name}</td>
                      <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{d.total}</td>
                      <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{d.active}</td>
                      <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{d.logs}</td>
                      <td className="px-4 py-3">
                        <div className="h-2.5 w-full rounded-full bg-[hsl(var(--bg-muted))]">
                          <div className="h-2.5 rounded-full bg-[hsl(var(--green))] transition-all" style={{ width: `${d.total > 0 ? Math.round((d.active / d.total) * 100) : 0}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-[hsl(var(--green))]" /> Fellow Activity</CardTitle>
            <CardDescription>Individual fellow engagement across constituencies</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--text-4))]">
                    <th className="px-4 py-3">Fellow</th><th className="px-4 py-3">Constituencies</th><th className="px-4 py-3">Total Logs</th><th className="px-4 py-3">Streak</th><th className="px-4 py-3">Last Active</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {fellowOnly.sort((a, b) => (b.totalLogs || 0) - (a.totalLogs || 0)).map((f) => {
                    const status = f.lastLogDate ? (Date.now() - f.lastLogDate.getTime()) / 86400000 < 2 ? "active" : (Date.now() - f.lastLogDate.getTime()) / 86400000 < 4 ? "slowing" : "silent" : "silent"
                    const statusBadge = status === "active" ? "success" : status === "slowing" ? "warning" : "destructive"
                    return (
                      <tr key={f.id} className="hover:bg-[hsl(var(--bg-muted))] transition-colors">
                        <td className="px-4 py-3 text-[13px] font-semibold text-[hsl(var(--text-1))]">{f.name}</td>
                        <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{f.constituencies?.join(", ") || "—"}</td>
                        <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{f.totalLogs || 0}</td>
                        <td className="px-4 py-3">{f.streak > 0 ? <span className="text-[13px] font-medium text-[hsl(var(--orange))]">{f.streak}d</span> : <span className="text-[13px] text-[hsl(var(--text-3))]">—</span>}</td>
                        <td className="px-4 py-3 text-[13px] text-[hsl(var(--text-3))]">{f.lastLogDate ? formatRelativeTime(f.lastLogDate) : "Never"}</td>
                        <td className="px-4 py-3"><Badge variant={statusBadge as any}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-[hsl(var(--border))]">
            <CardTitle>Open Support Requests</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {requests.filter((r) => r.status !== "resolved").slice(0, 5).map((req) => (
                <div key={req.id} className="rounded-2xl border-2 border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--bg-muted))] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{req.fellowName}</span>
                    <Badge variant={req.urgency === "high" ? "destructive" : req.urgency === "medium" ? "warning" : "secondary"}>{req.urgency}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-[hsl(var(--text-3))]">{req.description}</p>
                </div>
              ))}
              {requests.filter((r) => r.status !== "resolved").length === 0 && <p className="py-4 text-center text-[13px] text-[hsl(var(--text-3))]">No open requests</p>}
            </div>
          </CardContent>
        </Card>

        {dashboardType === "mdrf" ? (
          <Card>
            <CardHeader className="border-b border-[hsl(var(--border))]">
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-[hsl(var(--orange))]" /> Top Performing Districts</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {districtSummary.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--bg-muted))] transition-colors">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold ${i === 0 ? "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))]" : "bg-[hsl(var(--bg-muted))] text-[hsl(var(--text-3))]"}`}>{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{d.name}</p>
                      <p className="text-[11px] text-[hsl(var(--text-3))]">{d.active}/{d.total} active fellows</p>
                    </div>
                    <span className="text-[13px] font-bold text-[hsl(var(--green))]">{d.logs} logs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b border-[hsl(var(--border))]">
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-[hsl(var(--orange))]" /> Top Performing Fellows</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {fellowOnly.sort((a, b) => (b.totalLogs || 0) - (a.totalLogs || 0)).slice(0, 5).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-2xl border-2 border-[hsl(var(--border))] p-3 hover:bg-[hsl(var(--bg-muted))] transition-colors">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-bold ${i === 0 ? "bg-[hsl(var(--orange))]/10 text-[hsl(var(--orange))]" : "bg-[hsl(var(--bg-muted))] text-[hsl(var(--text-3))]"}`}>{i + 1}</div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{f.name}</p>
                      <p className="text-[11px] text-[hsl(var(--text-3))]">{f.constituencies?.join(", ") || "—"} · {f.totalLogs || 0} logs</p>
                    </div>
                    <span className="text-[13px] font-bold text-[hsl(var(--green))]">{f.totalLogs || 0} logs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
