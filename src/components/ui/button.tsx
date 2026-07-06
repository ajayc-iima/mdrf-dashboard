import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--navy))] text-white hover:bg-[hsl(var(--navy-light))] active:scale-[0.98]",
        destructive: "bg-[hsl(var(--red))] text-white hover:brightness-90 active:scale-[0.98]",
        outline: "border border-[hsl(var(--border))] bg-white text-[hsl(var(--text-1))] hover:bg-[hsl(var(--bg-muted))] active:bg-[hsl(var(--bg-hover))]",
        secondary: "bg-[hsl(var(--bg-muted))] text-[hsl(var(--text-2))] hover:bg-[hsl(var(--bg-hover))]",
        ghost: "text-[hsl(var(--text-3))] hover:bg-[hsl(var(--bg-muted))] hover:text-[hsl(var(--text-1))]",
        link: "text-[hsl(var(--gold))] underline-offset-4 hover:underline",
        success: "bg-[hsl(var(--green))] text-white hover:brightness-90 active:scale-[0.98]",
        accent: "bg-[hsl(var(--orange))] text-white hover:brightness-90 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading && (
          <svg className="mr-2 h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
