import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Badge from '@/components/atoms/Badge'
import { cn } from '@/utils/cn'

const TableView = ({ 
  tasks, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onToggleSubtask, 
  onCreateSubtask,
  groupBy = null 
}) => {
  const [visibleColumns, setVisibleColumns] = useState([
    'title', 'status', 'priority', 'category', 'project', 'dueDate', 'tags', 'actions'
  ])
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' })
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  const availableColumns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'priority', label: 'Priority', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'project', label: 'Project', sortable: false },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'tags', label: 'Tags', sortable: false },
    { key: 'assignedTo', label: 'Assigned To', sortable: false },
    { key: 'createdAt', label: 'Created', sortable: true },
    { key: 'updatedAt', label: 'Updated', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  const sortedTasks = useMemo(() => {
    if (!sortConfig.key) return tasks
    
    return [...tasks].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      
      // Handle date sorting
      if (sortConfig.key.includes('Date') || sortConfig.key.includes('At')) {
        aVal = aVal ? new Date(aVal) : new Date(0)
        bVal = bVal ? new Date(bVal) : new Date(0)
      }
      
      // Handle priority sorting
      if (sortConfig.key === 'priority') {
        const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
        aVal = priorityOrder[aVal] || 0
        bVal = priorityOrder[bVal] || 0
      }
      
      // Handle string sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [tasks, sortConfig])

  const groupedTasks = useMemo(() => {
    if (!groupBy) return { 'All Tasks': sortedTasks }
    
    const grouped = {}
    
    sortedTasks.forEach(task => {
      let groupKey = 'Unassigned'
      
      switch (groupBy) {
        case 'status':
          groupKey = task.status || 'Not Started'
          break
        case 'priority':
          groupKey = task.priority || 'Medium'
          break
        case 'category':
          groupKey = task.category || 'Personal'
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
    
    return grouped
  }, [sortedTasks, groupBy])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    )
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'In Review': return 'bg-purple-100 text-purple-800'
      case 'On Hold': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderCellContent = (task, column) => {
    switch (column.key) {
      case 'title':
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task.Id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className={cn(
                "font-medium",
                task.completed && "line-through text-gray-500"
              )}>
                {task.title}
              </div>
              {task.description && (
                <div className="text-sm text-gray-500 truncate max-w-xs">
                  {task.description}
                </div>
              )}
            </div>
          </div>
        )
      
      case 'status':
        return (
          <Badge className={getStatusColor(task.status)}>
            {task.status || 'Not Started'}
          </Badge>
        )
      
      case 'priority':
        return (
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority || 'Medium'}
          </Badge>
        )
      
      case 'category':
        return (
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              task.category === 'Personal' && "bg-purple-500",
              task.category === 'Work' && "bg-blue-500",
              task.category === 'Other' && "bg-green-500"
            )} />
            {task.category}
          </div>
        )
      
      case 'project':
        return task.projectId ? (
          <Badge variant="secondary">Project {task.projectId}</Badge>
        ) : (
          <span className="text-gray-400">No Project</span>
        )
      
      case 'dueDate':
        return task.dueDate ? (
          <div className="flex items-center gap-2">
            <ApperIcon name="Calendar" size={14} />
            {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </div>
        ) : (
          <span className="text-gray-400">No due date</span>
        )
      
      case 'tags':
        return task.tags && task.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map(tag => (
              <Badge
                key={tag.Id}
                size="sm"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-gray-400">No tags</span>
        )
      
      case 'assignedTo':
        return task.assignedTo || <span className="text-gray-400">Unassigned</span>
      
      case 'createdAt':
        return format(new Date(task.createdAt), 'MMM d, yyyy')
      
      case 'updatedAt':
        return format(new Date(task.updatedAt), 'MMM d, yyyy')
      
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onEdit(task)}
              variant="ghost"
              size="sm"
            >
              <ApperIcon name="Edit2" size={14} />
            </Button>
            <Button
              onClick={() => onDelete(task.Id)}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <ApperIcon name="Trash2" size={14} />
            </Button>
          </div>
        )
      
      default:
        return task[column.key] || '-'
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {Object.keys(groupedTasks).length > 1 ? `Grouped by ${groupBy}` : 'All Tasks'}
          </h3>
          <span className="text-sm text-gray-500">
            {tasks.length} tasks
          </span>
        </div>
        
        <div className="relative">
          <Button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            variant="outline"
            size="sm"
          >
            <ApperIcon name="Settings" size={16} />
            Columns
          </Button>
          
          {showColumnSelector && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
              <h4 className="font-medium text-gray-900 mb-3">Visible Columns</h4>
              <div className="space-y-2">
                {availableColumns.map(column => (
                  <label key={column.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button
                  onClick={() => setShowColumnSelector(false)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName}>
            {Object.keys(groupedTasks).length > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">{groupName}</h4>
                <span className="text-sm text-gray-500">{groupTasks.length} tasks</span>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {availableColumns
                      .filter(col => visibleColumns.includes(col.key))
                      .map(column => (
                        <th
                          key={column.key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            {column.label}
                            {column.sortable && (
                              <button
                                onClick={() => handleSort(column.key)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <ApperIcon
                                  name={
                                    sortConfig.key === column.key
                                      ? sortConfig.direction === 'asc'
                                        ? 'ArrowUp'
                                        : 'ArrowDown'
                                      : 'ArrowUpDown'
                                  }
                                  size={14}
                                />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupTasks.map((task, index) => (
                    <motion.tr
                      key={task.Id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      {availableColumns
                        .filter(col => visibleColumns.includes(col.key))
                        .map(column => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                            {renderCellContent(task, column)}
                          </td>
                        ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <ApperIcon name="Table" size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tasks to display</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TableView