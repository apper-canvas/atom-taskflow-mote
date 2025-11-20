import { useState, useEffect } from "react"
import { format } from "date-fns"
import Modal from "@/components/atoms/Modal"
import Input from "@/components/atoms/Input"
import Textarea from "@/components/atoms/Textarea"
import Select from "@/components/atoms/Select"
import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"

const TaskEditModal = ({ isOpen, onClose, task, onSave, onDelete, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Personal",
    priority: "Medium",
    dueDate: ""
  })
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "Personal",
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : ""
      })
    }
    setErrors({})
    setShowDeleteConfirm(false)
  }, [task, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
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
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
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
        {/* Title */}
        <Input
          label="Task Title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          error={errors.title}
          placeholder="What needs to be done?"
          disabled={isLoading}
          autoFocus
        />

        {/* Description */}
        <Textarea
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          error={errors.description}
          placeholder="Add more details about this task..."
          rows={3}
          disabled={isLoading}
        />

        {/* Category and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            disabled={isLoading}
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