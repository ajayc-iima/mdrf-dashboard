import type { ReactNode } from "react"

interface Props { icon?: ReactNode; title: string; description?: string; action?: ReactNode }

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--bg-page))] px-6 py-12 text-center">
      {icon && <div className="mb-3 text-[hsl(var(--text-4))]">{icon}</div>}
      <p className="text-[13px] font-medium text-[hsl(var(--text-2))]">{title}</p>
      {description && <p className="mt-1 text-[12px] text-[hsl(var(--text-4))] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
