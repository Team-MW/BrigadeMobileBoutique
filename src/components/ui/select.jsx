import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative" {...props}>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectContext = React.createContext({})

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value } = React.useContext(SelectContext)
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

const SelectContent = ({ className, children, ...props }) => (
  <div
    className={cn(
      "absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg animate-fade-in",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const SelectItem = ({ className, value, children, ...props }) => {
  const { onValueChange } = React.useContext(SelectContext)
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
