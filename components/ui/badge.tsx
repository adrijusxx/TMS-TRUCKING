import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Original variants (preserved for backwards compatibility)
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",

        // Status variants (solid)
        success:
          "border-transparent bg-status-success text-status-success-foreground hover:bg-status-success/90",
        warning:
          "border-transparent bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
        error:
          "border-transparent bg-status-error text-status-error-foreground hover:bg-status-error/90",
        info:
          "border-transparent bg-status-info text-status-info-foreground hover:bg-status-info/90",
        neutral:
          "border-transparent bg-status-neutral text-status-neutral-foreground hover:bg-status-neutral/90",

        // Status variants (outline)
        "success-outline":
          "border-status-success text-status-success bg-status-success-muted hover:bg-status-success/10",
        "warning-outline":
          "border-status-warning text-status-warning bg-status-warning-muted hover:bg-status-warning/10",
        "error-outline":
          "border-status-error text-status-error bg-status-error-muted hover:bg-status-error/10",
        "info-outline":
          "border-status-info text-status-info bg-status-info-muted hover:bg-status-info/10",
        "neutral-outline":
          "border-status-neutral text-status-neutral bg-status-neutral-muted hover:bg-status-neutral/10",
      },
      size: {
        xs: "px-1.5 py-0 text-[9px] h-4",
        sm: "px-2 py-0.5 text-[10px] h-5",
        md: "px-2.5 py-0.5 text-xs h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  /** Show a colored dot indicator before the text */
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            variant === "success" || variant === "success-outline" ? "bg-status-success" : "",
            variant === "warning" || variant === "warning-outline" ? "bg-status-warning" : "",
            variant === "error" || variant === "error-outline" ? "bg-status-error" : "",
            variant === "info" || variant === "info-outline" ? "bg-status-info" : "",
            variant === "neutral" || variant === "neutral-outline" ? "bg-status-neutral" : "",
            variant === "default" ? "bg-primary" : "",
            variant === "secondary" ? "bg-muted-foreground" : "",
            variant === "destructive" ? "bg-destructive" : "",
            variant === "outline" ? "bg-foreground" : ""
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
