import { forwardRef } from "react"
import { cn } from "@/utils/cn"
import ApperIcon from "@/components/ApperIcon"

const Select = forwardRef(({ 
  className, 
  label,
  error,
  children,
  ...props 
}, ref) => {
  const baseStyles = "w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none pr-10"
  
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
      <div className="relative">
        <select
          className={cn(baseStyles, errorStyles, className)}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ApperIcon name="ChevronDown" size={16} className="text-gray-500" />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Select.displayName = "Select"

export default Select