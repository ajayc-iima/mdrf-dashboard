"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { WeeklyProgress } from "./weekly-progress"
import { getWorkLogs, getTasks, getCourseProgress, getWorkloadCheckin } from "@/lib/firestore"
import { getCurrentWeekKey, formatDate, formatRelativeTime, getWorkloadStatus } from "@/lib/utils"
import { WORK_CATEGORIES, LOG_TYPES, type WorkLog, type Task, type UserProfile } from "@/types"
import { X, Flame, MapPin, Building2 } from "lucide-react"

interface Props { fellow: UserProfile; onClose: () => void }

export function FellowDetail({ fellow, onClose }: Props) {
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [weekCount, setWeekCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const weekKey = getCurrentWeekKey()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getWorkLogs({ fellowId: fellow.id, weekKey, limitCount: 20 }),
      getWorkLogs({ fellowId: fellow.id, limitCount: 50 }),
      getTasks(fellow.id),
      getCourseProgress(fellow.id),
      getWorkloadCheckin(fellow.id, weekKey),
    ]).then(([weekLogs, allLogs]) => { setLogs(allLogs); setTasks([]); setWeekCount(weekLogs.length); setLoading(false) })
  }, [fellow.id, weekKey])

  const status = getWorkloadStatus(fellow.lastLogDate)

  return (
    <Card>
      <button onClick={onClose} className="absolute top-4 right-4 rounded-md p-1 text-[hsl(var(--text-4))] hover:bg-[hsl(var(--bg-muted))] transition-colors"><X className="h-4 w-4" /></button>
      <CardHeader className="border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{fellow.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-[15px]">{fellow.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-1 text-[12px] text-[hsl(var(--text-3))]">
                {fellow.program === "mlrf" ? <MapPin className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                {fellow.program === "mlrf" ? (fellow.constituencies?.join(", ") || "—") : fellow.district}
              </span>
              <Badge variant={status === "green" ? "success" : status === "yellow" ? "warning" : "destructive"}>
                {status === "green" ? "Active" : status === "yellow" ? "Slowing" : "Silent"}
              </Badge>
              {fellow.streak > 0 && <span className="flex items-center gap-1 text-[12px] text-[hsl(var(--orange))]"><Flame className="h-3 w-3" /> {fellow.streak}d</span>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[hsl(var(--bg-muted))]" />)}</div> : (
          <>
            <WeeklyProgress count={weekCount} />
            <div>
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--text-4))] mb-2">Recent Logs</h4>
              <div className="space-y-1 max-h-64 overflow-auto">
                {logs.length === 0 ? <p className="py-4 text-center text-[12px] text-[hsl(var(--text-4))]">No logs yet</p> : logs.slice(0, 15).map((l) => (
                  <div key={l.id} className="flex gap-2 rounded-lg border border-[hsl(var(--border))] p-2.5">
                    <span className="text-sm shrink-0">{WORK_CATEGORIES.find((c) => c.value === l.category)?.emoji || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[hsl(var(--text-1))] line-clamp-2">{l.description}</p>
                      <p className="text-[11px] text-[hsl(var(--text-4))]">
                        {WORK_CATEGORIES.find((c) => c.value === l.category)?.label} · {LOG_TYPES.find((t) => t.value === l.type)?.label} · {formatDate(l.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
