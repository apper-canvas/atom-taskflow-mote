import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, differenceInDays } from 'date-fns'
import { projectService } from '@/services/api/projectService'
import ApperIcon from '@/components/ApperIcon'
import Badge from '@/components/atoms/Badge'

function ProjectCard({ project, onClick }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadProjectStats()
  }, [project.Id])

  const loadProjectStats = async () => {
    try {
      const projectStats = await projectService.getProjectStats(project.Id)
      setStats(projectStats)
    } catch (error) {
      console.error('Failed to load project stats:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      case 'On Hold': return 'bg-yellow-100 text-yellow-800'
      case 'Archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysRemaining = () => {
    if (!project.endDate) return null
    const days = differenceInDays(new Date(project.endDate), new Date())
    return days
  }

  const daysRemaining = getDaysRemaining()

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(project.Id)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all hover:border-gray-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-sm"
            style={{ backgroundColor: project.color + '20', color: project.color }}
          >
            {project.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>
        <ApperIcon name="MoreHorizontal" size={18} className="text-gray-400" />
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Progress */}
      {stats && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{stats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-2 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <ApperIcon name="CheckSquare" size={14} />
            <span>{stats?.totalTasks || 0} tasks</span>
          </div>
          {project.members && project.members.length > 0 && (
            <div className="flex items-center gap-1">
              <ApperIcon name="Users" size={14} />
              <span>{project.members.length} members</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          Updated {format(new Date(project.updatedAt), 'MMM d')}
        </span>
        {daysRemaining !== null && (
          <span className={
            daysRemaining < 0 ? 'text-red-600' : 
            daysRemaining < 7 ? 'text-yellow-600' : 
            'text-gray-500'
          }>
            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
             daysRemaining === 0 ? 'Due today' :
             `${daysRemaining} days left`}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default ProjectCard