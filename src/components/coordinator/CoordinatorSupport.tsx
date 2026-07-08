"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSupportRequests, updateSupportStatus } from "@/lib/firestore"
import { formatRelativeTime } from "@/lib/utils"
import { SUPPORT_CATEGORIES, type Program, type SupportStatus } from "@/types"

interface Props {
  program: Program
}

export function CoordinatorSupport({ program }: Props) {
  const [requests, setRequests] = useState<any[]>([])
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all")
  const [loading, setLoading] = useState(true)

  const title = program === "mdrf" ? "MDRF Support Requests" : "MLRF Support Requests"
  const subtitle = `Manage ${program.toUpperCase()} fellow support requests`

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const data = await getSupportRequests({ program })
    setRequests(data)
    setLoading(false)
  }

  async function handleStatusChange(id: string, status: SupportStatus) {
    await updateSupportStatus(id, status)
    await loadData()
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter)

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-[hsl(var(--bg-muted))]" />

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[hsl(var(--text-1))]">{title}</h1>
        <p className="text-[14px] text-[hsl(var(--text-3))] mt-1">{subtitle}</p>
      </div>

      <div className="flex gap-2">
        {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.replace("_", " ")} ({f === "all" ? requests.length : requests.filter((r) => r.status === f).length})
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[hsl(var(--text-3))]">No requests found</p>
            ) : (
              filtered.map((req) => (
                <div
                  key={req.id}
                  className={`rounded-xl border p-4 ${
                    req.urgency === "high" ? "border-[hsl(var(--red))]/30 bg-[hsl(var(--red))]/5" :
                    req.urgency === "medium" ? "border-[hsl(var(--orange))]/30 bg-[hsl(var(--orange))]/5" : "border-[hsl(var(--border))]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[hsl(var(--text-1))]">{req.fellowName}</span>
                        <Badge variant={req.urgency === "high" ? "destructive" : req.urgency === "medium" ? "warning" : "secondary"}>{req.urgency}</Badge>
                        <Badge variant={req.status === "resolved" ? "success" : req.status === "in_progress" ? "default" : "warning"}>{req.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="mt-1.5 text-[13px] text-[hsl(var(--text-2))]">{req.description}</p>
                      <p className="mt-1 text-[11px] text-[hsl(var(--text-3))]">
                        {SUPPORT_CATEGORIES.find((c) => c.value === req.category)?.label} &bull; {req.program === "mlrf" ? "—" : req.district} &bull; {formatRelativeTime(req.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {req.status === "open" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(req.id, "in_progress")}>Start</Button>}
                      {req.status !== "resolved" && <Button size="sm" onClick={() => handleStatusChange(req.id, "resolved")}>Resolve</Button>}
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
