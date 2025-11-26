import React from 'react'
import { motion } from 'framer-motion'
import { format, differenceInDays } from 'date-fns'
import Chart from 'react-apexcharts'
import ApperIcon from '@/components/ApperIcon'
import Badge from '@/components/atoms/Badge'

function ProjectDashboard({ project, stats, tasks }) {
  const daysRemaining = project.endDate ? differenceInDays(new Date(project.endDate), new Date()) : null

  // Task priority breakdown chart
  const priorityChartOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    colors: ['#ef4444', '#f59e0b', '#10b981'],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    labels: ['High', 'Medium', 'Low']
  }

  const priorityData = [
    stats.priorityBreakdown?.High || 0,
    stats.priorityBreakdown?.Medium || 0,
    stats.priorityBreakdown?.Low || 0
  ]

  // Completion trend (simplified for demo)
  const completionChartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        colorStops: [{
          offset: 0,
          color: project.color,
          opacity: 0.4
        }, {
          offset: 100,
          color: project.color,
          opacity: 0.1
        }]
      }
    },
    colors: [project.color],
    grid: { show: false },
    xaxis: { labels: { show: false } },
    yaxis: { labels: { show: false } }
  }

  const completionData = [{
    name: 'Completion',
    data: [10, 25, 35, 50, 65, 70, stats.completionPercentage]
  }]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="CheckSquare" className="text-blue-600" size={24} />
            <span className="text-2xl font-bold text-gray-900">{stats.totalTasks}</span>
          </div>
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.activeTasks} active, {stats.completedTasks} completed
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="TrendingUp" className="text-green-600" size={24} />
            <span className="text-2xl font-bold text-gray-900">{stats.completionPercentage}%</span>
          </div>
          <div className="text-sm text-gray-600">Completion</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-2 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="Users" className="text-purple-600" size={24} />
            <span className="text-2xl font-bold text-gray-900">{stats.memberCount}</span>
          </div>
          <div className="text-sm text-gray-600">Team Members</div>
          <div className="text-xs text-gray-500 mt-1">
            Active collaborators
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="Calendar" className={daysRemaining && daysRemaining < 0 ? "text-red-600" : "text-orange-600"} size={24} />
            <span className={`text-2xl font-bold ${daysRemaining && daysRemaining < 0 ? "text-red-600" : "text-gray-900"}`}>
              {daysRemaining !== null ? Math.abs(daysRemaining) : '--'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {daysRemaining === null ? 'No Deadline' : 
             daysRemaining < 0 ? 'Days Overdue' : 
             daysRemaining === 0 ? 'Due Today' : 'Days Remaining'}
          </div>
          {stats.overdueTasks > 0 && (
            <div className="text-xs text-red-500 mt-1">
              {stats.overdueTasks} overdue tasks
            </div>
          )}
        </motion.div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Priority Breakdown</h3>
          {priorityData.some(val => val > 0) ? (
            <Chart
              options={priorityChartOptions}
              series={priorityData}
              type="donut"
              height={250}
            />
          ) : (
            <div className="text-center py-12">
              <ApperIcon name="PieChart" size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="text-gray-600">No active tasks with priorities</div>
            </div>
          )}
        </motion.div>

        {/* Progress Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Trend</h3>
          <Chart
            options={completionChartOptions}
            series={completionData}
            type="area"
            height={200}
          />
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Current completion rate</div>
            <div className="text-2xl font-bold" style={{ color: project.color }}>
              {stats.completionPercentage}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* Team Members */}
      {project.members && project.members.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members.slice(0, 6).map(member => (
              <div key={member.Id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                </div>
              </div>
            ))}
            {project.members.length > 6 && (
              <div className="flex items-center justify-center p-3 border border-dashed border-gray-300 rounded-lg text-gray-500">
                +{project.members.length - 6} more
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
        {tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task.Id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'High' ? 'bg-red-500' :
                  task.priority === 'Medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {task.dueDate && format(new Date(task.dueDate), 'MMM d')}
                  </div>
                </div>
                <Badge variant={task.completed ? 'outline' : 'default'}>
                  {task.completed ? 'Completed' : task.priority}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ApperIcon name="CheckSquare" size={48} className="mx-auto text-gray-400 mb-4" />
            <div className="text-gray-600">No tasks created yet</div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ProjectDashboard