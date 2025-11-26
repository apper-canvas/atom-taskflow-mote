import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Modal from '@/components/atoms/Modal'
import Input from '@/components/atoms/Input'
import Textarea from '@/components/atoms/Textarea'
import Select from '@/components/atoms/Select'
import Button from '@/components/atoms/Button'
import ApperIcon from '@/components/ApperIcon'
import TagSelector from '@/components/molecules/TagSelector'
import taskService from '@/services/api/taskService'

const TaskEditModal = ({ isOpen, onClose, task, onSave, onDelete, isLoading = false }) => {
const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Personal",
    priority: "Medium",
    dueDate: "",
    parentTaskId: null,
    tags: []
  })
  
  const [availableTasks, setAvailableTasks] = useState([])
  const [isSubtaskMode, setIsSubtaskMode] = useState(false)
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
if (task) {
setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "Personal",
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
        parentTaskId: task.parentTaskId || null,
        tags: task.tags || []
      })
      setIsSubtaskMode(!!task.parentTaskId)
    } else {
      // Check if we're creating a subtask (parentTaskId passed via task prop)
      if (task?.parentTaskId) {
        setFormData(prev => ({
          ...prev,
          parentTaskId: task.parentTaskId,
          category: task.category || prev.category,
          priority: task.priority || prev.priority
        }))
        setIsSubtaskMode(true)
      }
    }
    
    // Load available parent tasks for subtask creation
    loadAvailableTasks()
    setErrors({})
    setShowDeleteConfirm(false)
  }, [task, isOpen])

const loadAvailableTasks = async () => {
    try {
      const allTasks = await taskService.getAll()
      // Only show top-level tasks (not subtasks) as potential parents
      const parentTasks = allTasks.filter(t => !t.parentTaskId && !t.completed)
      setAvailableTasks(parentTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
    
    // Toggle subtask mode when parentTaskId changes
    if (field === 'parentTaskId') {
      setIsSubtaskMode(!!value)
    }
  }

  const handleTagsChange = (newTags) => {
    setFormData(prev => ({ ...prev, tags: newTags }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    }
    
    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = "Due date cannot be in the past"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

const taskData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      parentTaskId: formData.parentTaskId ? parseInt(formData.parentTaskId) : null,
      tags: formData.tags
    }

    await onSave(task?.Id, taskData)
  }

  const handleDelete = async () => {
    await onDelete(task?.Id)
    setShowDeleteConfirm(false)
  }

  const isEdit = !!task?.Id

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Task" : "Create New Task"}
      size="lg"
    >
<form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent Task Selection for Subtasks */}
        {(!task || !task.Id) && (
          <Select
            label="Task Type"
            value={formData.parentTaskId || ""}
            onChange={(e) => handleInputChange("parentTaskId", e.target.value)}
            disabled={isLoading}
          >
            <option value="">📝 Main Task</option>
            {availableTasks.map(parentTask => (
              <option key={parentTask.Id} value={parentTask.Id}>
                📋 Subtask of "{parentTask.title}"
              </option>
            ))}
          </Select>
        )}

        {/* Subtask indicator for existing subtasks */}
        {isSubtaskMode && task?.Id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <ApperIcon name="ArrowRight" size={16} />
              <span className="text-sm font-medium">This is a subtask</span>
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label={isSubtaskMode ? "Subtask Title" : "Task Title"}
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          error={errors.title}
          placeholder={isSubtaskMode ? "What step needs to be completed?" : "What needs to be done?"}
          disabled={isLoading}
          autoFocus
        />

        {/* Description */}
        <Textarea
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          error={errors.description}
          placeholder={isSubtaskMode ? "Add details about this step..." : "Add more details about this task..."}
          rows={3}
          disabled={isLoading}
        />

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tags (Optional)
          </label>
          <TagSelector
            selectedTags={formData.tags}
            onChange={handleTagsChange}
            placeholder="Add tags to organize your task..."
            disabled={isLoading}
          />
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            disabled={isLoading || isSubtaskMode}
          >
            <option value="Personal">🏠 Personal</option>
            <option value="Work">💼 Work</option>
            <option value="Other">📂 Other</option>
          </Select>

          <Select
            label="Priority"
            value={formData.priority}
            onChange={(e) => handleInputChange("priority", e.target.value)}
            disabled={isLoading}
          >
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </Select>
        </div>

        {/* Due Date */}
        <Input
          label="Due Date (Optional)"
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => handleInputChange("dueDate", e.target.value)}
          error={errors.dueDate}
          disabled={isLoading}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          {/* Delete Button (only for existing tasks) */}
          {isEdit && (
            <div>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <ApperIcon name="Trash2" size={16} />
                  Delete
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 font-medium">Delete this task?</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ApperIcon name="Loader2" size={14} className="animate-spin" />
                    ) : (
                      <ApperIcon name="Trash2" size={14} />
                    )}
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Save/Cancel Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <ApperIcon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <ApperIcon name="Save" size={16} />
              )}
              {isEdit ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default TaskEditModal