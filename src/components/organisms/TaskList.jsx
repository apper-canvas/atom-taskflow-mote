import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import ApperIcon from "@/components/ApperIcon";
import Empty from "@/components/ui/Empty";
import TaskCard from "@/components/molecules/TaskCard";

const TaskList = ({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  viewMode = "list",
  showCompleted = true,
  onCreateTask,
  onToggleSubtask,
  onCreateSubtask,
  groupBy = null
}) => {
  const activeTasks = tasks.filter(task => !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  if (tasks.length === 0) {
    return (
      <Empty
title="No tasks found"
        description="No tasks match your current filters. Try adjusting your search or create a new task!"
        actionText="Create your first task"
        onAction={onCreateTask}
      />
    )
  }

const renderTasksByCategory = () => {
    const categories = ["Personal", "Work", "Other"]
    const tasksByCategory = categories.reduce((acc, category) => {
      acc[category] = tasks.filter(task => task.category === category && !task.completed)
      return acc
    }, {})

    return (
      <div className="space-y-8">
        {categories.map(category => {
          const categoryTasks = tasksByCategory[category]
          if (categoryTasks.length === 0) return null

          const getCategoryIcon = (cat) => {
            switch (cat) {
              case "Personal": return "Home"
              case "Work": return "Briefcase"  
              case "Other": return "Folder"
              default: return "Circle"
            }
          }

          const getCategoryColor = (cat) => {
            switch (cat) {
              case "Personal": return "from-purple-500 to-purple-600"
              case "Work": return "from-blue-500 to-blue-600"
              case "Other": return "from-green-500 to-green-600"
              default: return "from-gray-500 to-gray-600"
            }
          }

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 bg-gradient-to-br ${getCategoryColor(category)} rounded-lg flex items-center justify-center`}>
                  <ApperIcon name={getCategoryIcon(category)} size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category}
                </h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                  {categoryTasks.length}
                </span>
              </div>

              <div className="grid gap-3">
                <AnimatePresence>
                  {categoryTasks.map(task => (
                    <TaskCard
                      key={task.Id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleSubtask={onToggleSubtask}
                      onCreateSubtask={onCreateSubtask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderTasksByGroup = () => {
    if (!groupBy) return renderTasksList()
    
    const grouped = {}
    
    tasks.forEach(task => {
      let groupKey = 'Unassigned'
      
      switch (groupBy) {
        case 'status':
          groupKey = task.status || 'Not Started'
          break
        case 'priority':
          groupKey = task.priority || 'Medium'
          break
        case 'project':
          groupKey = task.projectId ? `Project ${task.projectId}` : 'No Project'
          break
        case 'assignedTo':
          groupKey = task.assignedTo || 'Unassigned'
          break
        case 'dueDate':
          if (task.dueDate) {
            const date = new Date(task.dueDate)
            const today = new Date()
            const diffTime = date.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            if (diffDays < 0) groupKey = 'Overdue'
            else if (diffDays === 0) groupKey = 'Today'
            else if (diffDays <= 7) groupKey = 'This Week'
            else if (diffDays <= 30) groupKey = 'This Month'
            else groupKey = 'Later'
          } else {
            groupKey = 'No Due Date'
          }
          break
        default:
          groupKey = 'All Tasks'
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(task)
    })

    const getGroupIcon = (groupKey) => {
      if (groupBy === 'status') {
        switch (groupKey) {
          case 'Not Started': return 'Circle'
          case 'In Progress': return 'Clock'
          case 'Completed': return 'CheckCircle'
          case 'In Review': return 'Eye'
          case 'On Hold': return 'Pause'
          default: return 'Circle'
        }
      }
      if (groupBy === 'priority') {
        switch (groupKey) {
          case 'Urgent': return 'AlertTriangle'
          case 'High': return 'AlertCircle'
          case 'Medium': return 'Circle'
          case 'Low': return 'Minus'
          default: return 'Circle'
        }
      }
      if (groupBy === 'project') return 'Folder'
      if (groupBy === 'assignedTo') return 'User'
      if (groupBy === 'dueDate') return 'Calendar'
      return 'Circle'
    }

    const getGroupColor = (groupKey) => {
      if (groupBy === 'status') {
        switch (groupKey) {
          case 'Not Started': return 'from-gray-500 to-gray-600'
          case 'In Progress': return 'from-blue-500 to-blue-600'
          case 'Completed': return 'from-green-500 to-green-600'
          case 'In Review': return 'from-purple-500 to-purple-600'
          case 'On Hold': return 'from-yellow-500 to-yellow-600'
          default: return 'from-gray-500 to-gray-600'
        }
      }
      if (groupBy === 'priority') {
        switch (groupKey) {
          case 'Urgent': return 'from-red-500 to-red-600'
          case 'High': return 'from-orange-500 to-orange-600'
          case 'Medium': return 'from-yellow-500 to-yellow-600'
          case 'Low': return 'from-green-500 to-green-600'
          default: return 'from-gray-500 to-gray-600'
        }
      }
      if (groupBy === 'dueDate') {
        switch (groupKey) {
          case 'Overdue': return 'from-red-500 to-red-600'
          case 'Today': return 'from-orange-500 to-orange-600'
          case 'This Week': return 'from-yellow-500 to-yellow-600'
          case 'This Month': return 'from-blue-500 to-blue-600'
          default: return 'from-gray-500 to-gray-600'
        }
      }
      return 'from-blue-500 to-blue-600'
    }

    return (
      <div className="space-y-8">
        {Object.entries(grouped).map(([groupKey, groupTasks]) => (
          <motion.div
            key={groupKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-gradient-to-br ${getGroupColor(groupKey)} rounded-lg flex items-center justify-center`}>
                <ApperIcon name={getGroupIcon(groupKey)} size={18} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {groupKey}
              </h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                {groupTasks.length}
              </span>
            </div>

            <div className="grid gap-3">
              <AnimatePresence>
                {groupTasks.map(task => (
                  <TaskCard
                    key={task.Id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleSubtask={onToggleSubtask}
                    onCreateSubtask={onCreateSubtask}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  const renderTasksList = () => (
    <div className="space-y-6">
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="Circle" size={18} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Active Tasks
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
              {activeTasks.length}
            </span>
          </div>

          <div className="grid gap-3">
            <AnimatePresence>
              {activeTasks.map(task => (
<TaskCard
                    key={task.Id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleSubtask={onToggleSubtask}
                    onCreateSubtask={onCreateSubtask}
                  />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && showCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="CheckCircle2" size={18} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Completed Tasks
            </h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
              {completedTasks.length}
            </span>
          </div>

          <div className="grid gap-3">
            <AnimatePresence>
              {completedTasks.map(task => (
<TaskCard
                    key={task.Id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleSubtask={onToggleSubtask}
                    onCreateSubtask={onCreateSubtask}
                  />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  )

return (
    <div className="space-y-6">
      {viewMode === "category" ? renderTasksByCategory() : 
       groupBy ? renderTasksByGroup() : 
       renderTasksList()}
    </div>
  )
}

export default TaskList