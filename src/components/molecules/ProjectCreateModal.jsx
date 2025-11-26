import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { projectService } from '@/services/api/projectService'
import ApperIcon from '@/components/ApperIcon'
import Modal from '@/components/atoms/Modal'
import Input from '@/components/atoms/Input'
import Textarea from '@/components/atoms/Textarea'
import Select from '@/components/atoms/Select'
import Button from '@/components/atoms/Button'

function ProjectCreateModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '📁',
    startDate: '',
    endDate: '',
    status: 'Active',
    useTemplate: false,
    templateId: ''
  })
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      const templateData = await projectService.getTemplates()
      setTemplates(templateData)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }

    // Auto-fill template data
    if (field === 'templateId' && value) {
      const template = templates.find(t => t.Id === value)
      if (template) {
        setFormData(prev => ({
          ...prev,
          color: template.color,
          icon: template.icon,
          description: prev.description || template.description
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      
      if (formData.useTemplate && formData.templateId) {
        await projectService.createFromTemplate(formData.templateId, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          status: formData.status
        })
      } else {
        await onSubmit({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          status: formData.status
        })
      }
      
      handleClose()
    } catch (error) {
      // Error handling is done by parent component
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: '📁',
      startDate: '',
      endDate: '',
      status: 'Active',
      useTemplate: false,
      templateId: ''
    })
    setErrors({})
    onClose()
  }

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#06b6d4', label: 'Cyan' }
  ]

  const iconOptions = [
    '📁', '🚀', '💼', '🎯', '🔧', '📊', '🎨', '💡',
    '🏗️', '📱', '🌐', '⚙️', '📢', '🏠', '🏃‍♂️', '📝'
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Template Selection */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Use Project Template</h4>
            <p className="text-sm text-gray-600">Start with a pre-configured project structure</p>
          </div>
          <input
            type="checkbox"
            checked={formData.useTemplate}
            onChange={(e) => handleInputChange('useTemplate', e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {formData.useTemplate && (
          <Select
            label="Select Template"
            value={formData.templateId}
            onChange={(e) => handleInputChange('templateId', e.target.value)}
          >
            <option value="">Choose a template...</option>
            {templates.map(template => (
              <option key={template.Id} value={template.Id}>
                {template.icon} {template.name}
              </option>
            ))}
          </Select>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter project name"
            error={errors.name}
            required
            disabled={loading}
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your project..."
            rows={3}
            disabled={loading}
          />

          {/* Visual Customization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('color', option.value)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-gray-400 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: option.value }}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`w-12 h-12 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                      formData.icon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={loading}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              disabled={loading}
            />

            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              error={errors.endDate}
              disabled={loading}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            disabled={loading}
          >
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
          </Select>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-sm"
              style={{ backgroundColor: formData.color + '20', color: formData.color }}
            >
              {formData.icon}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {formData.name || 'Project Name'}
              </div>
              <div className="text-sm text-gray-600">
                {formData.description || 'Project description will appear here'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <ApperIcon name="Loader2" size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ApperIcon name="Plus" size={16} />
                Create Project
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ProjectCreateModal