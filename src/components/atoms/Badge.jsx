import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Badge = forwardRef(({ 
  className, 
  variant = "default",
  size = "default",
  children, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center rounded-full font-medium transition-colors duration-200"
  
  const variants = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-600",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    personal: "bg-purple-100 text-purple-800",
    work: "bg-blue-100 text-blue-800",
    other: "bg-green-100 text-green-800"
  }
  
  const sizes = {
    sm: "px-2 py-1 text-xs gap-1",
    default: "px-2.5 py-1.5 text-xs gap-1.5",
    lg: "px-3 py-2 text-sm gap-2"
  }
  
  return (
    <div
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
})

Badge.displayName = "Badge"

export default Badge