import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projectService } from "@/services/api/projectService";
import { taskService } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Textarea from "@/components/atoms/Textarea";
import Modal from "@/components/atoms/Modal";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Badge from "@/components/atoms/Badge";
import TagSelector from "@/components/molecules/TagSelector";

const TemplateCreateModal = ({ isOpen, onClose, onSubmit, type = "tasks" }) => {
const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: type === 'tasks' ? 'General' : 'Business',
    icon: type === 'tasks' ? '📝' : '📁',
    isPublic: false,
    tags: [],
    defaults: {
      title: '',
      description: '',
      category: type === 'tasks' ? 'Personal' : 'Work',
      priority: 'Medium',
      status: type === 'tasks' ? 'Not Started' : 'Active',
      projectId: null,
      tags: [],
      estimatedTime: null,
      assignedTo: null,
      color: type === 'projects' ? '#3b82f6' : undefined,
      settings: type === 'projects' ? {
        isPublic: false,
        allowMemberInvites: true,
        requireApproval: false
      } : undefined
    },
    subtasks: type === 'tasks' ? [] : undefined,
    tasks: type === 'projects' ? [] : undefined
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState([])
const [showSubtasks, setShowSubtasks] = useState(false)
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '', priority: 'Medium' })
  const [showTasks, setShowTasks] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', category: 'Work', estimatedTime: null })
  useEffect(() => {
    if (isOpen) {
loadCategories()
      resetForm()
    }
  }, [isOpen, type])

  const loadCategories = async () => {
    try {
      const categoryData = type === 'tasks' 
        ? await taskService.getTemplateCategories()
        : await projectService.getTemplateCategories()
      setCategories(categoryData)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const resetForm = () => {
setFormData({
      name: '',
      description: '',
      category: type === 'tasks' ? 'General' : 'Business',
      icon: type === 'tasks' ? '📝' : '📁',
      isPublic: false,
      tags: [],
      defaults: {
        title: '',
        description: '',
        category: type === 'tasks' ? 'Personal' : 'Work',
        priority: 'Medium',
        status: type === 'tasks' ? 'Not Started' : 'Active',
        projectId: null,
        tags: [],
        estimatedTime: null,
        assignedTo: null,
        color: type === 'projects' ? '#3b82f6' : undefined,
        settings: type === 'projects' ? {
          isPublic: false,
          allowMemberInvites: true,
          requireApproval: false
        } : undefined
      },
      subtasks: type === 'tasks' ? [] : undefined,
      tasks: type === 'projects' ? [] : undefined
    })
    setShowSubtasks(false)
    setShowTasks(false)
    setNewSubtask({ title: '', description: '', priority: 'Medium' })
    setNewTask({ title: '', description: '', priority: 'Medium', category: 'Work', estimatedTime: null })
    setErrors({})
    setNewSubtask({ title: '', description: '', priority: 'Medium' })
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required'
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    if (field.startsWith('defaults.')) {
      const defaultField = field.replace('defaults.', '')
      setFormData(prev => ({
        ...prev,
        defaults: {
          ...prev.defaults,
          [defaultField]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleTagsChange = (tags) => {
    setFormData(prev => ({ ...prev, tags }))
  }

  const handleDefaultTagsChange = (tags) => {
    setFormData(prev => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        tags
      }
    }))
  }

  const handleAddSubtask = () => {
    if (!newSubtask.title.trim()) return
    
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { ...newSubtask, id: Date.now() }]
    }))
    setNewSubtask({ title: '', description: '', priority: 'Medium' })
  }

  const handleRemoveSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }))
}

  const handleAddTask = () => {
    if (!newTask.title.trim()) return
    
    setFormData(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), { ...newTask, id: Date.now() }]
    }))
    setNewTask({ title: '', description: '', priority: 'Medium', category: 'Work', estimatedTime: null })
  }

  const handleRemoveTask = (taskId) => {
    setFormData(prev => ({
      ...prev,
      tasks: (prev.tasks || []).filter(task => task.id !== taskId)
    }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Failed to create template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const iconOptions = type === 'tasks' 
    ? ['📝', '✅', '🎯', '⚡', '🔥', '💡', '🚀', '📋', '🔧', '📊']
    : ['📁', '🏢', '🚀', '💼', '🎯', '📈', '🔬', '🎨', '⚙️', '📊']

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create {type === 'tasks' ? 'Task' : 'Project'} Template
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Save time by creating reusable templates
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="e.g., Daily Standup Meeting"
              disabled={isLoading}
              required
            />
            
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              error={errors.category}
              disabled={isLoading}
              required
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this template is for and when to use it..."
            rows={3}
            disabled={isLoading}
          />

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleInputChange('icon', icon)}
                  className={`p-2 text-xl rounded-lg border-2 transition-colors duration-200 ${
                    formData.icon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Template Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Tags
            </label>
            <TagSelector
              selectedTags={formData.tags}
              onChange={handleTagsChange}
              placeholder="Add tags to organize this template..."
              disabled={isLoading}
            />
          </div>

          {/* Default Values Section */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Default Values</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set default values that will be pre-filled when using this template
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Default Title"
                value={formData.defaults.title}
                onChange={(e) => handleInputChange('defaults.title', e.target.value)}
                placeholder="Leave empty to use template name"
                disabled={isLoading}
              />
              
              <Select
                label="Default Priority"
                value={formData.defaults.priority}
                onChange={(e) => handleInputChange('defaults.priority', e.target.value)}
                disabled={isLoading}
              >
                <option value="Urgent">🚨 Urgent</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </Select>
            </div>

            <Textarea
              label="Default Description"
              value={formData.defaults.description}
              onChange={(e) => handleInputChange('defaults.description', e.target.value)}
              placeholder="Default description for tasks created from this template..."
              rows={2}
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tags
              </label>
              <TagSelector
                selectedTags={formData.defaults.tags}
                onChange={handleDefaultTagsChange}
                placeholder="Tags that will be applied to tasks from this template..."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Subtasks Section (for task templates) */}
{type === 'tasks' && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Template Subtasks</h3>
                <Button
                  type="button"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  variant="outline"
                  size="sm"
                >
                  <ApperIcon name={showSubtasks ? "ChevronUp" : "ChevronDown"} size={16} />
                  {showSubtasks ? 'Hide' : 'Add'} Subtasks
                </Button>
              </div>

              <AnimatePresence>
                {showSubtasks && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        placeholder="Subtask title..."
                        value={newSubtask.title}
                        onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newSubtask.description}
                        onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <div className="flex items-center gap-2">
                        <Select
                          value={newSubtask.priority}
                          onChange={(e) => setNewSubtask(prev => ({ ...prev, priority: e.target.value }))}
                          className="flex-1"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </Select>
                        <Button
                          type="button"
                          onClick={handleAddSubtask}
                          size="sm"
                          disabled={!newSubtask.title.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {formData.subtasks && formData.subtasks.length > 0 && (
                      <div className="space-y-2">
                        {formData.subtasks.map(subtask => (
                          <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{subtask.title}</div>
                              {subtask.description && (
                                <div className="text-xs text-gray-600">{subtask.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" size="sm">{subtask.priority}</Badge>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubtask(subtask.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <ApperIcon name="X" size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {type === 'projects' && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Default Project Tasks</h3>
                <Button
                  type="button"
                  onClick={() => setShowTasks(!showTasks)}
                  variant="outline"
                  size="sm"
                >
                  <ApperIcon name={showTasks ? "ChevronUp" : "ChevronDown"} size={16} />
                  {showTasks ? 'Hide' : 'Add'} Tasks
                </Button>
              </div>

              <AnimatePresence>
                {showTasks && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      <Input
                        placeholder="Task title..."
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      />
                      <Select
                        value={newTask.priority}
                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Est. time (min)"
                          value={newTask.estimatedTime || ''}
                          onChange={(e) => setNewTask(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || null }))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleAddTask}
                          size="sm"
                          disabled={!newTask.title.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {formData.tasks && formData.tasks.length > 0 && (
                      <div className="space-y-2">
                        {formData.tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-gray-600">{task.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" size="sm">{task.priority}</Badge>
                              {task.estimatedTime && (
                                <span className="text-xs text-gray-500">{task.estimatedTime}min</span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveTask(task.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <ApperIcon name="X" size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TemplateCreateModal