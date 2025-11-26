import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  isSameMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  startOfDay,
  endOfDay,
  isWeekend,
  getDay
} from 'date-fns'
import { taskService } from '@/services/api/taskService'
import { projectService } from '@/services/api/projectService'
import ApperIcon from '@/components/ApperIcon'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import Button from '@/components/atoms/Button'
import Select from '@/components/atoms/Select'
import Input from '@/components/atoms/Input'
import Badge from '@/components/atoms/Badge'
import TaskEditModal from '@/components/molecules/TaskEditModal'
import { toast } from '@/utils/toast'
import { cn } from '@/utils/cn'

const CALENDAR_VIEWS = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
}

const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'UTC', label: 'UTC' }
]

function Calendar() {
  // State management
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState(CALENDAR_VIEWS.MONTH)
  const [timeZone, setTimeZone] = useState('America/New_York')
  const [showWeekends, setShowWeekends] = useState(true)
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  
  // Interaction state
  const [hoveredTask, setHoveredTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedDateForTask, setSelectedDateForTask] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Load data
  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [taskData, projectData] = await Promise.all([
        taskService.getAll(),
        projectService.getAll()
      ])
      
      setTasks(taskData)
      setProjects(projectData)
    } catch (err) {
      console.error('Failed to load calendar data:', err)
      setError(err.message || 'Failed to load calendar data')
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  // Calendar date calculations
  const calendarDates = useMemo(() => {
    switch (viewMode) {
      case CALENDAR_VIEWS.MONTH:
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart)
        const calendarEnd = endOfWeek(monthEnd)
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
        
      case CALENDAR_VIEWS.WEEK:
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return eachDayOfInterval({ start: weekStart, end: weekEnd })
        
      case CALENDAR_VIEWS.DAY:
        return [currentDate]
        
      case CALENDAR_VIEWS.AGENDA:
        // Show next 30 days for agenda view
        return eachDayOfInterval({
          start: currentDate,
          end: addDays(currentDate, 29)
        })
        
      default:
        return []
    }
  }, [currentDate, viewMode])

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedProject !== 'all' && task.projectId !== parseInt(selectedProject)) return false
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
      return task.dueDate || task.dueDateTime
    })
  }, [tasks, selectedProject, selectedPriority])

  // Get tasks for specific date
  const getTasksForDate = (date) => {
    return filteredTasks.filter(task => {
      const taskDate = task.dueDateTime ? parseISO(task.dueDateTime) : parseISO(task.dueDate)
      return isSameDay(taskDate, date)
    })
  }

  // Get upcoming tasks for sidebar
  const upcomingTasks = useMemo(() => {
    const today = new Date()
    const upcomingDays = eachDayOfInterval({
      start: today,
      end: addDays(today, 14)
    })
    
    return upcomingDays.map(date => ({
      date,
      tasks: getTasksForDate(date).slice(0, 3)
    })).filter(day => day.tasks.length > 0)
  }, [filteredTasks])

  // Calendar navigation
  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case CALENDAR_VIEWS.MONTH:
        setCurrentDate(direction > 0 ? addMonths(newDate, 1) : subMonths(newDate, 1))
        break
      case CALENDAR_VIEWS.WEEK:
        setCurrentDate(direction > 0 ? addWeeks(newDate, 1) : subWeeks(newDate, 1))
        break
      case CALENDAR_VIEWS.DAY:
        setCurrentDate(direction > 0 ? addDays(newDate, 1) : subDays(newDate, 1))
        break
      case CALENDAR_VIEWS.AGENDA:
        setCurrentDate(direction > 0 ? addDays(newDate, 7) : subDays(newDate, 7))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const goToDate = (date) => {
    setCurrentDate(date)
    setSelectedDate(date)
  }

  // Task management
  const handleDateClick = (date) => {
    setSelectedDate(date)
    setSelectedDateForTask(date)
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleTaskClick = (task) => {
    setEditingTask(task)
    setSelectedDateForTask(null)
    setIsTaskModalOpen(true)
  }

  const handleTaskSave = async (taskId, taskData) => {
    try {
      setModalLoading(true)
      
      if (selectedDateForTask) {
        taskData.dueDate = format(selectedDateForTask, 'yyyy-MM-dd')
      }
      
      if (taskId) {
        const updatedTask = await taskService.update(taskId, taskData)
        setTasks(prev => prev.map(t => t.Id === taskId ? updatedTask : t))
        toast.success('Task updated successfully! ✅')
      } else {
        const newTask = await taskService.create(taskData)
        setTasks(prev => [newTask, ...prev])
        toast.success('Task created successfully! 🎉')
      }
      
      setIsTaskModalOpen(false)
      setEditingTask(null)
      setSelectedDateForTask(null)
    } catch (err) {
      console.error('Failed to save task:', err)
      toast.error('Failed to save task. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleTaskDelete = async (taskId) => {
    try {
      setModalLoading(true)
      await taskService.delete(taskId)
      setTasks(prev => prev.filter(t => t.Id !== taskId))
      toast.success('Task deleted successfully')
      setIsTaskModalOpen(false)
      setEditingTask(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
      toast.error('Failed to delete task. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  // Drag and drop functionality
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedTask(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, date) => {
    e.preventDefault()
    
    if (!draggedTask) return
    
    try {
      const newDueDate = format(date, 'yyyy-MM-dd')
      const updatedTask = await taskService.update(draggedTask.Id, { dueDate: newDueDate })
      setTasks(prev => prev.map(t => t.Id === draggedTask.Id ? updatedTask : t))
      toast.success('Task rescheduled successfully! 📅')
    } catch (err) {
      console.error('Failed to reschedule task:', err)
      toast.error('Failed to reschedule task. Please try again.')
    }
    
    setDraggedTask(null)
  }

  // Helper functions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#dc2626'
      case 'High': return '#ef4444'
      case 'Medium': return '#f59e0b'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getProjectColor = (projectId) => {
    const project = projects.find(p => p.Id === projectId)
    return project?.color || '#6b7280'
  }

  const formatCalendarHeader = () => {
    switch (viewMode) {
      case CALENDAR_VIEWS.MONTH:
        return format(currentDate, 'MMMM yyyy')
      case CALENDAR_VIEWS.WEEK:
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case CALENDAR_VIEWS.DAY:
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      case CALENDAR_VIEWS.AGENDA:
        return 'Agenda View'
      default:
        return ''
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadCalendarData} />

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Title and Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ApperIcon name="Calendar" size={28} className="text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCalendar(-1)}
                >
                  <ApperIcon name="ChevronLeft" size={16} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="px-4"
                >
                  Today
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateCalendar(1)}
                >
                  <ApperIcon name="ChevronRight" size={16} />
                </Button>
                
                <div className="text-lg font-semibold text-gray-800 ml-4">
                  {formatCalendarHeader()}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {Object.entries(CALENDAR_VIEWS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-all duration-200",
                      viewMode === value
                        ? "bg-white shadow-sm text-blue-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-40"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.Id} value={project.Id}>
                    {project.name}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-32"
              >
                <option value="all">All Priority</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>

              <Select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-40"
              >
                {TIME_ZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Area */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto h-full">
            {viewMode === CALENDAR_VIEWS.MONTH && (
              <MonthView
                dates={calendarDates}
                currentDate={currentDate}
                selectedDate={selectedDate}
                tasks={filteredTasks}
                onDateClick={handleDateClick}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTaskHover={setHoveredTask}
                showWeekends={showWeekends}
                getPriorityColor={getPriorityColor}
                getProjectColor={getProjectColor}
                getTasksForDate={getTasksForDate}
                projects={projects}
              />
            )}

            {viewMode === CALENDAR_VIEWS.WEEK && (
              <WeekView
                dates={calendarDates}
                currentDate={currentDate}
                selectedDate={selectedDate}
                tasks={filteredTasks}
                onDateClick={handleDateClick}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTaskHover={setHoveredTask}
                getPriorityColor={getPriorityColor}
                getProjectColor={getProjectColor}
                getTasksForDate={getTasksForDate}
                projects={projects}
              />
            )}

            {viewMode === CALENDAR_VIEWS.DAY && (
              <DayView
                date={currentDate}
                selectedDate={selectedDate}
                tasks={filteredTasks}
                onDateClick={handleDateClick}
                onTaskClick={handleTaskClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTaskHover={setHoveredTask}
                getPriorityColor={getPriorityColor}
                getProjectColor={getProjectColor}
                getTasksForDate={getTasksForDate}
                projects={projects}
              />
            )}

            {viewMode === CALENDAR_VIEWS.AGENDA && (
              <AgendaView
                dates={calendarDates}
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onTaskHover={setHoveredTask}
                getPriorityColor={getPriorityColor}
                getProjectColor={getProjectColor}
                getTasksForDate={getTasksForDate}
                projects={projects}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Mini Calendar */}
          <div className="p-4 border-b border-gray-200">
            <MiniCalendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={goToDate}
              tasks={filteredTasks}
              getTasksForDate={getTasksForDate}
            />
          </div>

          {/* Upcoming Deadlines */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ApperIcon name="Clock" size={18} />
              Upcoming Deadlines
            </h3>
            
            <div className="space-y-4">
              {upcomingTasks.map(({ date, tasks }, index) => (
                <motion.div
                  key={format(date, 'yyyy-MM-dd')}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <div className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <span>{format(date, 'EEE, MMM d')}</span>
                    {isToday(date) && (
                      <Badge size="xs" className="bg-blue-100 text-blue-700">Today</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <motion.div
                        key={task.Id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleTaskClick(task)}
                        className="cursor-pointer p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {projects.find(p => p.Id === task.projectId)?.name || 'No Project'}
                          </span>
                          <Badge size="xs" className={cn(
                            task.priority === 'Urgent' && "bg-red-100 text-red-700",
                            task.priority === 'High' && "bg-orange-100 text-orange-700",
                            task.priority === 'Medium' && "bg-yellow-100 text-yellow-700",
                            task.priority === 'Low' && "bg-green-100 text-green-700"
                          )}>
                            {task.priority}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
              
              {upcomingTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ApperIcon name="CheckCircle" size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>No upcoming deadlines</p>
                  <p className="text-sm">You're all caught up! 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-600">Urgent Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-600">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Low Priority</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Hover Tooltip */}
      <AnimatePresence>
        {hoveredTask && (
          <TaskTooltip
            task={hoveredTask}
            projects={projects}
            getPriorityColor={getPriorityColor}
          />
        )}
      </AnimatePresence>

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(null)
          setSelectedDateForTask(null)
        }}
        task={editingTask}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        isLoading={modalLoading}
        initialDueDate={selectedDateForTask ? format(selectedDateForTask, 'yyyy-MM-dd') : undefined}
      />
    </div>
  )
}

// Month View Component
function MonthView({ 
  dates, 
  currentDate, 
  selectedDate, 
  tasks, 
  onDateClick, 
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTaskHover,
  showWeekends,
  getPriorityColor,
  getProjectColor,
  getTasksForDate,
  projects
}) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  if (!showWeekends) {
    weekDays.splice(0, 1) // Remove Sunday
    weekDays.splice(-1, 1) // Remove Saturday
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map(day => (
          <div key={day} className="p-4 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 border-b border-gray-200">
        {dates.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          const isCurrentMonth = isSameMonth(date, currentDate)
          const isSelected = isSameDay(date, selectedDate)
          const isToday_ = isToday(date)
          const isWeekendDay = isWeekend(date)

          if (!showWeekends && isWeekendDay) return null

          return (
            <motion.div
              key={index}
              className={cn(
                "relative border-r border-b border-gray-200 last:border-r-0 p-2 min-h-[120px] cursor-pointer transition-colors",
                !isCurrentMonth && "bg-gray-50 text-gray-400",
                isSelected && "bg-blue-50 border-blue-200",
                isToday_ && "bg-blue-100 border-blue-300",
                isWeekendDay && showWeekends && "bg-gray-25",
                "hover:bg-gray-50"
              )}
              onClick={() => onDateClick(date)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, date)}
              whileHover={{ scale: 1.01 }}
            >
              {/* Date Number */}
              <div className={cn(
                "text-sm font-medium mb-2",
                isToday_ && "text-blue-600",
                isSelected && "text-blue-700"
              )}>
                {format(date, 'd')}
              </div>

              {/* Task Count Badge */}
              {dayTasks.length > 0 && (
                <div className="absolute top-2 right-2">
                  <Badge 
                    size="xs" 
                    className={cn(
                      "bg-blue-100 text-blue-700",
                      dayTasks.length > 3 && "bg-orange-100 text-orange-700"
                    )}
                  >
                    {dayTasks.length}
                  </Badge>
                </div>
              )}

              {/* Tasks */}
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <motion.div
                    key={task.Id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task)}
                    onDragEnd={onDragEnd}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskClick(task)
                    }}
                    onMouseEnter={() => onTaskHover(task)}
                    onMouseLeave={() => onTaskHover(null)}
                    className={cn(
                      "text-xs p-1.5 rounded truncate cursor-pointer transition-all duration-200",
                      "hover:shadow-md transform hover:-translate-y-0.5",
                      task.completed && "opacity-50 line-through"
                    )}
                    style={{ 
                      backgroundColor: getProjectColor(task.projectId) + '20',
                      borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="font-medium">{task.title}</span>
                  </motion.div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1.5">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component  
function WeekView({ 
  dates,
  currentDate,
  selectedDate,
  tasks,
  onDateClick,
  onTaskClick,
  onDragStart,
  onDragEnd, 
  onDragOver,
  onDrop,
  onTaskHover,
  getPriorityColor,
  getProjectColor,
  getTasksForDate,
  projects
}) {
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-8 border-b bg-gray-50">
        <div className="p-4 border-r border-gray-200" />
        {dates.map((date, index) => (
          <div
            key={index}
            className={cn(
              "p-4 text-center border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-100",
              isSameDay(date, selectedDate) && "bg-blue-50",
              isToday(date) && "bg-blue-100"
            )}
            onClick={() => onDateClick(date)}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {format(date, 'EEE')}
            </div>
            <div className={cn(
              "text-lg font-semibold mt-1",
              isToday(date) && "text-blue-600"
            )}>
              {format(date, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 min-h-full">
          {/* Time Column */}
          <div className="border-r border-gray-200">
            {timeSlots.map(hour => (
              <div key={hour} className="h-12 border-b border-gray-100 p-2 text-xs text-gray-500">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {dates.map((date, dayIndex) => {
            const dayTasks = getTasksForDate(date)
            
            return (
              <div 
                key={dayIndex}
                className="border-r border-gray-200 last:border-r-0 relative"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, date)}
              >
                {timeSlots.map(hour => (
                  <div key={hour} className="h-12 border-b border-gray-100 relative" />
                ))}
                
                {/* Tasks positioned absolutely */}
                <div className="absolute inset-0 p-1">
                  {dayTasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.Id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      onDragEnd={onDragEnd}
                      onClick={() => onTaskClick(task)}
                      onMouseEnter={() => onTaskHover(task)}
                      onMouseLeave={() => onTaskHover(null)}
                      className={cn(
                        "absolute left-1 right-1 p-1 rounded text-xs cursor-pointer",
                        "hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200",
                        task.completed && "opacity-50"
                      )}
                      style={{ 
                        top: `${(taskIndex * 20) + 4}px`,
                        backgroundColor: getProjectColor(task.projectId) + '20',
                        borderLeft: `3px solid ${getPriorityColor(task.priority)}`
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      {task.dueDateTime && (
                        <div className="text-gray-500 text-xs">
                          {format(parseISO(task.dueDateTime), 'h:mm a')}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({
  date,
  selectedDate,
  tasks,
  onDateClick,
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTaskHover,
  getPriorityColor,
  getProjectColor,
  getTasksForDate,
  projects
}) {
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)
  const dayTasks = getTasksForDate(date)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          
          {isToday(date) && (
            <Badge className="bg-blue-100 text-blue-700">Today</Badge>
          )}
        </div>
      </div>

      {/* Day Schedule */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-12 min-h-full">
          {/* Time Column */}
          <div className="col-span-2 border-r border-gray-200">
            {timeSlots.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-100 p-3 text-sm text-gray-500">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Task Column */}
          <div 
            className="col-span-10 relative"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, date)}
          >
            {timeSlots.map(hour => (
              <div 
                key={hour} 
                className="h-16 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onDateClick(date)}
              />
            ))}
            
            {/* Tasks positioned absolutely */}
            <div className="absolute inset-0 p-2">
              {dayTasks.map((task, taskIndex) => {
                const taskHour = task.dueDateTime ? 
                  parseISO(task.dueDateTime).getHours() : 
                  9 + (taskIndex * 2) // Default spacing
                
                return (
                  <motion.div
                    key={task.Id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task)}
                    onDragEnd={onDragEnd}
                    onClick={() => onTaskClick(task)}
                    onMouseEnter={() => onTaskHover(task)}
                    onMouseLeave={() => onTaskHover(null)}
                    className={cn(
                      "absolute left-2 right-2 p-3 rounded-lg cursor-pointer shadow-sm border",
                      "hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200",
                      task.completed && "opacity-50"
                    )}
                    style={{ 
                      top: `${taskHour * 64 + 8}px`,
                      backgroundColor: getProjectColor(task.projectId) + '20',
                      borderColor: getPriorityColor(task.priority)
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge size="xs" style={{ 
                            backgroundColor: getPriorityColor(task.priority) + '20',
                            color: getPriorityColor(task.priority)
                          }}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {projects.find(p => p.Id === task.projectId)?.name || 'No Project'}
                          </span>
                        </div>
                      </div>
                      
                      {task.dueDateTime && (
                        <div className="text-sm font-medium text-gray-700">
                          {format(parseISO(task.dueDateTime), 'h:mm a')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Agenda View Component
function AgendaView({
  dates,
  tasks,
  onTaskClick,
  onTaskHover,
  getPriorityColor,
  getProjectColor,
  getTasksForDate,
  projects
}) {
  const datesWithTasks = dates
    .map(date => ({
      date,
      tasks: getTasksForDate(date)
    }))
    .filter(({ tasks }) => tasks.length > 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
      <div className="p-6 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Agenda</h2>
        <p className="text-sm text-gray-600 mt-1">
          {datesWithTasks.length} days with scheduled tasks
        </p>
      </div>
      
      <div className="overflow-y-auto max-h-full">
        {datesWithTasks.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {datesWithTasks.map(({ date, tasks }, index) => (
              <motion.div
                key={format(date, 'yyyy-MM-dd')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold",
                    isToday(date) ? "bg-blue-600" : "bg-gray-400"
                  )}>
                    {format(date, 'd')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      {isToday(date) && <span className="text-blue-600 font-medium ml-2">• Today</span>}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 ml-15">
                  {tasks.map(task => (
                    <motion.div
                      key={task.Id}
                      onClick={() => onTaskClick(task)}
                      onMouseEnter={() => onTaskHover(task)}
                      onMouseLeave={() => onTaskHover(null)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                        "hover:shadow-md transform hover:-translate-y-0.5",
                        task.completed && "opacity-50"
                      )}
                      style={{ 
                        backgroundColor: getProjectColor(task.projectId) + '10',
                        borderColor: getPriorityColor(task.priority) + '40'
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getPriorityColor(task.priority) }}
                            />
                            <h4 className="font-semibold text-gray-900">
                              {task.title}
                            </h4>
                            {task.completed && (
                              <ApperIcon name="Check" size={16} className="text-green-600" />
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <Badge size="sm" style={{ 
                              backgroundColor: getPriorityColor(task.priority) + '20',
                              color: getPriorityColor(task.priority)
                            }}>
                              {task.priority} Priority
                            </Badge>
                            
                            <span className="text-sm text-gray-600">
                              {projects.find(p => p.Id === task.projectId)?.name || 'No Project'}
                            </span>
                            
                            {task.dueDateTime && (
                              <span className="text-sm text-gray-600">
                                Due: {format(parseISO(task.dueDateTime), 'h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ApperIcon name="Calendar" size={48} className="mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled tasks</h3>
            <p className="text-sm text-center">
              Tasks with due dates will appear here.<br />
              Click on a date in other views to schedule tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Mini Calendar Component
function MiniCalendar({ currentDate, selectedDate, onDateSelect, tasks, getTasksForDate }) {
  const [miniCurrentDate, setMiniCurrentDate] = useState(new Date())
  
  const monthStart = startOfMonth(miniCurrentDate)
  const monthEnd = endOfMonth(miniCurrentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const navigateMiniCalendar = (direction) => {
    setMiniCurrentDate(prev => 
      direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1)
    )
  }

  return (
    <div className="w-full">
      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          {format(miniCurrentDate, 'MMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => navigateMiniCalendar(-1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ApperIcon name="ChevronLeft" size={14} />
          </button>
          <button
            onClick={() => navigateMiniCalendar(1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ApperIcon name="ChevronRight" size={14} />
          </button>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Week Headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600">
            {day}
          </div>
        ))}
        
        {/* Calendar Dates */}
        {dates.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          const isCurrentMonth = isSameMonth(date, miniCurrentDate)
          const isSelected = isSameDay(date, selectedDate)
          const isToday_ = isToday(date)
          const hasTasks = dayTasks.length > 0

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={cn(
                "bg-white p-2 text-xs transition-colors relative",
                !isCurrentMonth && "text-gray-400 bg-gray-50",
                isSelected && "bg-blue-100 text-blue-700 font-semibold",
                isToday_ && !isSelected && "bg-blue-50 text-blue-600 font-medium",
                "hover:bg-gray-100"
              )}
            >
              {format(date, 'd')}
              {hasTasks && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Task Tooltip Component
function TaskTooltip({ task, projects, getPriorityColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm pointer-events-none"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{task.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs">
            <Badge size="xs" style={{ 
              backgroundColor: getPriorityColor(task.priority) + '20',
              color: getPriorityColor(task.priority)
            }}>
              {task.priority}
            </Badge>
            <span className="text-gray-500">
              {projects.find(p => p.Id === task.projectId)?.name || 'No Project'}
            </span>
          </div>
          {task.dueDateTime && (
            <div className="text-xs text-gray-500 mt-1">
              Due: {format(parseISO(task.dueDateTime), 'h:mm a')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Calendar