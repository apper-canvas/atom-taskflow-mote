import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Badge from "@/components/atoms/Badge";
import { cn } from "@/utils/cn";
import { taskService } from "@/services/api/taskService";
import { toast } from "@/utils/toast";
const TaskCard = ({ task, onToggleComplete, onEdit, onDelete, onToggleSubtask, onCreateSubtask }) => {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [subtasks, setSubtasks] = useState([])
  const [loadingSubtasks, setLoadingSubtasks] = useState(false)

  // Check if this task has subtasks or subtask progress
  const hasSubtasks = task.subtaskCount > 0 || task.parentTaskId
  const isParentTask = task.subtaskCount > 0
  const isSubtask = !!task.parentTaskId

  useEffect(() => {
    if (showSubtasks && isParentTask && subtasks.length === 0) {
      loadSubtasks()
    }
  }, [showSubtasks, isParentTask])

  const loadSubtasks = async () => {
    if (loadingSubtasks) return
    
    try {
      setLoadingSubtasks(true)
      const taskSubtasks = await taskService.getSubtasks(task.Id)
      setSubtasks(taskSubtasks)
    } catch (error) {
      console.error('Failed to load subtasks:', error)
      toast.error('Failed to load subtasks')
    } finally {
      setLoadingSubtasks(false)
    }
  }

  const handleToggleSubtasks = () => {
    setShowSubtasks(!showSubtasks)
  }

  const handleCreateSubtask = () => {
    onCreateSubtask?.(task.Id)
  }

  const handleSubtaskToggle = async (subtaskId, completed) => {
    if (onToggleSubtask) {
      await onToggleSubtask(subtaskId, completed, task.Id)
      // Reload subtasks to get updated data
      loadSubtasks()
    }
  }
  const [isCompleting, setIsCompleting] = useState(false)

  const handleToggleComplete = async () => {
    setIsCompleting(true)
    await onToggleComplete(task.Id, !task.completed)
    setTimeout(() => setIsCompleting(false), 400)
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Personal": return "Home"
      case "Work": return "Briefcase"
      case "Other": return "Folder"
      default: return "Circle"
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "Personal": return "personal"
      case "Work": return "work"
      case "Other": return "other"
      default: return "default"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#ef4444"
      case "Medium": return "#f59e0b"
      case "Low": return "#10b981"
      default: return "#6b7280"
    }
  }

  const formatDueDate = (dateString) => {
    if (!dateString) return null
    
    const date = new Date(dateString)
    const now = new Date()
    
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    
    const isOverdue = isPast(date) && !isToday(date)
    const formatted = format(date, "MMM d")
    
    return { formatted, isOverdue }
  }

  const dueDateInfo = formatDueDate(task.dueDate)
  const isOverdue = dueDateInfo?.isOverdue
  const isDueSoon = dueDateInfo && !isOverdue && (dueDateInfo === "Today" || dueDateInfo === "Tomorrow")

  return (
    <motion.div
    layout
    initial={{
        opacity: 0,
        y: 20
    }}
    animate={{
        opacity: 1,
        y: 0
    }}
    exit={{
        opacity: 0,
        y: -20
    }}
    whileHover={{
        y: -2,
        shadow: "0 8px 25px rgba(0,0,0,0.12)"
    }}
    className={cn(
        "bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition-all duration-200 hover:border-blue-300",
        task.completed && "opacity-60",
        `border-l-4 border-l-[${getPriorityColor(task.priority)}]`
    )}
    style={{
        borderLeftColor: getPriorityColor(task.priority)
    }}>
    <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
            {/* Checkbox */}
            <motion.button
                onClick={handleToggleComplete}
                disabled={isCompleting}
                whileHover={{
                    scale: 1.05
                }}
                whileTap={{
                    scale: 0.95
                }}
                className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center mt-0.5",
                    task.completed ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500" : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                )}>
                {task.completed && <motion.div
                    initial={{
                        scale: 0
                    }}
                    animate={{
                        scale: 1
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 15
                    }}>
                    <ApperIcon name="Check" size={14} className="text-white" />
                </motion.div>}
            </motion.button>
            {/* Task Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                    <h3
                        className={cn(
                            "font-semibold text-gray-900 leading-tight",
                            task.completed && "line-through text-gray-500",
                            isSubtask && "text-sm"
                        )}>
                        {task.title}
                    </h3>
                    {/* Subtask indicator for parent tasks */}
                    {isParentTask && <button
                        onClick={handleToggleSubtasks}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors">
                        <ApperIcon name={showSubtasks ? "ChevronDown" : "ChevronRight"} size={12} />
                        {task.subtaskCount}subtask{task.subtaskCount !== 1 ? "s" : ""}
                    </button>}
                </div>
                {/* Subtask progress bar for parent tasks */}
                {isParentTask && task.subtaskProgress !== undefined && <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${task.subtaskProgress}%`
                                }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            {task.completedSubtasks || 0}/{task.subtaskCount || 0}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {task.subtaskProgress}% complete
                                        </div>
                </div>}
                {task.description && <p
                    className={cn(
                        "text-sm text-gray-600 mb-3 leading-relaxed",
                        task.completed && "text-gray-400",
                        isSubtask && "text-xs"
                    )}>
                    {task.description}
                </p>}
                {/* Task Meta */}
<div className="flex items-center gap-3 flex-wrap">
                    {/* Category Badge */}
                    <Badge
                        variant={getCategoryColor(task.category)}
                        size="sm"
                        className="flex items-center gap-1">
                        <ApperIcon name={getCategoryIcon(task.category)} size={12} />
                        {task.category}
                    </Badge>
                    
                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                            {task.tags.map((tag) => (
                                <Badge
                                    key={tag.Id}
                                    style={{ 
                                        backgroundColor: tag.color + '20',
                                        color: tag.color,
                                        borderColor: tag.color + '40'
                                    }}
                                    size="sm"
                                    className="border text-xs flex items-center gap-1"
                                >
                                    <ApperIcon name={tag.icon} size={10} />
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                    
                    {/* Due Date */}
                    {dueDateInfo && <div
                        className={cn(
                            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                            isOverdue ? "text-red-700 bg-red-100" : isDueSoon ? "text-amber-700 bg-amber-100" : "text-gray-600 bg-gray-100"
                        )}>
                        <ApperIcon name={isOverdue ? "AlertCircle" : "Clock"} size={12} />
                        {typeof dueDateInfo === "string" ? dueDateInfo : dueDateInfo.formatted}
                    </div>}
                    {/* Priority Indicator */}
                    <div
                        className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            task.priority === "High" && "text-red-700 bg-red-100",
                            task.priority === "Medium" && "text-amber-700 bg-amber-100",
                            task.priority === "Low" && "text-green-700 bg-green-100"
                        )}>
                        {task.priority}
                    </div>
                    {/* Subtask actions for parent tasks */}
                    {isParentTask && <button
                        onClick={handleCreateSubtask}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-full transition-colors"
                        title="Add subtask">
                        <ApperIcon name="Plus" size={12} />Add subtask
                                        </button>}
                </div>
                {/* Expanded subtasks */}
{showSubtasks && isParentTask && <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-2">
                    {loadingSubtasks ? <div className="text-sm text-gray-500">Loading subtasks...</div> : subtasks.length > 0 ? subtasks.map(subtask => <div key={subtask.Id} className="bg-gray-50 rounded-lg p-3">
                        <TaskCard
                            task={subtask}
                            onToggleComplete={handleSubtaskToggle}
                            onEdit={onEdit}
                            onDelete={onDelete} />
                    </div>) : <div className="text-sm text-gray-500 italic">No subtasks yet. Click "Add subtask" to create one.
                                          </div>}
                </div>}
            </div>
        </div>
    </div>
    {/* Actions */}
    <div className="flex items-start gap-1">
        <motion.button
            onClick={() => onEdit(task)}
            whileHover={{
                scale: 1.1
            }}
            whileTap={{
                scale: 0.9
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
            <ApperIcon name="Edit2" size={16} />
        </motion.button>
        <motion.button
            onClick={() => onDelete(task.Id)}
            whileHover={{
                scale: 1.1
            }}
            whileTap={{
                scale: 0.9
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
            <ApperIcon name="Trash2" size={16} />
        </motion.button>
    </div>
</motion.div>
  )
}

export default TaskCard