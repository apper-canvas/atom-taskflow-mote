import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Input from '@/components/atoms/Input'
import Badge from '@/components/atoms/Badge'
import Button from '@/components/atoms/Button'

const ProjectQuickTemplateSelector = ({ 
  templates, 
  selectedTemplateId, 
  onSelectTemplate, 
  isVisible 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedTemplate = templates.find(t => t.Id === selectedTemplateId)
  const popularTemplates = templates.slice(0, 3) // Simple popular logic
  
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectTemplate = (templateId) => {
    onSelectTemplate(templateId)
    setIsDropdownOpen(false)
  }

  const handleClearTemplate = () => {
    onSelectTemplate('')
    setIsDropdownOpen(false)
  }

  if (!isVisible) return null

  return (
    <div className="relative">
      {/* Template Selector Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedTemplate ? (
            <>
              <span className="text-lg">{selectedTemplate.icon}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedTemplate.name}</div>
                <div className="text-sm text-gray-500 truncate">{selectedTemplate.description}</div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <ApperIcon name="FolderOpen" size={20} />
              <span>Choose a project template...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedTemplate && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearTemplate()
              }}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            >
              <ApperIcon name="X" size={14} />
            </button>
          )}
          <ApperIcon 
            name={isDropdownOpen ? "ChevronUp" : "ChevronDown"} 
            size={16} 
            className="text-gray-400" 
          />
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Project Templates</h3>
                <button
                  onClick={() => setIsDropdownOpen(false)}
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

            {/* Template List */}
            <div className="max-h-64 overflow-y-auto">
              {/* Popular Templates */}
              {searchTerm === "" && popularTemplates.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Popular Templates
                  </h4>
                  <div className="space-y-1">
                    {popularTemplates.map(template => (
                      <TemplateItem
                        key={template.Id}
                        template={template}
                        isSelected={template.Id === selectedTemplateId}
                        onSelect={() => handleSelectTemplate(template.Id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All/Filtered Templates */}
              {filteredTemplates.length > 0 ? (
                <div className="p-3">
                  {searchTerm !== "" && (
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Search Results
                    </h4>
                  )}
                  <div className="space-y-1">
                    {filteredTemplates.map(template => (
                      <TemplateItem
                        key={template.Id}
                        template={template}
                        isSelected={template.Id === selectedTemplateId}
                        onSelect={() => handleSelectTemplate(template.Id)}
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
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Button
                onClick={() => {
                  setIsDropdownOpen(false)
                  // Navigate to templates page - could be enhanced with router
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                <ApperIcon name="Layout" size={14} className="mr-2" />
                Browse All Templates
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Template Item Component
const TemplateItem = ({ template, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2 rounded-md transition-colors duration-150 group ${
        isSelected 
          ? 'bg-blue-50 border-blue-200' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg">{template.icon}</span>
        <div className="flex-1 min-w-0 text-left">
          <div className={`font-medium text-sm truncate ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {template.name}
          </div>
          {template.description && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {template.description}
            </div>
          )}
          {template.category && (
            <div className="mt-1">
              <Badge variant="secondary" size="sm">
                {template.category}
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      {isSelected ? (
        <ApperIcon 
          name="Check" 
          size={14} 
          className="text-blue-600" 
        />
      ) : (
        <ApperIcon 
          name="Plus" 
          size={14} 
          className="text-gray-400 group-hover:text-blue-600 transition-colors duration-150" 
        />
      )}
    </button>
  )
}

export default ProjectQuickTemplateSelector