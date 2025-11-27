import React, { useState, useEffect } from 'react'
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek } from 'date-fns'
import Modal from '@/components/atoms/Modal'
import Input from '@/components/atoms/Input'
import Textarea from '@/components/atoms/Textarea'
import Select from '@/components/atoms/Select'
import Button from '@/components/atoms/Button'
import ApperIcon from '@/components/ApperIcon'
import TagSelector from '@/components/molecules/TagSelector'
import { taskService } from '@/services/api/taskService'
import { cn } from '@/utils/cn'

const RecurringTaskModal = ({ isOpen, onClose, task, onSave, onSaveAndClose, onDelete, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Personal",
    priority: "Medium",
    tags: [],
recurrence: {
      enabled: true,
      pattern: "daily", // daily, weekly, monthly, yearly, custom
      interval: 1,
      daysOfWeek: [], // For weekly: [0,1,2,3,4,5,6] (Sun-Sat)
      monthlyType: "date", // date, day (2nd Tuesday)
      monthlyDate: 1,
      monthlyWeek: 1, // 1st, 2nd, 3rd, 4th, last
      monthlyDay: 1, // Monday=1, Tuesday=2, etc.
      endType: "never", // never, after, date
      endAfterOccurrences: 10,
      endDate: "",
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    }
  })
  
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [previewDates, setPreviewDates] = useState([])

useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "Personal",
        priority: task.priority || "Medium",
        tags: task.tags || [],
        recurrence: task.recurrence ? {
          enabled: true,
          pattern: task.recurrence.pattern || task.recurrence.type || "daily",
          interval: task.recurrence.interval || 1,
          daysOfWeek: task.recurrence.daysOfWeek || task.recurrence.weekdays || [],
          monthlyType: task.recurrence.monthlyType || "date",
          monthlyDate: task.recurrence.monthlyDate || 1,
          monthlyWeek: task.recurrence.monthlyWeek || 1,
          monthlyDay: task.recurrence.monthlyDay || 1,
          endType: task.recurrence.endType || "never",
          endAfterOccurrences: task.recurrence.endAfterOccurrences || task.recurrence.occurrences || 10,
          endDate: task.recurrence.endDate || "",
          startDate: task.recurrence.startDate || format(new Date(), "yyyy-MM-dd'T'HH:mm")
        } : {
          enabled: true,
          pattern: "daily",
          interval: 1,
          daysOfWeek: [],
          monthlyType: "date",
          monthlyDate: 1,
          monthlyWeek: 1,
          monthlyDay: 1,
          endType: "never",
          endAfterOccurrences: 10,
          endDate: "",
          startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        }
      })
    } else {
      // Reset form for new recurring task
      setFormData(prev => ({
        ...prev,
        title: "",
        description: "",
        tags: [],
        recurrence: {
          ...prev.recurrence,
          startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        }
      }))
    }
    
    setErrors({})
    setShowDeleteConfirm(false)
    updatePreview()
  }, [task, isOpen])

  useEffect(() => {
    updatePreview()
  }, [formData.recurrence])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleRecurrenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurrence: { ...prev.recurrence, [field]: value }
    }))
    if (errors[`recurrence.${field}`]) {
      setErrors(prev => ({ ...prev, [`recurrence.${field}`]: null }))
    }
  }

  const handleDayOfWeekToggle = (dayIndex) => {
    const currentDays = formData.recurrence.daysOfWeek
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort()
    
    handleRecurrenceChange('daysOfWeek', newDays)
  }

  const handleTagsChange = (newTags) => {
    setFormData(prev => ({ ...prev, tags: newTags }))
  }

  const updatePreview = () => {
    try {
      const { recurrence } = formData
      if (!recurrence.startDate) return

      const dates = generatePreviewDates(recurrence, 5)
      setPreviewDates(dates)
    } catch (error) {
      setPreviewDates([])
    }
  }

  const generatePreviewDates = (recurrence, count = 5) => {
    const dates = []
    let currentDate = new Date(recurrence.startDate)
    const { pattern, interval, daysOfWeek, monthlyType, monthlyDate, monthlyWeek, monthlyDay } = recurrence

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        dates.push(new Date(currentDate))
      } else {
        switch (pattern) {
          case 'daily':
            currentDate = addDays(currentDate, interval)
            break
          case 'weekly':
if (daysOfWeek.length > 0) {
              // Find next occurrence in selected days
              let nextDate = addDays(currentDate, 1)
              while (!daysOfWeek.includes(nextDate.getDay())) {
                nextDate = addDays(nextDate, 1)
              }
              currentDate = nextDate
            } else {
              currentDate = addWeeks(currentDate, interval)
            }
            break
          case 'monthly':
            if (monthlyType === 'date') {
              currentDate = addMonths(currentDate, interval)
            } else {
              // Day-based (e.g., 2nd Tuesday)
              currentDate = addMonths(currentDate, interval)
              // This is a simplified version - full implementation would calculate nth weekday
            }
            break
          case 'yearly':
            currentDate = addYears(currentDate, interval)
            break
          case 'custom':
            currentDate = addDays(currentDate, interval)
            break
          default:
            return dates
        }
        dates.push(new Date(currentDate))
      }
    }

    return dates
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    }

    if (!formData.recurrence.startDate) {
      newErrors['recurrence.startDate'] = "Start date is required"
    }

    if (formData.recurrence.pattern === 'weekly' && formData.recurrence.daysOfWeek.length === 0) {
      newErrors['recurrence.daysOfWeek'] = "Select at least one day of the week"
    }

    if (formData.recurrence.endType === 'after' && (!formData.recurrence.endAfterOccurrences || formData.recurrence.endAfterOccurrences < 1)) {
      newErrors['recurrence.endAfterOccurrences'] = "Number of occurrences must be at least 1"
    }

    if (formData.recurrence.endType === 'date' && !formData.recurrence.endDate) {
      newErrors['recurrence.endDate'] = "End date is required"
    }

    if (formData.recurrence.endType === 'date' && formData.recurrence.endDate && new Date(formData.recurrence.endDate) <= new Date(formData.recurrence.startDate)) {
      newErrors['recurrence.endDate'] = "End date must be after start date"
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
      isRecurring: true,
      recurrence: {
        ...formData.recurrence,
        startDate: new Date(formData.recurrence.startDate).toISOString(),
        endDate: formData.recurrence.endDate ? new Date(formData.recurrence.endDate).toISOString() : null
      }
    }
try {
      await onSave(task?.Id, taskData)
      onClose()
    } catch (error) {
      console.error('Failed to save recurring task:', error)
    }
  }

  const handleDelete = async () => {
    await onDelete(task?.Id)
    setShowDeleteConfirm(false)
  }

  const isEdit = !!task?.Id
  const daysOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Recurring Task" : "Create Recurring Task"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Task Title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          error={errors.title}
          placeholder="What task should repeat?"
          disabled={isLoading}
          autoFocus
        />

        {/* Description */}
        <Textarea
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          error={errors.description}
          placeholder="Add details about this recurring task..."
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
            placeholder="Add tags to organize your recurring task..."
            disabled={isLoading}
          />
        </div>

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

        {/* Recurrence Configuration */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ApperIcon name="RotateCw" size={16} />
            Recurrence Settings
          </h3>

          {/* Start Date */}
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={formData.recurrence.startDate}
            onChange={(e) => handleRecurrenceChange("startDate", e.target.value)}
            error={errors['recurrence.startDate']}
            disabled={isLoading}
          />

          {/* Recurrence Pattern */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Repeat Pattern"
              value={formData.recurrence.pattern}
              onChange={(e) => handleRecurrenceChange("pattern", e.target.value)}
              disabled={isLoading}
            >
              <option value="daily">📅 Daily</option>
              <option value="weekly">📆 Weekly</option>
              <option value="monthly">🗓️ Monthly</option>
              <option value="yearly">📋 Yearly</option>
              <option value="custom">⚙️ Custom</option>
            </Select>

<Input
              label={formData.recurrence.pattern === 'custom' ? 'Every X Days' : 'Every X ' + (formData.recurrence.pattern === 'daily' ? 'day(s)' : formData.recurrence.pattern.slice(0, -2))}
              type="number"
              min="1"
              max="365"
              value={formData.recurrence.interval}
              onChange={(e) => handleRecurrenceChange("interval", parseInt(e.target.value) || 1)}
              disabled={isLoading}
            />
          </div>

          {/* Weekly Days Selection */}
          {formData.recurrence.pattern === 'weekly' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Days of the Week
              </label>
              <div className="flex gap-2">
                {daysOfWeekLabels.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayOfWeekToggle(index)}
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                      formData.recurrence.daysOfWeek.includes(index)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors['recurrence.daysOfWeek'] && (
                <p className="text-red-600 text-sm">{errors['recurrence.daysOfWeek']}</p>
              )}
            </div>
          )}

          {/* Monthly Configuration */}
          {formData.recurrence.pattern === 'monthly' && (
            <div className="space-y-3">
              <Select
                label="Monthly Repeat Type"
                value={formData.recurrence.monthlyType}
                onChange={(e) => handleRecurrenceChange("monthlyType", e.target.value)}
                disabled={isLoading}
              >
                <option value="date">📅 On day of month</option>
                <option value="day">📆 On day of week</option>
              </Select>

              {formData.recurrence.monthlyType === 'date' ? (
                <Input
                  label="Day of Month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.recurrence.monthlyDate}
                  onChange={(e) => handleRecurrenceChange("monthlyDate", parseInt(e.target.value) || 1)}
                  disabled={isLoading}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Week of Month"
                    value={formData.recurrence.monthlyWeek}
                    onChange={(e) => handleRecurrenceChange("monthlyWeek", parseInt(e.target.value))}
                    disabled={isLoading}
                  >
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                    <option value="-1">Last</option>
                  </Select>

                  <Select
                    label="Day of Week"
                    value={formData.recurrence.monthlyDay}
                    onChange={(e) => handleRecurrenceChange("monthlyDay", parseInt(e.target.value))}
                    disabled={isLoading}
                  >
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* End Options */}
          <div className="space-y-3">
            <Select
              label="Ends"
              value={formData.recurrence.endType}
              onChange={(e) => handleRecurrenceChange("endType", e.target.value)}
              disabled={isLoading}
            >
              <option value="never">♾️ Never</option>
              <option value="after">🔢 After X occurrences</option>
              <option value="date">📅 On specific date</option>
            </Select>

            {formData.recurrence.endType === 'after' && (
              <Input
                label="Number of Occurrences"
                type="number"
                min="1"
                max="1000"
                value={formData.recurrence.endAfterOccurrences}
                onChange={(e) => handleRecurrenceChange("endAfterOccurrences", parseInt(e.target.value) || 1)}
                error={errors['recurrence.endAfterOccurrences']}
                disabled={isLoading}
              />
            )}

            {formData.recurrence.endType === 'date' && (
              <Input
                label="End Date"
                type="date"
                value={formData.recurrence.endDate}
                onChange={(e) => handleRecurrenceChange("endDate", e.target.value)}
                error={errors['recurrence.endDate']}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Preview */}
        {previewDates.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <ApperIcon name="Eye" size={16} />
              Next Occurrences Preview
            </h4>
            <div className="space-y-1">
{previewDates.slice(0, 5).map((date, index) => (
                <div key={index} className="text-sm text-blue-800">
                  {index + 1}. {(() => {
                    try {
                      if (!date || isNaN(date.getTime())) return 'Invalid date'
                      return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a')
                    } catch (error) {
                      return 'Invalid date'
                    }
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <span className="text-sm text-red-600 font-medium">Delete recurring task?</span>
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
                <ApperIcon name="RotateCw" size={16} />
              )}
              {isEdit ? "Update Recurring Task" : "Create Recurring Task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default RecurringTaskModal