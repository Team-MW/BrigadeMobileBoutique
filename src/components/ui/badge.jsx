import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-primary/20 text-primary border-primary/30",
  secondary: "bg-secondary text-secondary-foreground border-border",
  destructive: "bg-red-900/30 text-red-400 border-red-800/50",
  success: "bg-green-900/30 text-green-400 border-green-800/50",
  warning: "bg-yellow-900/30 text-yellow-400 border-yellow-800/50",
  outline: "border border-border text-foreground",
  info: "bg-blue-900/30 text-blue-400 border-blue-800/50",
}

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
