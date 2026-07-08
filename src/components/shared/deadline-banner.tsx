import { cn } from "@/lib/utils"
import { formatWeekRange, deadlineCountdown, getCurrentWeekKey } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export function DeadlineBanner({ weekKey = getCurrentWeekKey() }: { weekKey?: string }) {
  const countdown = deadlineCountdown()
  const urgent = /left/.test(countdown) && /h|m/.test(countdown) && !/\dd /.test(countdown)

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
      urgent
        ? "border-[hsl(var(--red))]/15 bg-[hsl(var(--red-soft))]"
        : "border-[hsl(var(--orange))]/15 bg-[hsl(var(--orange-soft))]",
    )}>
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
        urgent ? "bg-[hsl(var(--red))]/10" : "bg-[hsl(var(--orange))]/10",
      )}>
        <AlertCircle className={cn(
          "h-4 w-4",
          urgent ? "text-[hsl(var(--red))]" : "text-[hsl(var(--orange))]",
          urgent && "animate-pulse",
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] font-semibold",
          urgent ? "text-[hsl(var(--red))]" : "text-[hsl(var(--text-1))]",
        )}>
          Weekly deadline — {countdown}
        </p>
        <p className="text-[12px] text-[hsl(var(--text-3))]">Week of {formatWeekRange(weekKey)} · logs close Sunday 18:00</p>
      </div>
    </div>
  )
}
