import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { taskService } from "@/services/api/taskService";
import { projectService } from "@/services/api/projectService";
import BoardView from "@/components/organisms/BoardView";
import FilterPanel from "@/components/organisms/FilterPanel";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Button from "@/components/atoms/Button";
import TaskList from "@/components/organisms/TaskList";
import TaskStats from "@/components/organisms/TaskStats";
import QuickAddTask from "@/components/molecules/QuickAddTask";
import TagManager from "@/components/molecules/TagManager";
import TaskEditModal from "@/components/molecules/TaskEditModal";
import FilterBar from "@/components/molecules/FilterBar";
import toast, { showToast } from "@/utils/toast";
const Dashboard = () => {
const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  
  // Enhanced filtering state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedTag, setSelectedTag] = useState("all")
  const [viewMode, setViewMode] = useState("list")
  const [sortBy, setSortBy] = useState("updatedAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [activeSmartView, setActiveSmartView] = useState("all")
  const [advancedFilters, setAdvancedFilters] = useState({})
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false)
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)
  const [projects, setProjects] = useState([])
  
  // Load tasks and projects
  const loadTasks = async () => {
    try {
      setError("")
const [taskData, projectData] = await Promise.all([
        taskService.getAll(),
        projectService.getAll()
      ])
      setTasks(taskData)
      setProjects(projectData)
    } catch (err) {
      console.error("Failed to load tasks:", err)
      setError(err.message || "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  // Filter tasks
const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.tags && task.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())))
      
      const matchesCategory = selectedCategory === "all" || task.category === selectedCategory
      const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority
      
      const matchesStatus = selectedStatus === "all" || 
                           (selectedStatus === "active" && !task.completed) ||
                           (selectedStatus === "completed" && task.completed)

      const matchesTag = selectedTag === "all" || 
                        (task.tags && task.tags.some(tag => tag.Id === parseInt(selectedTag)))

      const matchesProject = selectedProject === "all" || 
                            (task.projectId && task.projectId === parseInt(selectedProject)) ||
                            (selectedProject === "unassigned" && !task.projectId)
      
      // Smart view filters
      if (activeSmartView === 'today') {
        const today = new Date()
        const isToday = task.dueDate && new Date(task.dueDate).toDateString() === today.toDateString()
        const isOverdue = task.dueDate && new Date(task.dueDate) < today && !task.completed
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesTag && matchesProject && (isToday || isOverdue)
      } else if (activeSmartView === 'upcoming') {
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const isUpcoming = task.dueDate && new Date(task.dueDate) > today && new Date(task.dueDate) <= nextWeek && !task.completed
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesTag && matchesProject && isUpcoming
      } else if (activeSmartView === 'overdue') {
        const today = new Date()
        const isOverdue = task.dueDate && new Date(task.dueDate) < today && !task.completed
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesTag && matchesProject && isOverdue
      } else if (activeSmartView === 'completed') {
        return matchesSearch && matchesCategory && matchesPriority && matchesTag && matchesProject && task.completed
      }
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesTag && matchesProject
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31')
          const bDate = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31')
          comparison = aDate.getTime() - bDate.getTime()
          break
        case 'priority':
          const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          break
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'updatedAt':
        default:
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          break
      }
      
      return sortOrder === 'desc' ? comparison : -comparison
    })

    return filtered
  }, [tasks, searchTerm, selectedCategory, selectedPriority, selectedStatus, selectedTag, selectedProject, activeSmartView, sortBy, sortOrder])
  // Handlers
  const handleAddTask = async (taskData) => {
    try {
      setCreateLoading(true)
      const newTask = await taskService.create(taskData)
      setTasks(prev => [newTask, ...prev])
      toast.success("Task created successfully! 🎉")
    } catch (err) {
      console.error("Failed to create task:", err)
      toast.error("Failed to create task. Please try again.")
    } finally {
      setCreateLoading(false)
    }
  }

const handleToggleComplete = async (taskId, completed) => {
    try {
      const updatedTask = await taskService.update(taskId, { completed })
      setTasks(prev => prev.map(task => 
        task.Id === taskId ? updatedTask : task
      ))
      
      if (completed) {
        toast.success("Task completed! Great job! ✅")
      } else {
        toast.info("Task marked as active")
      }
    } catch (err) {
      console.error("Failed to update task:", err)
      toast.error("Failed to update task. Please try again.")
    }
  }

  const handleToggleSubtask = async (subtaskId, completed, parentTaskId) => {
    try {
      const updatedSubtask = await taskService.update(subtaskId, { completed })
      
      // Refresh all tasks to get updated parent task progress
      const allTasks = await taskService.getAll()
      setTasks(allTasks)
      
      if (completed) {
        toast.success("Subtask completed! ✅")
      } else {
        toast.info("Subtask marked as active")
      }
    } catch (err) {
      console.error("Failed to update subtask:", err)
      toast.error("Failed to update subtask. Please try again.")
    }
  }

const handleCreateSubtask = async (parentTaskId) => {
    const parentTask = tasks.find(t => t.Id === parentTaskId)
    if (parentTask) {
      setEditingTask({ 
        parentTaskId, 
        category: parentTask.category, 
        priority: parentTask.priority 
      })
      setIsModalOpen(true)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

const handleSaveTask = async (taskId, taskData) => {
    try {
      setModalLoading(true)
      
      if (taskId) {
        // Update existing task or subtask
        const updatedTask = await taskService.update(taskId, taskData)
        // Refresh all tasks to get updated parent progress if it's a subtask
        const allTasks = await taskService.getAll()
        setTasks(allTasks)
        toast.success(taskData.parentTaskId ? "Subtask updated successfully! ✅" : "Task updated successfully! ✅")
      } else {
        // Create new task or subtask
        if (taskData.parentTaskId) {
          const newSubtask = await taskService.createSubtask(taskData.parentTaskId, taskData)
          // Refresh all tasks to get updated parent progress
          const allTasks = await taskService.getAll()
          setTasks(allTasks)
          toast.success("Subtask created successfully! 🎉")
        } else {
          const newTask = await taskService.create(taskData)
          setTasks(prev => [newTask, ...prev])
          toast.success("Task created successfully! 🎉")
        }
      }
      
      setIsModalOpen(false)
      setEditingTask(null)
    } catch (err) {
      console.error("Failed to save task:", err)
      toast.error("Failed to save task. Please try again.")
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      setModalLoading(true)
      await taskService.delete(taskId)
      setTasks(prev => prev.filter(task => task.Id !== taskId))
      toast.success("Task deleted successfully")
      setIsModalOpen(false)
      setEditingTask(null)
    } catch (err) {
      console.error("Failed to delete task:", err)
      toast.error("Failed to delete task. Please try again.")
    } finally {
      setModalLoading(false)
    }
  }

  const handleCreateNewTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
  }

  const handleRetry = () => {
    setLoading(true)
    loadTasks()
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={handleRetry} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ApperIcon name="CheckSquare" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TaskFlow</h1>
              <p className="text-gray-600">Organize your life, one task at a time</p>
            </div>
          </div>
          
<div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleCreateNewTask}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <ApperIcon name="Plus" size={18} />
                New Task
              </motion.button>
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="updatedAt">Recently Updated</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="createdAt">Created Date</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
              
              <Button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                variant="ghost"
                size="sm"
              >
                <ApperIcon 
                  name={sortOrder === 'desc' ? 'ArrowDownAZ' : 'ArrowUpAZ'} 
                  size={16} 
                />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
<TaskStats tasks={filteredAndSortedTasks} />

        {/* Quick Add */}
        <div className="mb-6">
          <QuickAddTask 
            onAddTask={handleAddTask} 
            isLoading={createLoading}
          />
        </div>

        {/* Filters */}
{/* Enhanced Filter System */}
        <div className="flex gap-6">
          <FilterPanel
            isCollapsed={filterPanelCollapsed}
            onToggleCollapse={() => setFilterPanelCollapsed(!filterPanelCollapsed)}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onApplySmartView={(viewId, filters) => {
              setActiveSmartView(viewId)
              setAdvancedFilters(filters)
            }}
            activeSmartView={activeSmartView}
          />
          
          <div className="flex-1">
            <div className="mb-6">
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedTag={selectedTag}
                onTagChange={setSelectedTag}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                projects={projects}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                activeSmartView={activeSmartView}
                onSmartViewChange={setActiveSmartView}
              />
            </div>
</div>

        {/* Tag Management Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setIsTagManagerOpen(true)}
            className="flex items-center gap-2"
          >
            <ApperIcon name="Tag" size={16} />
            Manage Tags
          </Button>
        </div>

        {/* Tag Manager Modal */}
        <TagManager
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          onTagsChange={loadTasks}
        />

        {/* Task List */}
        {viewMode === 'board' ? (
          <BoardView
            tasks={filteredAndSortedTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggleSubtask={handleToggleSubtask}
            onCreateSubtask={handleCreateSubtask}
            onCreateTask={handleCreateNewTask}
          />
        ) : (
          <TaskList
            tasks={filteredAndSortedTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggleSubtask={handleToggleSubtask}
            onCreateSubtask={handleCreateSubtask}
            viewMode={viewMode}
            onCreateTask={handleCreateNewTask}
          />
        )}

        {/* Edit Modal */}
        <TaskEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          task={editingTask}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          isLoading={modalLoading}
        />
      </div>
    </div>
  )
}
}

export default Dashboard