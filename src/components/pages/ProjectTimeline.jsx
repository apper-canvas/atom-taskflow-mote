import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { projectService } from '@/services/api/projectService'
import { taskService } from '@/services/api/taskService'
import ApperIcon from '@/components/ApperIcon'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import Button from '@/components/atoms/Button'
import Select from '@/components/atoms/Select'
import toast from '@/utils/toast'

function ProjectTimeline() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('month') // month, quarter, year
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    if (id) {
      loadProjectData()
    }
  }, [id])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [projectData, allTasks] = await Promise.all([
        projectService.getById(id),
        taskService.getAll()
      ])
      
      setProject(projectData)
      setTasks(allTasks.filter(task => 
        task.projectId === parseInt(id) && (task.dueDate || task.dueDateTime)
      ))
    } catch (err) {
      setError(err.message)
toast.error('Failed to load project timeline')
    } finally {
      setLoading(false)
    }
  }

  const getTimelineDates = () => {
    switch (viewMode) {
      case 'month':
        return eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        })
      case 'quarter':
        // Simplified: 3 months view
        const start = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1)
        const end = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3 + 3, 0)
        return eachDayOfInterval({ start, end })
      case 'year':
        // Show months instead of days for year view
        return Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1))
      default:
        return []
    }
  }

const getTasksForDate = (date) => {
    return tasks.filter(task => {
      try {
        const dateString = task.dueDateTime || task.dueDate
        if (!dateString) return false
        const taskDate = parseISO(dateString)
        if (isNaN(taskDate.getTime())) return false
        return isSameDay(taskDate, date)
      } catch (error) {
        return false
      }
    })
  }
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const navigateTime = (direction) => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction)
        break
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction * 3))
        break
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + direction)
        break
    }
    setCurrentDate(newDate)
  }

  const formatDateHeader = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'quarter':
        const quarter = Math.floor(currentDate.getMonth() / 3) + 1
        return `Q${quarter} ${currentDate.getFullYear()}`
      case 'year':
        return currentDate.getFullYear().toString()
      default:
        return ''
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadProjectData} />
  if (!project) return <ErrorView message="Project not found" />

  const timelineDates = getTimelineDates()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ApperIcon name="ArrowLeft" size={18} />
            Back to Project
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-lg"
              style={{ backgroundColor: project.color + '20', color: project.color }}
            >
              {project.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name} Timeline</h1>
              <p className="text-gray-600">Project schedule and task timeline</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-32"
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={() => navigateTime(-1)}
        >
          <ApperIcon name="ChevronLeft" size={18} />
          Previous
        </Button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {formatDateHeader()}
        </h2>
        
        <Button
          variant="outline"
          onClick={() => navigateTime(1)}
        >
          Next
          <ApperIcon name="ChevronRight" size={18} />
        </Button>
      </div>

      {/* Timeline Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {viewMode === 'year' ? (
          // Year view - show months
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-6">
{timelineDates.map((monthDate, index) => {
              const monthTasks = tasks.filter(task => {
                try {
                  const dateString = task.dueDateTime || task.dueDate
                  if (!dateString) return false
                  const taskDate = parseISO(dateString)
                  if (isNaN(taskDate.getTime())) return false
                  return taskDate.getMonth() === monthDate.getMonth() && 
                         taskDate.getFullYear() === monthDate.getFullYear()
                } catch (error) {
                  return false
                }
              })
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {format(monthDate, 'MMM')}
                  </h3>
                  <div className="space-y-1">
                    {monthTasks.slice(0, 3).map(task => (
                      <div
                        key={task.Id}
                        className="text-xs p-2 rounded flex items-center gap-1"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {monthTasks.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{monthTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          // Month/Quarter view - show days
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header with dates */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {timelineDates.map((date, index) => {
                  const dayTasks = getTasksForDate(date)
                  const isToday = isSameDay(date, new Date())
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`bg-white min-h-[100px] p-2 ${
                        isToday ? 'bg-blue-50 border-2 border-blue-200' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayTasks.map(task => (
                          <div
                            key={task.Id}
                            className={`text-xs p-1 rounded truncate flex items-center gap-1 ${
                              task.completed ? 'opacity-50' : ''
                            }`}
                            style={{ backgroundColor: project.color + '20' }}
                            title={task.title}
                          >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                            <span className="truncate">{task.title}</span>
                            {task.completed && (
                              <ApperIcon name="Check" size={10} className="text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-600">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <ApperIcon name="Check" size={12} className="text-green-600" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectTimeline