import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary",
        secondary:
          "bg-muted text-muted-foreground",
        destructive:
          "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
        outline:
          "border border-border text-foreground bg-transparent",
        success:
          "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
        info:
          "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
