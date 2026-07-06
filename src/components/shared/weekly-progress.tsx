import { cn } from "@/lib/utils"
import { WEEKLY_LOG_TARGET } from "@/lib/constants"

export function WeeklyProgress({ count, target = WEEKLY_LOG_TARGET }: { count: number; target?: number }) {
  const pct = Math.min(100, Math.round((count / target) * 100))
  const met = count >= target

  return (
    <div className="rounded-[10px] border border-[hsl(var(--border))] bg-white px-4 py-4 shadow-card">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-medium text-[hsl(var(--text-2))]">This week&apos;s goal</span>
        <span className={cn("text-[13px] font-semibold", met ? "text-[hsl(var(--green))]" : "text-[hsl(var(--text-1))]")}>
          {count}/{target}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--bg-muted))]">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", met ? "bg-[hsl(var(--green))]" : "bg-[hsl(var(--navy))]")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-[hsl(var(--text-4))]">
        {met ? "Target met." : `${target - count} more log${target - count === 1 ? "" : "s"} needed.`}
      </p>
    </div>
  )
}
