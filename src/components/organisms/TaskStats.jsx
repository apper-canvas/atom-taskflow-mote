import { motion } from "framer-motion";
import Chart from "react-apexcharts";
import React from "react";
import ApperIcon from "@/components/ApperIcon";

const TaskStats = ({ tasks }) => {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const activeTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

// Count tasks by category and project
const categoryStats = {
    Personal: tasks.filter(task => task.category === "Personal").length,
    Work: tasks.filter(task => task.category === "Work").length,
    Other: tasks.filter(task => task.category === "Other").length
  }

  const projectStats = {
    withProject: tasks.filter(task => task.projectId).length,
    withoutProject: tasks.filter(task => !task.projectId).length
  }

  const oldCategoryStats = {
    Personal: tasks.filter(task => task.category === "Personal").length,
    Work: tasks.filter(task => task.category === "Work").length,
    Other: tasks.filter(task => task.category === "Other").length
  }

  // Calculate completion rates by category
const categoryCompletionStats = {
    Personal: {
      total: tasks.filter(task => task.category === "Personal").length,
      completed: tasks.filter(task => task.category === "Personal" && (task.completed || task.status === "Completed")).length,
    },
    Work: {
      total: tasks.filter(task => task.category === "Work").length,
      completed: tasks.filter(task => task.category === "Work" && (task.completed || task.status === "Completed")).length,
    },
    Other: {
      total: tasks.filter(task => task.category === "Other").length,
      completed: tasks.filter(task => task.category === "Other" && (task.completed || task.status === "Completed")).length,
    }
  }

  const projectCompletionStats = {
    withProject: {
      total: tasks.filter(task => task.projectId).length,
      completed: tasks.filter(task => task.projectId && (task.completed || task.status === "Completed")).length,
    },
    withoutProject: {
      total: tasks.filter(task => !task.projectId).length,
      completed: tasks.filter(task => !task.projectId && (task.completed || task.status === "Completed")).length,
    }
  }

  // Count tasks by priority
const priorityStats = {
    Urgent: tasks.filter(task => task.priority === "Urgent" && !task.completed && task.status !== "Completed").length,
    High: tasks.filter(task => task.priority === "High" && !task.completed && task.status !== "Completed").length,
    Medium: tasks.filter(task => task.priority === "Medium" && !task.completed && task.status !== "Completed").length,
    Low: tasks.filter(task => task.priority === "Low" && !task.completed && task.status !== "Completed").length
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
// Chart configurations
const donutOptions = {
    chart: {
      type: 'donut',
      height: 300,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    labels: ['Personal', 'Work', 'Other'],
    colors: ['#8b5cf6', '#2563eb', '#10b981'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Overall',
              fontSize: '14px',
              color: '#6b7280',
              formatter: () => `${completionRate}%`
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(val)}%`,
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#fff']
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 500,
      labels: {
        colors: '#6b7280'
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val, { seriesIndex }) => {
          const categories = ['Personal', 'Work', 'Other']
          const category = categories[seriesIndex]
          const stats = categoryCompletionStats[category]
          return `${stats.completed}/${stats.total} tasks (${Math.round(val)}%)`
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }

  const donutSeries = Object.keys(categoryCompletionStats).map(category => {
    const stats = categoryCompletionStats[category]
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  })

const barOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: '60%',
        borderRadius: 4,
      }
    },
    colors: ['#10b981', '#e5e7eb'],
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: ['Personal', 'Work', 'Other'],
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6b7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6b7280'
        }
      }
    },
    grid: {
      borderColor: '#f3f4f6',
      strokeDashArray: 2
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      labels: {
        colors: '#6b7280'
      }
    },
    tooltip: {
      y: {
        formatter: (val, { seriesIndex, dataPointIndex }) => {
          const categories = ['Personal', 'Work', 'Other']
          const category = categories[dataPointIndex]
          const stats = categoryCompletionStats[category]
          return seriesIndex === 0 ? 
            `${stats.completed} completed tasks` : 
            `${stats.total - stats.completed} remaining tasks`
        }
      }
    }
  }

  const barSeries = [
    {
      name: 'Completed',
      data: Object.keys(categoryCompletionStats).map(category => 
        categoryCompletionStats[category].completed
      )
    },
    {
      name: 'Remaining',
      data: Object.keys(categoryCompletionStats).map(category => {
        const stats = categoryCompletionStats[category]
        return stats.total - stats.completed
      })
    }
  ]

return (
    <>
      {/* Project Organization Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <ApperIcon name="FolderOpen" className="text-indigo-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Project Organization</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{projectStats.withProject}</div>
            <div className="text-sm text-gray-600">In Projects</div>
            <div className="text-xs text-gray-500 mt-1">
              {projectCompletionStats.withProject.total > 0 
                ? `${Math.round((projectCompletionStats.withProject.completed / projectCompletionStats.withProject.total) * 100)}% Complete`
                : 'No tasks'
              }
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{projectStats.withoutProject}</div>
            <div className="text-sm text-gray-600">Unassigned</div>
            <div className="text-xs text-gray-500 mt-1">
              {projectCompletionStats.withoutProject.total > 0 
                ? `${Math.round((projectCompletionStats.withoutProject.completed / projectCompletionStats.withoutProject.total) * 100)}% Complete`
                : 'No tasks'
              }
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6 mb-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Category Statistics Charts */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Completion Rate by Category - Donut Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ApperIcon name="PieChart" size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Category Completion Rates</h3>
                <p className="text-sm text-gray-500">Percentage of completed tasks by category</p>
              </div>
            </div>
            <Chart
              options={donutOptions}
              series={donutSeries}
              type="donut"
              height={300}
            />
          </div>

          {/* Task Distribution - Bar Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ApperIcon name="BarChart3" size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Task Distribution</h3>
                <p className="text-sm text-gray-500">Completed vs remaining tasks by category</p>
              </div>
            </div>
            <Chart
              options={barOptions}
              series={barSeries}
              type="bar"
              height={300}
            />
          </div>
        </motion.div>
      )}
</div>
    </>
  )
}

export default TaskStats