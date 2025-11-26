import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Modal from '@/components/atoms/Modal'
import Badge from '@/components/atoms/Badge'
import tagService from '@/services/api/tagService'
import toast from '@/utils/toast'
import { cn } from '@/utils/cn'

const TagManager = ({ isOpen, onClose, onTagsChange }) => {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [deletingTagId, setDeletingTagId] = useState(null)

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'Tag'
  })
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)

  // Available colors and icons
  const availableColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  const availableIcons = [
    'Tag', 'Star', 'Flag', 'Bookmark', 'Heart', 'Zap',
    'AlertCircle', 'Users', 'Search', 'Lightbulb', 
    'Calendar', 'Eye', 'Shield', 'Rocket'
  ]

  // Load tags
  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await tagService.getAll()
      setTags(data)
    } catch (error) {
toast.error('Failed to load tags')
      console.error('Error loading tags:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter tags based on search
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle create/edit form
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = 'Tag name is required'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setFormLoading(true)
      
      if (editingTag) {
        // Update existing tag
        await tagService.update(editingTag.Id, formData)
toast.success('Tag updated successfully')
      } else {
        // Create new tag
        await tagService.create(formData)
toast.success('Tag created successfully')
      }
      
      // Reload tags and close modal
      await loadTags()
      handleCloseForm()
      
      // Notify parent of changes
      if (onTagsChange) {
        onTagsChange()
      }
    } catch (error) {
toast.error(error.message || 'Failed to save tag')
      setFormErrors({ submit: error.message })
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      icon: tag.icon
    })
    setFormErrors({})
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (tagId) => {
    try {
      setDeletingTagId(tagId)
      await tagService.delete(tagId)
toast.success('Tag deleted successfully')
      
      // Reload tags
      await loadTags()
      
      // Notify parent of changes
      if (onTagsChange) {
        onTagsChange()
      }
    } catch (error) {
toast.error(error.message || 'Failed to delete tag')
    } finally {
      setDeletingTagId(null)
    }
  }

  const handleCloseForm = () => {
    setIsCreateModalOpen(false)
    setEditingTag(null)
    setFormData({ name: '', color: '#3b82f6', icon: 'Tag' })
    setFormErrors({})
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  return (
    <>
      {/* Main Tag Manager Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Tags"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header with search and create button */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Plus" size={16} />
              Create Tag
            </Button>
          </div>

          {/* Tags List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-600">Loading tags...</p>
              </div>
            ) : filteredTags.length > 0 ? (
              <div className="grid gap-2">
                <AnimatePresence>
                  {filteredTags.map((tag) => (
                    <motion.div
                      key={tag.Id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <ApperIcon name={tag.icon} size={16} className="text-gray-600" />
                        <span className="font-medium text-gray-900">{tag.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                          className="p-2 hover:bg-blue-100 text-blue-600"
                        >
                          <ApperIcon name="Edit" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tag.Id)}
                          disabled={deletingTagId === tag.Id}
                          className="p-2 hover:bg-red-100 text-red-600 disabled:opacity-50"
                        >
                          {deletingTagId === tag.Id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ApperIcon name="Trash2" size={14} />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8">
                <ApperIcon name="Tag" size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">
                  {searchTerm ? 'No tags found matching your search' : 'No tags created yet'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm ? 'Try a different search term' : 'Create your first tag to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create/Edit Tag Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseForm}
        title={editingTag ? 'Edit Tag' : 'Create New Tag'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Tag Name */}
          <Input
            label="Tag Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={formErrors.name}
            placeholder="e.g., urgent, meeting, research"
            disabled={formLoading}
            autoFocus
          />

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    formData.color === color 
                      ? "border-gray-800 scale-110" 
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color }}
                  disabled={formLoading}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Icon
            </label>
            <div className="grid grid-cols-7 gap-2">
              {availableIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleInputChange('icon', icon)}
                  className={cn(
                    "p-2 rounded-lg border transition-all",
                    formData.icon === icon 
                      ? "border-blue-500 bg-blue-50 text-blue-600" 
                      : "border-gray-300 hover:border-gray-400 text-gray-600"
                  )}
                  disabled={formLoading}
                >
                  <ApperIcon name={icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Preview
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Badge
                style={{ 
                  backgroundColor: formData.color + '20',
                  color: formData.color,
                  borderColor: formData.color
                }}
                className="border"
              >
                <ApperIcon name={formData.icon} size={12} />
                {formData.name || 'Tag Name'}
              </Badge>
            </div>
          </div>

          {/* Submit Error */}
          {formErrors.submit && (
            <div className="text-red-600 text-sm">{formErrors.submit}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseForm}
              disabled={formLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formLoading || !formData.name.trim()}
              className="flex-1"
            >
              {formLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editingTag ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                editingTag ? 'Update Tag' : 'Create Tag'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default TagManager