import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface Props { title: string; description?: string; icon?: ReactNode; actions?: ReactNode; className?: string }

export function PageHeader({ title, description, icon, actions, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-[22px] font-semibold tracking-tight text-[hsl(var(--navy))]">
          {icon && <span className="text-[hsl(var(--gold))]">{icon}</span>}
          {title}
        </h1>
        {description && <p className="mt-1 text-[14px] text-[hsl(var(--text-3))]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
