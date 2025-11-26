import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '@/components/atoms/Modal'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import Badge from '@/components/atoms/Badge'
import ApperIcon from '@/components/ApperIcon'
import Loading from '@/components/ui/Loading'
import Empty from '@/components/ui/Empty'
import { taskService } from '@/services/api/taskService'
import { projectService } from '@/services/api/projectService'
import { showToast } from '@/utils/toast'

const TemplateLibrary = ({ isOpen, onClose, type = "tasks" }) => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [categories, setCategories] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadLibraryTemplates()
    }
  }, [isOpen, type])

  const loadLibraryTemplates = async () => {
    try {
      setLoading(true)
      const [templateData, categoryData] = await Promise.all([
        type === 'tasks' ? taskService.getTemplates() : projectService.getTemplates(),
        type === 'tasks' ? taskService.getTemplateCategories() : projectService.getTemplateCategories()
      ])
      
      setTemplates(templateData)
      setCategories(categoryData)
    } catch (error) {
      console.error('Failed to load library templates:', error)
      showToast("Failed to load template library", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (templateId) => {
    try {
      if (type === 'tasks') {
        await taskService.createFromTemplate(templateId)
        showToast("Task created from template! 🎉", "success")
      } else {
        await projectService.createFromTemplate(templateId)
        showToast("Project created from template! 🎉", "success")
      }
      onClose()
    } catch (error) {
      console.error('Failed to use template:', error)
      showToast("Failed to use template. Please try again.", "error")
    }
  }

  const getSortedTemplates = (templates) => {
    let sorted = [...templates]
    
    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return sorted
    }
  }

  const filteredTemplates = getSortedTemplates(
    templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  )

  const libraryTemplates = [
    // Predefined popular templates
    {
      Id: 'lib-1',
      name: 'Daily Standup Meeting',
      description: 'Template for organizing daily standup meetings with standard agenda items',
      category: 'Meetings',
      icon: '🎯',
      usageCount: 156,
      isLibrary: true,
      defaults: {
        category: 'Work',
        priority: 'Medium',
        estimatedTime: 30
      },
      subtasks: [
        { title: 'Review yesterday\'s progress', priority: 'High' },
        { title: 'Discuss today\'s goals', priority: 'High' },
        { title: 'Identify blockers', priority: 'Medium' },
        { title: 'Plan next steps', priority: 'Medium' }
      ]
    },
    {
      Id: 'lib-2',
      name: 'Website Launch Checklist',
      description: 'Comprehensive checklist for launching a new website or web application',
      category: 'Projects',
      icon: '🚀',
      usageCount: 89,
      isLibrary: true,
      defaults: {
        category: 'Work',
        priority: 'High',
        estimatedTime: 480
      },
      subtasks: [
        { title: 'Domain setup and DNS configuration', priority: 'High' },
        { title: 'SSL certificate installation', priority: 'High' },
        { title: 'Performance testing', priority: 'High' },
        { title: 'SEO optimization', priority: 'Medium' },
        { title: 'Analytics setup', priority: 'Medium' },
        { title: 'Backup system configuration', priority: 'Medium' }
      ]
    },
    {
      Id: 'lib-3',
      name: 'Code Review Process',
      description: 'Standard process for conducting thorough code reviews',
      category: 'Development',
      icon: '🔍',
      usageCount: 134,
      isLibrary: true,
      defaults: {
        category: 'Work',
        priority: 'High',
        estimatedTime: 60
      },
      subtasks: [
        { title: 'Check code functionality', priority: 'High' },
        { title: 'Review code style and conventions', priority: 'Medium' },
        { title: 'Test edge cases', priority: 'High' },
        { title: 'Verify security considerations', priority: 'High' },
        { title: 'Document feedback', priority: 'Medium' }
      ]
    }
  ]

  const allTemplates = [...libraryTemplates, ...filteredTemplates]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Template Library
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Browse and use pre-built {type} templates
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder={`Search ${type} templates...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-48"
          >
            <option value="all">All Categories</option>
            <option value="Meetings">Meetings</option>
            <option value="Projects">Projects</option>
            <option value="Development">Development</option>
            <option value="Personal">Personal</option>
          </Select>
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-32"
          >
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </Select>
        </div>

        {/* Template Grid */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : allTemplates.length === 0 ? (
            <Empty 
              message="No templates found"
              actionText="Clear filters"
              onAction={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTemplates.map((template) => (
                <TemplateLibraryCard
                  key={template.Id}
                  template={template}
                  onUse={handleUseTemplate}
                  onPreview={setSelectedTemplate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Template Preview */}
        <AnimatePresence>
          {selectedTemplate && (
            <TemplatePreview
              template={selectedTemplate}
              onClose={() => setSelectedTemplate(null)}
              onUse={handleUseTemplate}
            />
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}

// Template Library Card Component
const TemplateLibraryCard = ({ template, onUse, onPreview }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{template.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" size="sm">{template.category}</Badge>
              {template.isLibrary && (
                <Badge variant="primary" size="sm">Library</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview(template)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title="Preview"
          >
            <ApperIcon name="Eye" size={14} />
          </button>
          <button
            onClick={() => onUse(template.Id)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
            title="Use Template"
          >
            <ApperIcon name="Play" size={14} />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {template.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Used {template.usageCount || 0} times</span>
        {template.subtasks?.length > 0 && (
          <span>{template.subtasks.length} subtasks</span>
        )}
      </div>
    </motion.div>
  )
}

// Template Preview Component  
const TemplatePreview = ({ template, onClose, onUse }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <Badge variant="secondary" size="sm">{template.category}</Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <ApperIcon name="X" size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">{template.description}</p>
        
        {template.subtasks && template.subtasks.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Included Subtasks:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {template.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{subtask.title}</span>
                  <Badge variant="secondary" size="sm">{subtask.priority}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
          <span>Used {template.usageCount || 0} times</span>
          <span>Default priority: {template.defaults?.priority || 'Medium'}</span>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={() => onUse(template.Id)}>
            Use This Template
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TemplateLibrary