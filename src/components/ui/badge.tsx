import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--blue-soft))] text-[hsl(var(--blue))]",
        secondary: "bg-[hsl(var(--bg-muted))] text-[hsl(var(--text-3))]",
        destructive: "bg-[hsl(var(--red-soft))] text-[hsl(var(--red))]",
        outline: "border border-[hsl(var(--border))] text-[hsl(var(--text-3))]",
        success: "bg-[hsl(var(--green-soft))] text-[hsl(var(--green))]",
        warning: "bg-[hsl(var(--orange-soft))] text-[hsl(var(--orange))]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
