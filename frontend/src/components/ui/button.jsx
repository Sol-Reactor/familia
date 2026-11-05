import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const variants = {
  default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline: "border border-input bg-card hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  brand: "brand-gradient text-white shadow-md hover:opacity-95 hover:shadow-lg",
}

const sizes = {
  default: "h-11 px-4 py-2",
  sm: "h-9 rounded-lg px-3",
  lg: "h-12 rounded-xl px-8 text-base",
  icon: "h-11 w-11", // 44px minimum touch target
  "icon-sm": "h-9 w-9",
}

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", loading = false, disabled, children, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(
          "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:active:scale-100",
          variants[variant] ?? variants.default,
          sizes[size] ?? sizes.default,
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
