import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Input = forwardRef(({ 
  className, 
  type = "text",
  label,
  error,
  ...props 
}, ref) => {
  const baseStyles = "w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white placeholder:text-gray-500"
  
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
      <input
        type={type}
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

Input.displayName = "Input"

export default Input