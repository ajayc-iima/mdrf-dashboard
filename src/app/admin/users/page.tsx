"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  getAllUsersAdmin,
  approveUser,
  rejectUser,
  updateUserRole,
  setUserActive,
  updateUserProfile,
} from "@/lib/firestore"
import { ROLE_LABELS } from "@/lib/auth"
import { formatRelativeTime } from "@/lib/utils"
import { ASSIGNABLE_ROLES, DISTRICTS, CONSTITUENCIES, type UserProfile, type UserRole, type Program } from "@/types"
import { Search, ShieldCheck, Check, X, Users } from "lucide-react"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { role: UserRole; district: string; program: Program; constituencies: string[] }>>({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const data = await getAllUsersAdmin()
    setUsers(data)
    setLoading(false)
  }

  const filtered = users.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  async function withBusy(uid: string, fn: () => Promise<void>) {
    setBusyUid(uid)
    try {
      await fn()
      await loadData()
    } finally {
      setBusyUid(null)
    }
  }

  async function handleApprove(u: UserProfile, role: UserRole, district: string, program: Program, constituencies: string[] = []) {
    await withBusy(u.id, () => approveUser(u.id, role, program, district, constituencies))
  }

  async function handleReject(u: UserProfile) {
    await withBusy(u.id, () => rejectUser(u.id))
  }

  async function handleRoleChange(u: UserProfile, role: UserRole) {
    await withBusy(u.id, () => updateUserRole(u.id, role))
  }

  async function handleDistrictChange(u: UserProfile, district: string) {
    await withBusy(u.id, () => updateUserProfile(u.id, { district }))
  }

  async function handleToggleActive(u: UserProfile) {
    await withBusy(u.id, () => setUserActive(u.id, !u.isActive))
  }

  if (loading) {
    return (
      <div className="space-y-6 stagger-children">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">Assign roles, approve accounts, and manage access</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({s === "all" ? users.length : users.filter((u) => u.status === s).length})
            </Button>
          ))}
        </div>
      </div>

      {/* User table */}
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle>Users</CardTitle>
          <CardDescription>{filtered.length} of {users.length} accounts</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((u) => {
                  const draft = drafts[u.id]
                  return (
                    <tr key={u.id} className="align-middle hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{u.name}</p>
                          {!u.isActive && u.status === "approved" && (
                            <Badge variant="secondary">disabled</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.status === "pending" ? (
                          <Select
                            value={draft?.role ?? "fellow"}
                            onValueChange={(v) =>
                              setDrafts((d) => ({ ...d, [u.id]: { role: v as UserRole, district: d[u.id]?.district ?? DISTRICTS[0], program: d[u.id]?.program ?? "mdrf", constituencies: d[u.id]?.constituencies ?? [] } }))
                            }
                          >
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : u.role ? (
                          <Select value={u.role} onValueChange={(v) => handleRoleChange(u, v as UserRole)}>
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.status === "pending" ? (
                          <Select
                            value={draft?.program ?? "mdrf"}
                            onValueChange={(v) =>
                              setDrafts((d) => ({ ...d, [u.id]: { role: d[u.id]?.role ?? "fellow", district: d[u.id]?.district ?? DISTRICTS[0], program: v as Program, constituencies: d[u.id]?.constituencies ?? [] } }))
                            }
                          >
                            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mdrf">MDRF</SelectItem>
                              <SelectItem value="mlrf">MLRF</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="text-xs">{u.program?.toUpperCase()}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.status === "pending" ? (
                          draft?.program === "mlrf" ? (
                            <div className="space-y-1.5">
                              <Select
                                value={draft?.district ?? DISTRICTS[0]}
                                onValueChange={(v) =>
                                  setDrafts((d) => ({ ...d, [u.id]: { ...d[u.id]!, district: v } }))
                                }
                              >
                                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="District" /></SelectTrigger>
                                <SelectContent>
                                  {DISTRICTS.map((d) => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-auto">
                                {CONSTITUENCIES.slice(0, 20).map((c) => {
                                  const sel = draft?.constituencies?.includes(c)
                                  return (
                                    <button key={c} type="button" onClick={() => {
                                      const cur = draft?.constituencies || []
                                      const next = sel ? cur.filter((x) => x !== c) : [...cur, c]
                                      setDrafts((d) => ({ ...d, [u.id]: { ...d[u.id]!, constituencies: next } }))
                                    }} className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors ${sel ? "border-[hsl(var(--green))]/40 bg-[hsl(var(--green))]/10 text-[hsl(var(--green))]" : "border-[hsl(var(--border))] text-[hsl(var(--text-3))] hover:border-[hsl(var(--green))]/30"}`}>
                                      {sel ? "✓ " : ""}{c}
                                    </button>
                                  )
                                })}
                              </div>
                              {draft?.constituencies && draft.constituencies.length > 0 && (
                                <p className="text-[10px] text-[hsl(var(--text-3))]">{draft.constituencies.length} selected</p>
                              )}
                            </div>
                          ) : (
                            <Select
                              value={draft?.district ?? DISTRICTS[0]}
                              onValueChange={(v) =>
                                setDrafts((d) => ({ ...d, [u.id]: { ...d[u.id]!, district: v } }))
                              }
                            >
                              <SelectTrigger className="h-8 w-40"><SelectValue placeholder="District" /></SelectTrigger>
                              <SelectContent>
                                {DISTRICTS.map((d) => (
                                  <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        ) : (
                          u.program === "mlrf" ? (
                            <div className="text-xs text-[hsl(var(--text-2))]">
                              {u.constituencies && u.constituencies.length > 0 ? (
                                <p className="font-medium">{u.constituencies.join(", ")}</p>
                              ) : (
                                <p className="text-[hsl(var(--text-3))]">—</p>
                              )}
                            </div>
                          ) : (
                            <Select
                              value={u.district}
                              onValueChange={(v) => handleDistrictChange(u, v)}
                            >
                              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {DISTRICTS.map((d) => (
                                  <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {u.lastLogDate ? formatRelativeTime(u.lastLogDate) : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {u.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyUid === u.id}
                                onClick={() => handleApprove(u, draft?.role ?? "fellow", draft?.district ?? DISTRICTS[0], draft?.program ?? "mdrf", draft?.constituencies ?? [])}
                              >
                                <Check className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyUid === u.id}
                                onClick={() => handleReject(u)}
                              >
                                <X className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </>
                          )}
                          {u.status === "approved" && (
                            <Button
                              size="sm"
                              variant={u.isActive ? "outline" : "default"}
                              disabled={busyUid === u.id}
                              onClick={() => handleToggleActive(u)}
                            >
                              {u.isActive ? "Disable" : "Enable"}
                            </Button>
                          )}
                          {u.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <ShieldCheck className="h-3.5 w-3.5" /> Access denied
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No users match your filters</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
