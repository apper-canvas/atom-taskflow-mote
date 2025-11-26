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
  onCreateSubtask
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
      {viewMode === "category" ? renderTasksByCategory() : renderTasksList()}
    </div>
  )
}

export default TaskList