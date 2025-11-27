import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { taskService } from "@/services/api/taskService";
import { projectService } from "@/services/api/projectService";
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
import NotificationBell from "@/components/molecules/NotificationBell";
import toast, { showToast } from "@/utils/toast";

const Dashboard = () => {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedTag, setSelectedTag] = useState("all")
  const [viewMode, setViewMode] = useState("list")
  
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
  const filteredTasks = useMemo(() => {
return tasks.filter(task => {
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
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesTag && matchesProject
    })
  }, [tasks, searchTerm, selectedCategory, selectedPriority, selectedStatus, selectedTag, selectedProject])
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
        const isRecurring = taskData.isRecurring ? " (Recurring)" : ""
        toast.success(taskData.parentTaskId ? `Subtask updated successfully! ✅${isRecurring}` : `Task updated successfully! ✅${isRecurring}`)
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
          
<div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => navigate('/templates')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-all duration-200"
              >
                <ApperIcon name="Layout" size={16} />
                Templates
              </motion.button>
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
          </div>
        </motion.div>

        {/* Stats */}
        <TaskStats tasks={tasks} />

        {/* Quick Add */}
        <div className="mb-6">
          <QuickAddTask 
            onAddTask={handleAddTask} 
            isLoading={createLoading}
          />
        </div>

        {/* Filters */}
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
          />

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
        </div>

        {/* Task List */}
<TaskList
          tasks={filteredTasks}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onToggleSubtask={handleToggleSubtask}
          onCreateSubtask={handleCreateSubtask}
          viewMode={viewMode}
          onCreateTask={handleCreateNewTask}
        />

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

export default Dashboard