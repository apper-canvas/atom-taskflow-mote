import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { taskService } from "@/services/api/taskService";
import { projectService } from "@/services/api/projectService";
import ApperIcon from "@/components/ApperIcon";
import Textarea from "@/components/atoms/Textarea";
import Modal from "@/components/atoms/Modal";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import FileAttachmentManager from "@/components/molecules/FileAttachmentManager";
import RecurringTaskModal from "@/components/molecules/RecurringTaskModal";
import FilePreviewModal from "@/components/molecules/FilePreviewModal";
import TagSelector from "@/components/molecules/TagSelector";
import NotificationBell from "@/components/molecules/NotificationBell";
import QuickTemplateSelector from "@/components/molecules/QuickTemplateSelector";
// Mock users data - in real app, this would come from user service
const mockUsers = [
  { id: 1, name: "John Smith", email: "john@company.com" },
  { id: 2, name: "Sarah Johnson", email: "sarah@company.com" },
  { id: 3, name: "Mike Chen", email: "mike@company.com" },
  { id: 4, name: "Lisa Wong", email: "lisa@company.com" },
  { id: 5, name: "David Brown", email: "david@company.com" }
];

const TaskEditModal = ({ isOpen, onClose, task, onSave, onDelete, isLoading = false }) => {
const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    status: "",
    dueDate: "",
    dueDateTime: "",
    reminderEnabled: false,
    reminderDateTime: "",
    reminderMethod: "notification",
    parentTaskId: null,
    tags: [],
    isRecurring: false,
    recurrence: null,
    assignedTo: null,
    projectId: null,
    reminders: [
      { type: "on_due", enabled: false },
      { type: "1_day_before", enabled: false },
      { type: "1_hour_before", enabled: false },
      { type: "custom", enabled: false, minutes: 60 }
    ],
    estimatedTime: null,
    actualTime: 0,
    timeSpent: 0,
    notes: "",
    attachments: [],
    linkedTasks: []
  });

  const [showQuickTemplates, setShowQuickTemplates] = useState(false)
  
const [availableTasks, setAvailableTasks] = useState([])
  const [isSubtaskMode, setIsSubtaskMode] = useState(false)
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
useEffect(() => {
if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "Personal",
        priority: task.priority || "Medium",
        status: task.status || "Not Started",
dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
        reminderEnabled: task.reminderEnabled || false,
        reminderDateTime: task.reminderDateTime ? format(new Date(task.reminderDateTime), "yyyy-MM-dd'T'HH:mm") : "",
        reminderMethod: task.reminderMethod || "notification",
        dueDateTime: task.dueDateTime ? format(new Date(task.dueDateTime), "yyyy-MM-dd'T'HH:mm") : "",
        parentTaskId: task.parentTaskId || null,
        tags: task.tags || [],
        isRecurring: task.isRecurring || false,
        recurrence: task.recurrence || null,
        assignedTo: task.assignedTo || null,
        reminders: task.reminders || [
          { type: "on_due", enabled: false },
          { type: "1_day_before", enabled: false },
          { type: "1_hour_before", enabled: false },
          { type: "custom", enabled: false, minutes: 60 }
        ],
        estimatedTime: task.estimatedTime || null,
        actualTime: task.actualTime || 0,
        timeSpent: task.timeSpent || 0,
        notes: task.notes || "",
attachments: task.attachments || [],
        projectId: task.projectId || null,
        linkedTasks: task.linkedTasks || []
      });
      setIsSubtaskMode(!!task.parentTaskId)
} else {
      // Check if we're creating a subtask (parentTaskId passed via task prop)
      if (task?.parentTaskId) {
        setFormData(prev => ({
          ...prev,
          parentTaskId: task.parentTaskId
        }))
        setIsSubtaskMode(true)
      }
    }
    
    // Load available parent tasks for subtask creation
    loadAvailableTasks()
    setErrors({})
    setShowDeleteConfirm(false)
    setShowRecurringModal(false)
  }, [task, isOpen])

const [availableProjects, setAvailableProjects] = useState([])

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

  const loadAvailableProjects = async () => {
    try {
      const projects = await projectService.getAll()
      // Only show active projects
      const activeProjects = projects.filter(p => p.status === 'Active')
      setAvailableProjects(activeProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
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
    // When project changes, inherit project's default category if available
    if (field === 'projectId' && value) {
      const selectedProject = availableProjects.find(p => p.Id === parseInt(value))
      if (selectedProject && selectedProject.defaultCategory && !isSubtaskMode) {
        setFormData(prev => ({ ...prev, category: selectedProject.defaultCategory }))
      }
    }
  }

  const handleRecurringToggle = () => {
    if (formData.isRecurring) {
      // Disable recurring
      setFormData(prev => ({
        ...prev,
        isRecurring: false,
        recurrence: null
      }))
    } else {
      // Enable recurring - open modal
      setShowRecurringModal(true)
    }
  }

  const handleRecurringSave = (taskId, recurringData) => {
    setFormData(prev => ({
      ...prev,
      isRecurring: true,
      recurrence: recurringData.recurrence
    }))
setShowRecurringModal(false)
  }

const [previewFile, setPreviewFile] = useState(null);

  const handleAttachmentsChange = (newAttachments) => {
    setFormData(prev => ({
      ...prev,
      attachments: newAttachments
    }));
  };

  const handleFilePreview = (file) => {
    setPreviewFile(file);
  };


  const handleTaskSearch = async (e) => {
    const searchTerm = e.target.value;
    if (searchTerm.length > 2) {
      try {
        const allTasks = await taskService.getAll();
        const filteredTasks = allTasks.filter(t => 
          t.Id !== task?.Id && 
          t.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        // Show search results (implementation depends on UI needs)
      } catch (error) {
        console.error('Error searching tasks:', error);
      }
    }
  };

  const addLinkedTask = (taskToLink, relationType = 'related') => {
    const linkedTask = {
      Id: taskToLink.Id,
      title: taskToLink.title,
      type: relationType
    };
    setFormData(prev => ({
      ...prev,
      linkedTasks: [...prev.linkedTasks, linkedTask]
    }));
  };

  const removeLinkedTask = (index) => {
    setFormData(prev => ({
      ...prev,
      linkedTasks: prev.linkedTasks.filter((_, i) => i !== index)
    }));
  };

  const updateLinkedTaskType = (index, newType) => {
    setFormData(prev => ({
      ...prev,
      linkedTasks: prev.linkedTasks.map((task, i) => 
        i === index ? { ...task, type: newType } : task
      )
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
      title: formData.title.trim(),
      description: formData.description.trim(),
dueDate: formData.dueDateTime ? new Date(formData.dueDateTime).toISOString() : null,
      reminderEnabled: formData.reminderEnabled,
      reminderDateTime: formData.reminderEnabled && formData.reminderDateTime ? new Date(formData.reminderDateTime).toISOString() : null,
      reminderMethod: formData.reminderMethod,
      dueDateTime: formData.dueDateTime ? new Date(formData.dueDateTime).toISOString() : null,
      parentTaskId: formData.parentTaskId ? parseInt(formData.parentTaskId) : null,
      tags: formData.tags,
      isRecurring: formData.isRecurring,
      recurrence: formData.recurrence,
      assignedTo: formData.assignedTo,
      reminders: formData.reminders,
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
      actualTime: formData.actualTime || 0,
      timeSpent: formData.timeSpent || 0,
      notes: formData.notes.trim(),
      attachments: formData.attachments,
linkedTasks: formData.linkedTasks
    };

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
      <div className="p-6">
        {/* Template Selection Option */}
        {(!task || !task.Id) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Start from Template</h4>
                <p className="text-sm text-blue-700">Save time by using a pre-built task template</p>
              </div>
              <Button
                type="button"
                onClick={() => setShowQuickTemplates(!showQuickTemplates)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ApperIcon name="Layout" size={16} />
                Use Template
              </Button>
            </div>
            
            {showQuickTemplates && (
              <div className="mt-3 relative">
                <QuickTemplateSelector
                  isVisible={showQuickTemplates}
                  onSelectTemplate={(templateTask) => {
                    // Fill form with template data
                    setFormData({
                      ...formData,
                      title: templateTask.title,
                      description: templateTask.description,
                      category: templateTask.category,
                      priority: templateTask.priority,
                      tags: templateTask.tags || []
                    })
                    setShowQuickTemplates(false)
                  }}
                  onCancel={() => setShowQuickTemplates(false)}
                />
              </div>
            )}
          </div>
        )}
      
        <div className="space-y-4">
        {/* Project Selection */}
<form onSubmit={handleSubmit} className="space-y-6">
        {/* Parent Task Selection for Subtasks */}
{/* Project Selection */}
        {(!task || !task.Id) && (
          <Select
            label="Project"
            value={formData.projectId || ""}
            onChange={(e) => handleInputChange("projectId", e.target.value)}
            disabled={isLoading}
          >
            <option value="">No Project</option>
            {availableProjects.map(project => (
              <option key={project.Id} value={project.Id}>
                <span style={{color: project.color}}>{project.icon || '📂'}</span> {project.name}
              </option>
            ))}
          </Select>
        )}

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

        {/* Notes */}
        <Textarea
          label="Notes & Comments (Optional)"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          error={errors.notes}
          placeholder="Add notes, comments, or additional context..."
          rows={4}
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

{/* File Attachments */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            File Attachments (Optional)
          </label>
          <FileAttachmentManager
            attachments={formData.attachments}
            onChange={handleAttachmentsChange}
            maxFileSize={10 * 1024 * 1024} // 10MB
            maxFiles={10}
          />
        </div>

        {/* Task Linking */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Related Tasks (Optional)
          </label>
          <div className="border border-gray-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ApperIcon name="Search" size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks to link..."
                className="flex-1 border-0 focus:ring-0 text-sm"
                onChange={handleTaskSearch}
              />
            </div>
            {formData.linkedTasks.length > 0 && (
              <div className="space-y-1 mt-2">
                {formData.linkedTasks.map((linkedTask, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <ApperIcon name="Link" size={14} />
                      <span className="text-sm text-gray-700">{linkedTask.title}</span>
                      <select
                        value={linkedTask.type}
                        onChange={(e) => updateLinkedTaskType(index, e.target.value)}
                        className="text-xs border-gray-300 rounded px-2 py-1"
                      >
                        <option value="related">Related</option>
                        <option value="depends_on">Depends on</option>
                        <option value="blocks">Blocks</option>
                        <option value="duplicate">Duplicate</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLinkedTask(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <ApperIcon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recurring Task Toggle */}
        {!isSubtaskMode && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Recurring Task</label>
                <p className="text-xs text-gray-500">Set up this task to repeat on a schedule</p>
              </div>
              <div className="flex items-center gap-3">
                {formData.isRecurring && formData.recurrence && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                    ✓ Configured
                  </span>
                )}
                <Button
                  type="button"
                  variant={formData.isRecurring ? "secondary" : "ghost"}
                  size="sm"
                  onClick={handleRecurringToggle}
                  disabled={isLoading}
                >
                  <ApperIcon name="RotateCw" size={16} />
                  {formData.isRecurring ? "Edit Schedule" : "Make Recurring"}
                </Button>
              </div>
            </div>
            {formData.isRecurring && formData.recurrence && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <strong>Schedule:</strong> {formData.recurrence.pattern} every {formData.recurrence.interval} 
                {formData.recurrence.pattern === 'weekly' && formData.recurrence.daysOfWeek.length > 0 && (
                  <span> on {formData.recurrence.daysOfWeek.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</span>
                )}
              </div>
            )}
          </div>
        )}

{/* Assignment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned To
          </label>
          <Select
            value={formData.assignedTo?.id || ""}
            onChange={(e) => {
              const userId = e.target.value
              const user = mockUsers.find(u => u.id === parseInt(userId))
              handleInputChange("assignedTo", user || null)
            }}
            disabled={isLoading}
          >
            <option value="">👤 Assign to yourself</option>
            {mockUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
</Select>
        </div>

{/* Due Date and Time */}
<div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date & Time
          </label>
          <Input
            type="datetime-local"
            value={formData.dueDateTime}
            onChange={(e) => handleInputChange("dueDateTime", e.target.value)}
            disabled={isLoading}
          />
        </div>

{/* Time Estimation */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes)
            </label>
            <Input
              type="number"
              value={formData.estimatedTime || ""}
              onChange={(e) => handleInputChange("estimatedTime", e.target.value)}
              placeholder="120"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Spent (minutes)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.timeSpent || 0}
                onChange={(e) => handleInputChange("timeSpent", parseInt(e.target.value) || 0)}
                disabled={isLoading}
              />
              {task?.Id && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Toggle time tracking functionality would go here
                    const isTracking = !task.isTracking
                    console.log("Toggle time tracking:", isTracking)
                  }}
                >
                  {task.isTracking ? "⏸️" : "▶️"}
                </Button>
              )}
            </div>
            {formData.estimatedTime && formData.timeSpent > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((formData.timeSpent / formData.estimatedTime) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      formData.timeSpent > formData.estimatedTime ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min((formData.timeSpent / formData.estimatedTime) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reminders */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminders
          </label>
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            {formData.reminders.map((reminder, index) => (
              <div key={reminder.type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reminder.enabled}
                  onChange={(e) => {
                    const newReminders = [...formData.reminders]
                    newReminders[index].enabled = e.target.checked
                    handleInputChange("reminders", newReminders)
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">
                  {reminder.type === "on_due" && "On due date"}
                  {reminder.type === "1_day_before" && "1 day before"}
                  {reminder.type === "1_hour_before" && "1 hour before"}
                  {reminder.type === "custom" && "Custom:"}
                </span>
                {reminder.type === "custom" && (
                  <input
                    type="number"
                    value={reminder.minutes}
                    onChange={(e) => {
                      const newReminders = [...formData.reminders]
                      newReminders[index].minutes = parseInt(e.target.value) || 60
                      handleInputChange("reminders", newReminders)
                    }}
                    className="w-16 px-2 py-1 text-xs border rounded"
                    placeholder="60"
                  />
                )}
                {reminder.type === "custom" && <span className="text-xs text-gray-500">minutes before</span>}
              </div>
            ))}
          </div>
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
            <option value="Urgent">🚨 Urgent</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </Select>
        </div>

        {/* Status Field */}
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => handleInputChange("status", e.target.value)}
          disabled={isLoading}
        >
          <option value="Not Started">⏸️ Not Started</option>
          <option value="In Progress">🔄 In Progress</option>
          <option value="Completed">✅ Completed</option>
          <option value="On Hold">⏸️ On Hold</option>
          <option value="Cancelled">❌ Cancelled</option>
        </Select>

        {/* Due Date */}
        <Input
          label="Due Date (Optional)"
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => handleInputChange("dueDate", e.target.value)}
          error={errors.dueDate}
          disabled={isLoading}
        />

        {/* Reminder Section */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Reminder Options
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={formData.reminderEnabled}
                onChange={(e) => handleInputChange("reminderEnabled", e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="reminderEnabled" className="ml-2 text-sm text-gray-700">
                Enable Reminder
              </label>
            </div>
          </div>

          {formData.reminderEnabled && (
            <div className="space-y-3">
              <Input
                label="Reminder Date & Time"
                type="datetime-local"
                value={formData.reminderDateTime}
                onChange={(e) => handleInputChange("reminderDateTime", e.target.value)}
                disabled={isLoading}
              />

              <Select
                label="Notification Method"
                value={formData.reminderMethod}
                onChange={(e) => handleInputChange("reminderMethod", e.target.value)}
                disabled={isLoading}
              >
                <option value="notification">Browser Notification</option>
                <option value="email">Email Reminder</option>
                <option value="both">Both Notification & Email</option>
              </Select>
            </div>
          )}
        </div>

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
{/* Recurring Task Configuration Modal */}
      <RecurringTaskModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        task={formData.isRecurring ? { ...formData } : null}
        onSave={handleRecurringSave}
        isLoading={isLoading}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
onClose={() => setPreviewFile(null)}
      />
        </div>
      </div>
    </Modal>
  );
}

export default TaskEditModal;