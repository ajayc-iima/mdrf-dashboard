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
    const data = await getSupportRequests()
    setRequests(data)
    setLoading(false)
  }

  async function handleStatusChange(id: string, status: SupportStatus) {
    await updateSupportStatus(id, status)
    await loadData()
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter)

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-muted" />

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
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
              <p className="py-8 text-center text-muted-foreground">No requests found</p>
            ) : (
              filtered.map((req) => (
                <div
                  key={req.id}
                  className={`rounded-lg border p-4 ${
                    req.urgency === "high" ? "border-[#FF453A]/30 bg-[#FF453A]/5" :
                    req.urgency === "medium" ? "border-[#FF9F0A]/30 bg-[#FF9F0A]/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.fellowName}</span>
                        <Badge variant={req.urgency === "high" ? "destructive" : req.urgency === "medium" ? "warning" : "secondary"}>{req.urgency}</Badge>
                        <Badge variant={req.status === "resolved" ? "success" : req.status === "in_progress" ? "default" : "warning"}>{req.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{req.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
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
