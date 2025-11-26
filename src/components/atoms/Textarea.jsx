import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Textarea = forwardRef(({ 
  className, 
  label,
  error,
  rows = 4,
  richText = false,
  toolbar = false,
  onBold,
  onItalic,
  onLink,
  onCode,
  ...props 
}, ref) => {
  const baseStyles = "w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white placeholder:text-gray-500 resize-none"
  
  const errorStyles = error 
    ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50" 
    : ""

  const richTextStyles = richText 
    ? "rounded-t-none border-t-0" 
    : ""
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {toolbar && richText && (
        <div className="flex items-center gap-1 p-2 bg-gray-100 border border-gray-300 rounded-t-lg border-b-0">
          <button
            type="button"
            onClick={onBold}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm font-bold transition-colors"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={onItalic}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm italic transition-colors"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={onLink}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm transition-colors"
            title="Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={onCode}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded text-sm font-mono transition-colors"
            title="Code"
          >
            &lt;/&gt;
          </button>
        </div>
      )}
      
      <textarea
        rows={rows}
        className={cn(baseStyles, errorStyles, richTextStyles, className)}
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