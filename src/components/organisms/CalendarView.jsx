import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import TaskCard from '@/components/molecules/TaskCard'
import { cn } from '@/utils/cn'

const CalendarView = ({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onToggleSubtask, 
  onCreateSubtask, 
  onCreateTask 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // month, week
  const [selectedDate, setSelectedDate] = useState(null)

  // Generate calendar dates
  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dates = []
    let date = startDate
    
    while (date <= endDate) {
      dates.push(new Date(date))
      date = addDays(date, 1)
    }
    
    return dates
  }, [currentDate])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = {}
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })
    return grouped
  }, [tasks])

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getTasksForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return tasksByDate[dateKey] || []
  }

  const getDayColor = (date) => {
    const tasks = getTasksForDate(date)
    const completedTasks = tasks.filter(t => t.completed).length
    const totalTasks = tasks.length
    
    if (totalTasks === 0) return 'transparent'
    if (completedTasks === totalTasks) return '#10b981' // green
    if (completedTasks > 0) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  if (viewMode === 'week') {
    const weekStart = startOfWeek(currentDate)
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Week of {format(weekStart, 'MMM d, yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigateMonth(-1)}
                variant="outline"
                size="sm"
              >
                <ApperIcon name="ChevronLeft" size={16} />
              </Button>
              <Button
                onClick={() => navigateMonth(1)}
                variant="outline" 
                size="sm"
              >
                <ApperIcon name="ChevronRight" size={16} />
              </Button>
              <Button onClick={goToToday} variant="outline" size="sm">
                Today
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode('month')}
              variant="outline"
              size="sm"
            >
              <ApperIcon name="Calendar" size={16} />
              Month
            </Button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayTasks = getTasksForDate(date)
            
            return (
              <motion.div
                key={date.toISOString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg border border-gray-200 p-4 min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={cn(
                    "font-semibold",
                    isToday(date) ? "text-blue-600" : "text-gray-900"
                  )}>
                    {format(date, 'EEE')}
                  </h3>
                  <span className={cn(
                    "text-2xl font-bold",
                    isToday(date) ? "text-blue-600" : "text-gray-600"
                  )}>
                    {format(date, 'd')}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <TaskCard
                      key={task.Id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleSubtask={onToggleSubtask}
                      onCreateSubtask={onCreateSubtask}
                      isCompact={true}
                    />
                  ))}
                  
                  {dayTasks.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-8">
                      No tasks
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigateMonth(-1)}
              variant="outline"
              size="sm"
            >
              <ApperIcon name="ChevronLeft" size={16} />
            </Button>
            <Button
              onClick={() => navigateMonth(1)}
              variant="outline"
              size="sm"
            >
              <ApperIcon name="ChevronRight" size={16} />
            </Button>
            <Button onClick={goToToday} variant="outline" size="sm">
              Today
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setViewMode('week')}
            variant="outline"
            size="sm"
          >
            <ApperIcon name="Calendar" size={16} />
            Week
          </Button>
          <Button
            onClick={onCreateTask}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <ApperIcon name="Plus" size={16} />
            New Task
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Dates */}
        <div className="grid grid-cols-7">
          {calendarDates.map((date, index) => {
            const dayTasks = getTasksForDate(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            
            return (
              <motion.div
                key={date.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer transition-colors relative",
                  !isCurrentMonth && "bg-gray-50 text-gray-400",
                  isCurrentMonth && "hover:bg-blue-50",
                  isSelected && "bg-blue-100",
                  isToday(date) && "bg-blue-50 ring-2 ring-blue-200"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-blue-600 font-bold",
                    !isCurrentMonth && "text-gray-400"
                  )}>
                    {format(date, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getDayColor(date) }}
                    />
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.Id}
                      className={cn(
                        "text-xs p-1 rounded truncate",
                        task.completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tasks for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <Button
                onClick={() => setSelectedDate(null)}
                variant="ghost"
                size="sm"
              >
                <ApperIcon name="X" size={16} />
              </Button>
            </div>
            
            <div className="space-y-3">
              {getTasksForDate(selectedDate).map(task => (
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
              
              {getTasksForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ApperIcon name="Calendar" size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No tasks scheduled for this day</p>
                  <Button
                    onClick={onCreateTask}
                    className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <ApperIcon name="Plus" size={16} />
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CalendarView