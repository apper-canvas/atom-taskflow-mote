import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Textarea = forwardRef(({ 
  className, 
  label,
  error,
  rows = 4,
  ...props 
}, ref) => {
  const baseStyles = "w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white placeholder:text-gray-500 resize-none"
  
  const errorStyles = error 
    ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50" 
    : ""
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(baseStyles, errorStyles, className)}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = "Textarea"

export default Textarea