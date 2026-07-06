"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { COURSES } from "@/lib/constants"
import { setCourseProgress } from "@/lib/firestore"
import type { Program, CourseStatus } from "@/types"
import { GraduationCap, Check, Circle, Loader2 } from "lucide-react"

interface Props { fellowId: string; program: Program; progress: { courseKey: string; status: CourseStatus }[]; onToggle?: () => void }

export function CourseProgress({ fellowId, program, progress, onToggle }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [local, setLocal] = useState(() => { const m = new Map<string, CourseStatus>(); for (const p of progress) m.set(p.courseKey, p.status); return m })
  const applicable = COURSES.filter((c) => !c.program || c.program === program)
  const doneCount = applicable.filter((c) => local.get(c.key) === "done").length
  const pct = applicable.length ? Math.round((doneCount / applicable.length) * 100) : 0

  async function toggle(courseKey: string) {
    const next: CourseStatus = local.get(courseKey) === "done" ? "not_started" : "done"
    setBusy(courseKey); const prev = local
    setLocal(new Map(prev).set(courseKey, next))
    try { await setCourseProgress(fellowId, courseKey, next); onToggle?.() } catch { setLocal(prev) } finally { setBusy(null) }
  }

  return (
    <Card>
      <CardHeader className="border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <GraduationCap className="h-4 w-4 text-[hsl(var(--blue))]" /> Certificate Programme
          </CardTitle>
          <span className={cn("text-[14px] font-semibold", pct === 100 ? "text-[hsl(var(--green))]" : "text-[hsl(var(--text-1))]")}>{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-muted))]">
          <div className="h-full rounded-full bg-[hsl(var(--blue))] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-0.5">
          {applicable.map((c) => {
            const isDone = local.get(c.key) === "done"
            return (
              <button key={c.key} onClick={() => toggle(c.key)} disabled={busy === c.key}
                className={cn("flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors", isDone ? "bg-[hsl(var(--green-soft))]" : "hover:bg-[hsl(var(--bg-muted))]")}>
                <span className="mt-0.5 shrink-0">
                  {busy === c.key ? <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--text-4))]" />
                    : isDone ? <Check className="h-4 w-4 text-[hsl(var(--green))]" />
                    : <Circle className="h-4 w-4 text-[hsl(var(--text-4))]" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] font-medium", isDone ? "text-[hsl(var(--green))]" : "text-[hsl(var(--text-1))]")}>{c.title}</p>
                  <p className="text-[12px] text-[hsl(var(--text-4))]">{c.description}</p>
                </div>
              </button>
            )
          })}
        </div>
        {pct === 100
          ? <p className="mt-4 text-center text-[13px] font-medium text-[hsl(var(--green))]">Programme complete.</p>
          : <p className="mt-4 text-center text-[12px] text-[hsl(var(--text-4))]">{applicable.length - doneCount} module{applicable.length - doneCount === 1 ? "" : "s"} remaining.</p>}
      </CardContent>
    </Card>
  )
}
