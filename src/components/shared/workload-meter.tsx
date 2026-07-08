"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { setWorkloadCheckin, getWorkloadCheckin } from "@/lib/firestore"
import { getCurrentWeekKey } from "@/lib/utils"
import type { Program, WorkloadPressure } from "@/types"
import { WORKLOAD_LABELS } from "@/types"
import { Gauge, Loader2 } from "lucide-react"

interface Props { fellowId: string; fellowName: string; district: string; program: Program }

const OPTIONS: { value: WorkloadPressure; emoji: string; activeBorder: string }[] = [
  { value: "under", emoji: "🟦", activeBorder: "border-[hsl(var(--blue))] bg-[hsl(var(--blue-soft))]" },
  { value: "optimal", emoji: "🟩", activeBorder: "border-[hsl(var(--green))] bg-[hsl(var(--green-soft))]" },
  { value: "over", emoji: "🟥", activeBorder: "border-[hsl(var(--red))] bg-[hsl(var(--red-soft))]" },
]

export function WorkloadMeter({ fellowId, fellowName, district, program }: Props) {
  const [pressure, setPressure] = useState<WorkloadPressure | null>(null)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const weekKey = getCurrentWeekKey()

  useEffect(() => { getWorkloadCheckin(fellowId, weekKey).then((c) => { if (c) { setPressure(c.pressure); setNote(c.note || "") }; setLoading(false) }) }, [fellowId, weekKey])

  async function save(next: WorkloadPressure, nextNote: string) {
    setSaving(true); setPressure(next); setNote(nextNote)
    await setWorkloadCheckin({ fellowId, fellowName, district, program, weekKey, pressure: next, note: nextNote })
    setSaving(false); setSavedAt(Date.now()); setTimeout(() => setSavedAt(null), 2500)
  }

  return (
    <Card>
      <CardHeader className="border-b border-[hsl(var(--border))]">
        <CardTitle className="flex items-center gap-2.5 text-[15px]"><Gauge className="h-4 w-4 text-[hsl(var(--blue))]" /> Workload this week</CardTitle>
        <CardDescription>How is your work pressure this week?</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--text-4))]" /></div> : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {OPTIONS.map((o) => {
                const active = pressure === o.value
                return (
                  <button key={o.value} onClick={() => save(o.value, note)} disabled={saving}
                    className={cn("flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3.5 text-center transition-all",
                      active ? o.activeBorder : "border-[hsl(var(--border))] bg-white text-[hsl(var(--text-4))] hover:border-[hsl(var(--border-strong))]")}>
                    <span className="text-lg">{o.emoji}</span>
                    <span className="text-[11px] font-semibold">{WORKLOAD_LABELS[o.value]}</span>
                  </button>
                )
              })}
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => pressure && save(pressure, note)} rows={2} maxLength={200} placeholder="Optional note..." className="mt-3" />
            {savedAt && <p className="mt-2 text-[12px] text-[hsl(var(--green))] font-semibold">Saved</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
