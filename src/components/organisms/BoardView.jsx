import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import ApperIcon from '@/components/ApperIcon'
import TaskCard from '@/components/molecules/TaskCard'
import Button from '@/components/atoms/Button'
import { cn } from '@/utils/cn'

const BoardView = ({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onToggleSubtask,
  onCreateSubtask,
  onCreateTask 
}) => {
  const [dragDisabled, setDragDisabled] = useState(false)

  // Define board columns
  const columns = [
    {
      id: 'not-started',
      title: 'Not Started',
      status: 'Not Started',
      color: 'gray',
      icon: 'Circle'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      status: 'In Progress',
      color: 'blue',
      icon: 'Clock'
    },
    {
      id: 'review',
      title: 'In Review',
      status: 'In Review',
      color: 'orange',
      icon: 'Eye'
    },
    {
      id: 'completed',
      title: 'Completed',
      status: 'Completed',
      color: 'green',
      icon: 'CheckCircle'
    }
  ]

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    const grouped = columns.reduce((acc, column) => {
      acc[column.id] = tasks.filter(task => {
        if (column.status === 'Completed') {
          return task.completed || task.status === 'Completed'
        }
        return task.status === column.status && !task.completed
      })
      return acc
    }, {})
    
    return grouped
  }, [tasks])

  const getColumnColor = (colorName) => {
    const colors = {
      gray: 'from-gray-500 to-gray-600',
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      green: 'from-green-500 to-green-600'
    }
    return colors[colorName] || colors.gray
  }

  const handleDragEnd = (result) => {
    // For now, we'll just show a toast since we'd need to implement status updates
    // In a full implementation, this would update the task status
    console.log('Drag ended:', result)
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ApperIcon name="Columns" size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">Create your first task to get started with the board view</p>
          <Button onClick={onCreateTask}>
            <ApperIcon name="Plus" size={16} />
            Create Task
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = tasksByColumn[column.id] || []
            
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                {/* Column Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 bg-gradient-to-br ${getColumnColor(column.color)} rounded-lg flex items-center justify-center`}>
                      <ApperIcon name={column.icon} size={18} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                      {columnTasks.length}
                    </span>
                  </div>
                  
                  {/* Add Task Button */}
                  <Button
                    onClick={onCreateTask}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400"
                  >
                    <ApperIcon name="Plus" size={16} />
                    Add task
                  </Button>
                </div>

                {/* Column Content */}
                <Droppable droppableId={column.id} isDropDisabled={dragDisabled}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[200px] bg-gray-50 rounded-lg p-3 transition-colors",
                        snapshot.isDraggingOver && "bg-blue-50 border-2 border-dashed border-blue-300"
                      )}
                    >
                      <AnimatePresence>
                        {columnTasks.map((task, index) => (
                          <Draggable 
                            key={task.Id} 
                            draggableId={task.Id.toString()} 
                            index={index}
                            isDragDisabled={dragDisabled}
                          >
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={cn(
                                  "mb-3 last:mb-0",
                                  snapshot.isDragging && "transform rotate-2 shadow-lg"
                                )}
                                style={{
                                  ...provided.draggableProps.style,
                                  ...(snapshot.isDragging && {
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                                  })
                                }}
                              >
                                <TaskCard
                                  task={task}
                                  onToggleComplete={onToggleComplete}
                                  onEdit={onEdit}
                                  onDelete={onDelete}
                                  onToggleSubtask={onToggleSubtask}
                                  onCreateSubtask={onCreateSubtask}
                                  viewMode="board"
                                />
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                      
                      {/* Empty State */}
                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8">
                          <ApperIcon name="Inbox" size={32} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No tasks in {column.title.toLowerCase()}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
      
      {/* Board Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <ApperIcon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Board View Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Drag tasks between columns to update their status</li>
              <li>• Click on any task to edit its details</li>
              <li>• Use the "Add task" button to create tasks in specific columns</li>
              <li>• Completed tasks automatically move to the Completed column</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardView