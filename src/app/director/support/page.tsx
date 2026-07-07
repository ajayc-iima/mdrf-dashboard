"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getSupportRequests, updateSupportStatus } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { SUPPORT_CATEGORIES, type Program, type SupportStatus } from "@/types"
import { LifeBuoy, CheckCircle2 } from "lucide-react"

export default function DirectorSupportPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all")
  const [programFilter, setProgramFilter] = useState<"all" | Program>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const data = await getSupportRequests()
    setRequests(data)
    setLoading(false)
  }

  async function handleStatusChange(id: string, status: SupportStatus) {
    await updateSupportStatus(id, status)
    await loadData()
  }

  let filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter)
  if (programFilter !== "all") filtered = filtered.filter((r) => r.program === programFilter)

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Support Requests"
        icon={<LifeBuoy className="h-6 w-6" />}
        description="All support requests across MDRF & MLRF"
      />

      <div className="flex flex-wrap gap-2">
        <Select value={programFilter} onValueChange={(v) => setProgramFilter(v as "all" | Program)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Program" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="mdrf">MDRF</SelectItem>
            <SelectItem value="mlrf">MLRF</SelectItem>
          </SelectContent>
        </Select>
        {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState title="No requests" description="No support requests match your filters." />
            ) : (
              filtered.map((req) => (
                <div key={req.id} className={`rounded-lg border p-4 ${req.urgency === "high" ? "border-[hsl(var(--red))]/20 bg-[hsl(var(--red))]/[0.02]" : "border-[hsl(var(--border))]"}`}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[hsl(var(--text-1))]">{req.fellowName}</span>
                        <Badge variant="outline" className="text-[10px]">{req.program?.toUpperCase()}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{SUPPORT_CATEGORIES.find((c) => c.value === req.category)?.label}</Badge>
                        <Badge variant={req.urgency === "high" ? "destructive" : req.urgency === "medium" ? "warning" : "secondary"}>{req.urgency}</Badge>
                        <Badge variant={req.status === "resolved" ? "success" : req.status === "in_progress" ? "default" : "warning"}>{req.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-[hsl(var(--text-2))]">{req.description}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--text-3))]">{req.program === "mlrf" ? "—" : req.district} · {formatRelativeTime(req.createdAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {req.status === "open" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(req.id, "in_progress")}>Start</Button>}
                      {req.status !== "resolved" && <Button size="sm" onClick={() => handleStatusChange(req.id, "resolved")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve</Button>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
