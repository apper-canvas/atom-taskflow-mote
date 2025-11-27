import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { taskService } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Badge from "@/components/atoms/Badge";
import Templates from "@/components/pages/Templates";
import toast, { showToast } from "@/utils/toast";

const QuickTemplateSelector = ({ onSelectTemplate, onCancel, isVisible }) => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [popularTemplates, setPopularTemplates] = useState([])

  useEffect(() => {
    if (isVisible) {
      loadTemplates()
    }
  }, [isVisible])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const [allTemplates, popular] = await Promise.all([
        taskService.getTemplates(),
        taskService.getPopularTemplates(6)
      ])
      setTemplates(allTemplates)
      setPopularTemplates(popular)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (templateId) => {
    try {
      const task = await taskService.createFromTemplate(templateId)
      onSelectTemplate(task)
toast.success("Task created from template! 🎉")
    } catch (error) {
      console.error('Failed to use template:', error)
toast.error("Failed to use template. Please try again.")
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
      >
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Quick Templates</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <ApperIcon name="X" size={16} />
            </button>
          </div>
          
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <ApperIcon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />
              Loading templates...
            </div>
          ) : (
            <>
              {searchTerm === "" && popularTemplates.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Popular Templates
                  </h4>
                  <div className="space-y-1">
                    {popularTemplates.slice(0, 3).map(template => (
                      <TemplateItem
                        key={template.Id}
                        template={template}
                        onUse={handleUseTemplate}
                        showUsageCount
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredTemplates.length > 0 ? (
                <div className="p-3">
                  {searchTerm !== "" && (
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Search Results
                    </h4>
                  )}
                  <div className="space-y-1">
                    {filteredTemplates.slice(0, 8).map(template => (
                      <TemplateItem
                        key={template.Id}
                        template={template}
                        onUse={handleUseTemplate}
                      />
                    ))}
                  </div>
                </div>
              ) : searchTerm !== "" ? (
                <div className="p-4 text-center text-gray-500">
                  <ApperIcon name="Search" size={20} className="mx-auto mb-2 text-gray-400" />
                  No templates found
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <Button
            onClick={() => window.location.href = '/templates'}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            <ApperIcon name="Layout" size={14} className="mr-2" />
            Browse All Templates
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Template Item Component
const TemplateItem = ({ template, onUse, showUsageCount = false }) => {
  return (
    <button
      onClick={() => onUse(template.Id)}
      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors duration-150 group"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm">{template.icon}</span>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-medium text-sm text-gray-900 truncate">
            {template.name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge variant="secondary" size="sm">
              {template.category}
            </Badge>
            {showUsageCount && (
              <span className="text-xs text-gray-500">
                {template.usageCount} uses
              </span>
            )}
          </div>
        </div>
      </div>
      
      <ApperIcon 
        name="Play" 
        size={14} 
        className="text-gray-400 group-hover:text-blue-600 transition-colors duration-150" 
      />
    </button>
  )
}

export default QuickTemplateSelector