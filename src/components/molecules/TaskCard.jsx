import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { taskService } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import CommentThread from "@/components/molecules/CommentThread";
import toast from "@/utils/toast";
import { cn } from "@/utils/cn";

const TaskCard = ({ task, onToggleComplete, onEdit, onDelete, onToggleSubtask, onCreateSubtask }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  // Check if this task has subtasks or subtask progress
const hasSubtasks = task.subtaskCount > 0 || task.parentTaskId
  const isParentTask = task.subtaskCount > 0
  const isSubtask = !!task.parentTaskId
  const canHaveSubtasks = !isSubtask && task.status !== 'Completed'

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
      case "Urgent": return "#dc2626"
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


// State for expandable sections
const [showNotes, setShowNotes] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showLinkedTasks, setShowLinkedTasks] = useState(false);
  const [showComments, setShowComments] = useState(false);

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
        (task.completed || task.status === "Completed") && "opacity-60",
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
                    
                    {/* Comment Count Badge */}
                    {task.commentCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ApperIcon name="MessageCircle" size={12} />
                        <span>{task.commentCount}</span>
                        {task.hasUnreadComments && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    )}
                    
                    {/* Feature indicators */}
<div className="flex items-center gap-1">
                        {task.isRecurring && (
                            <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                <ApperIcon name="RotateCcw" size={12} />
                                <span>Recurring</span>
                            </div>
                        )}
                        {task.notes && (
                            <button
                                onClick={() => setShowNotes(!showNotes)}
                                className="text-xs text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-full transition-colors">
                                <ApperIcon name="FileText" size={12} />
                            </button>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                            <button
                                onClick={() => setShowAttachments(!showAttachments)}
                                className="text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-full transition-colors">
                                <ApperIcon name="Paperclip" size={12} />
                                {task.attachments.length}
                            </button>
                        )}
                        {task.linkedTasks && task.linkedTasks.length > 0 && (
                            <button
                                onClick={() => setShowLinkedTasks(!showLinkedTasks)}
                                className="text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-full transition-colors">
                                <ApperIcon name="Link" size={12} />
                                {task.linkedTasks.length}
                            </button>
                        )}
</div>
                    
                    {/* Comments button */}
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        showComments 
                          ? 'bg-blue-100 text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Comments"
                    >
                      <div className="flex items-center gap-1">
                        <ApperIcon name="MessageCircle" size={16} />
                        {task.commentCount > 0 && (
                          <span className="text-xs font-medium bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                            {task.commentCount}
                          </span>
                        )}
                      </div>
                    </button>
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
                        (task.completed || task.status === "Completed") && "text-gray-400",
                        isSubtask && "text-xs"
                    )}>
                    {task.description}
                </p>}

                {/* Expandable Notes Section */}
                {showNotes && task.notes && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ApperIcon name="FileText" size={14} className="text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">Notes</span>
                        </div>
                        <p className="text-sm text-amber-700 whitespace-pre-wrap">{task.notes}</p>
                    </motion.div>
                )}

                {/* Expandable Attachments Section */}
                {showAttachments && task.attachments && task.attachments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ApperIcon name="Paperclip" size={14} className="text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">Attachments</span>
                        </div>
                        <div className="space-y-2">
                            {task.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-purple-700">
                                    <ApperIcon name="File" size={12} />
                                    <span className="truncate">{attachment.name}</span>
                                    <span className="text-xs text-purple-500">({attachment.size})</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Expandable Linked Tasks Section */}
                {showLinkedTasks && task.linkedTasks && task.linkedTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ApperIcon name="Link" size={14} className="text-green-600" />
                            <span className="text-sm font-medium text-green-800">Related Tasks</span>
                        </div>
                        <div className="space-y-1">
                            {task.linkedTasks.map((linkedTask, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                                    <ApperIcon name="ArrowRight" size={12} />
                                    <span className="truncate">{linkedTask.title}</span>
                                    <Badge variant="secondary" size="xs">{linkedTask.type}</Badge>
                                </div>
                            ))}
                        </div>
                    </motion.div>
)}

                {/* Comments Section */}
                <AnimatePresence>
                  {showComments && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 pt-4 mt-4"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <ApperIcon name="MessageCircle" size={16} className="text-gray-500" />
                        <h4 className="text-sm font-medium text-gray-700">Comments</h4>
                      </div>
                      <div className="max-h-96">
                        <CommentThread taskId={task.Id} maxHeight="24rem" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Assignment Info */}
                {task.assignedTo && (
                  <div className="flex items-center gap-2 mb-2">
                    <ApperIcon name="User" size={14} className="text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">
                      {task.assignedTo.name}
                    </span>
                  </div>
                )}

                {/* Time Progress */}
                {task.estimatedTime && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                      <span>Time Progress</span>
                      <span>
                        {task.timeSpent || 0}m / {task.estimatedTime}m
                        {task.isTracking && <span className="ml-1 text-green-500">●</span>}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          (task.timeSpent || 0) > task.estimatedTime ? 'bg-red-400' : 'bg-blue-400'
                        }`}
                        style={{
                          width: `${Math.min(((task.timeSpent || 0) / task.estimatedTime) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Due Date Warning */}
{/* Due Date Warning */}
                {task.dueDateTime && !task.completed && (
                  <div className="flex items-center gap-1 text-xs mb-2">
                    <ApperIcon 
                      name={isPast(new Date(task.dueDateTime)) ? "AlertTriangle" : "Clock"} 
                      size={12} 
                      className={isPast(new Date(task.dueDateTime)) ? "text-red-500" : "text-orange-500"} 
                    />
                    <span className={cn(
                      "font-medium",
                      isPast(new Date(task.dueDateTime)) ? "text-red-500" : "text-orange-500"
                    )}>
                      {isPast(new Date(task.dueDateTime)) ? "Overdue" : 
                       isToday(new Date(task.dueDateTime)) ? "Due today" :
                       isTomorrow(new Date(task.dueDateTime)) ? "Due tomorrow" :
                       `Due ${format(new Date(task.dueDateTime), "MMM d")}`}
                    </span>
                  </div>
                )}
                {/* Task Meta */}
<div className="flex items-center gap-3 flex-wrap">
                    {/* Status Badge */}
                    {task.status && (
                        <div className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            task.status === "Not Started" && "text-gray-700 bg-gray-100",
                            task.status === "In Progress" && "text-blue-700 bg-blue-100",
                            task.status === "Completed" && "text-green-700 bg-green-100",
                            task.status === "On Hold" && "text-yellow-700 bg-yellow-100",
                            task.status === "Cancelled" && "text-red-700 bg-red-100"
                        )}>
                            {task.status === "Not Started" && "⏸️"}
                            {task.status === "In Progress" && "🔄"}
                            {task.status === "Completed" && "✅"}
                            {task.status === "On Hold" && "⏸️"}
                            {task.status === "Cancelled" && "❌"}
                            {" "}{task.status}
                        </div>
                    )}

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
                    {task.dueDateTime && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        isPast(new Date(task.dueDateTime)) && !isToday(new Date(task.dueDateTime)) ? "text-red-700 bg-red-100" : 
                        (isToday(new Date(task.dueDateTime)) || isTomorrow(new Date(task.dueDateTime))) ? "text-amber-700 bg-amber-100" : 
                        "text-gray-600 bg-gray-100"
                      )}>
                        <ApperIcon name={isPast(new Date(task.dueDateTime)) && !isToday(new Date(task.dueDateTime)) ? "AlertCircle" : "Clock"} size={12} />
                        {isToday(new Date(task.dueDateTime)) ? "Today" :
                         isTomorrow(new Date(task.dueDateTime)) ? "Tomorrow" :
                         format(new Date(task.dueDateTime), "MMM d")}
                      </div>
                    )}
                    {/* Priority Indicator */}
                    <div
                        className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
task.priority === "Urgent" && "text-red-800 bg-red-200",
                            task.priority === "High" && "text-red-700 bg-red-100",
                            task.priority === "Medium" && "text-amber-700 bg-amber-100",
                            task.priority === "Low" && "text-green-700 bg-green-100"
                        )}>
                        {task.priority === "Urgent" && "🚨"}
                        {task.priority === "High" && "🔴"}
                        {task.priority === "Medium" && "🟡"}
                        {task.priority === "Low" && "🟢"}
                        {" "}{task.priority}
                    </div>
                    {/* Subtask actions for parent tasks */}
{canHaveSubtasks && (
                      <button
                        onClick={handleCreateSubtask}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-300 px-3 py-1.5 rounded-full transition-all duration-200 hover:shadow-sm font-medium"
                        title="Create a subtask for this task"
                        aria-label="Add subtask"
                      >
                        <ApperIcon name="Plus" size={12} />
                        <span>Add subtask</span>
                      </button>
                    )}
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
            onClick={!showDeleteConfirm ? () => setShowDeleteConfirm(true) : () => onDelete(task.Id)}
            whileHover={{
                scale: 1.1
            }}
            whileTap={{
                scale: 0.9
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
            {!showDeleteConfirm ? (
                <ApperIcon name="Trash2" size={16} />
            ) : (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium">Delete this task?</span>
                    <Button
type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(task.Id)}
                        className="ml-2">
                        <ApperIcon name="Trash2" size={14} />
                        Yes
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                    </Button>
                </div>
            )}
        </motion.button>
    </div>
</motion.div>
  );
};

export default TaskCard;