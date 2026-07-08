import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "success" | "accent"
}

const iconBg = {
  default: "bg-[hsl(var(--blue-soft))] text-[hsl(var(--blue))]",
  destructive: "bg-[hsl(var(--red-soft))] text-[hsl(var(--red))]",
  success: "bg-[hsl(var(--green-soft))] text-[hsl(var(--green))]",
  accent: "bg-[hsl(var(--gold-soft))] text-[hsl(var(--gold))]",
}

const valueColor = {
  default: "text-[hsl(var(--text-1))]",
  destructive: "text-[hsl(var(--red))]",
  success: "text-[hsl(var(--green))]",
  accent: "text-[hsl(var(--gold))]",
}

export function StatCard({ title, value, description, icon, variant = "default" }: StatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[13px] font-medium text-[hsl(var(--text-3))]">{title}</CardTitle>
        {icon && <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg[variant])}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-[28px] font-bold tracking-tight", valueColor[variant])}>{value}</div>
        {description && <p className="text-[12px] text-[hsl(var(--text-4))] mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
