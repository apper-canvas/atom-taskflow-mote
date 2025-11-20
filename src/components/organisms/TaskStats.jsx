import { motion } from "framer-motion"
import ApperIcon from "@/components/ApperIcon"

const TaskStats = ({ tasks }) => {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const activeTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Count tasks by category
  const categoryStats = {
    Personal: tasks.filter(task => task.category === "Personal").length,
    Work: tasks.filter(task => task.category === "Work").length,
    Other: tasks.filter(task => task.category === "Other").length
  }

  // Count tasks by priority
  const priorityStats = {
    High: tasks.filter(task => task.priority === "High" && !task.completed).length,
    Medium: tasks.filter(task => task.priority === "Medium" && !task.completed).length,
    Low: tasks.filter(task => task.priority === "Low" && !task.completed).length
  }

  const stats = [
    {
      label: "Active Tasks",
      value: activeTasks,
      icon: "Circle",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      label: "Completed",
      value: completedTasks,
      icon: "CheckCircle2",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: "TrendingUp",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      label: "High Priority",
      value: priorityStats.High,
      icon: "AlertCircle",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
              <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <ApperIcon name={stat.icon} size={18} className="text-white" />
              </div>
            </div>
          </div>
          
          {/* Progress bar for completion rate */}
          {stat.label === "Completion Rate" && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default TaskStats