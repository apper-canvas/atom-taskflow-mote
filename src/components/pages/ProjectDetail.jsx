import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format, differenceInDays } from 'date-fns'
import { projectService } from '@/services/api/projectService'
import { taskService } from '@/services/api/taskService'
import ApperIcon from '@/components/ApperIcon'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import Button from '@/components/atoms/Button'
import Badge from '@/components/atoms/Badge'
import ProjectDashboard from '@/components/molecules/ProjectDashboard'
import TaskList from '@/components/organisms/TaskList'
import TaskEditModal from '@/components/molecules/TaskEditModal'
import toast from '@/utils/toast'
import MemberCard from '@/components/molecules/MemberCard'
import MemberManagementModal from '@/components/molecules/MemberManagementModal'
import { showToast } from '@/utils/toast'

function ProjectDetail() {
  const { id } = useParams()
const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projectStats, setProjectStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => {
    if (id) {
      loadProjectData()
    }
  }, [id])

const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [projectData, projectStatsData, allTasks] = await Promise.all([
        projectService.getById(id),
        projectService.getProjectStats(id),
        taskService.getAll()
      ])
      
      setProject(projectData)
      setProjectStats(projectStatsData)
      setTasks(allTasks.filter(task => task.projectId === parseInt(id)))
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }
const handleToggleFavorite = async () => {
    try {
      await projectService.toggleFavorite(id)
      const updatedProject = await projectService.getById(id)
      setProject(updatedProject)
      showToast(updatedProject.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success')
    } catch (error) {
      showToast('Failed to update favorite status', 'error')
    }
  }

  const handleArchiveProject = async () => {
    try {
      await projectService.archive(id)
      showToast('Project archived successfully', 'success')
      navigate('/projects')
    } catch (error) {
      showToast('Failed to archive project', 'error')
    }
  }

  const handleDeleteProject = async () => {
    try {
      await projectService.delete(id)
      showToast('Project deleted successfully', 'success')
      navigate('/projects')
    } catch (error) {
      showToast('Failed to delete project', 'error')
    }
  }
  // Member management handlers
  const handleAddMember = () => {
    setEditingMember(null)
    setIsMemberModalOpen(true)
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
    setIsMemberModalOpen(true)
  }

  const handleRemoveMember = async (memberId) => {
    try {
      await projectService.removeMember(id, memberId)
      toast.success('Member removed successfully')
      loadProjectData()
    } catch (error) {
      toast.error(error.message || 'Failed to remove member')
    }
  }

  const handleMemberModalSuccess = () => {
    loadProjectData()
  }

  const handleCreateTask = () => {
    setEditingTask({ projectId: parseInt(id) })
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (taskId, taskData) => {
    try {
      if (taskId) {
const updatedTask = await taskService.update(taskId, taskData)
        setTasks(prev => prev.map(t => t.Id === taskId ? updatedTask : t))
        toast.success('Task updated successfully!')
      } else {
        const newTask = await taskService.create({ ...taskData, projectId: parseInt(id) })
        setTasks(prev => [newTask, ...prev])
        toast.success('Task created successfully!')
      }
      setIsTaskModalOpen(false)
      setEditingTask(null)
      
      // Refresh project stats
      const updatedStats = await projectService.getProjectStats(id)
setProjectStats(updatedStats)
    } catch (err) {
      toast.error('Failed to save task')
      throw err
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.delete(taskId)
      setTasks(prev => prev.filter(t => t.Id !== taskId))
setIsTaskModalOpen(false)
      setEditingTask(null)
      toast.success('Task deleted successfully')
      
      // Refresh project stats
      const updatedStats = await projectService.getProjectStats(id)
      setProjectStats(updatedStats)
    } catch (err) {
      toast.error('Failed to delete task')
      throw err
    }
  }

  const handleToggleComplete = async (taskId, completed) => {
    try {
      const updatedTask = await taskService.update(taskId, { completed })
      setTasks(prev => prev.map(t => t.Id === taskId ? updatedTask : t))
if (completed) {
        toast.success('Task completed! Great job! ✅')
      } else {
        toast.info('Task marked as active')
      }
      
      // Refresh project stats
      const updatedStats = await projectService.getProjectStats(id)
      setProjectStats(updatedStats)
    } catch (err) {
      toast.error('Failed to update task')
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

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null
    const days = differenceInDays(new Date(endDate), new Date())
    return days
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadProjectData} />
  if (!project) return <ErrorView message="Project not found" />

  const daysRemaining = getDaysRemaining(project.endDate)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ApperIcon name="ArrowLeft" size={18} />
            Back to Projects
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 mb-3">{project.description}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ApperIcon name="Users" size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{project.members.length} members</span>
                  </div>
                )}
                {daysRemaining !== null && (
                  <div className="flex items-center gap-2">
                    <ApperIcon name="Calendar" size={16} className="text-gray-500" />
                    <span className={`text-sm ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
                       daysRemaining === 0 ? 'Due today' :
                       `${daysRemaining} days remaining`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCreateTask}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <ApperIcon name="Plus" size={18} />
              New Task
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${id}/settings`)}
            >
              <ApperIcon name="Settings" size={18} />
Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${id}/timeline`)}
            >
              <ApperIcon name="Calendar" size={18} />
              Timeline
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className={project?.isFavorite ? 'text-yellow-600 border-yellow-300' : ''}
            >
              <ApperIcon 
                name="Star" 
                size={18} 
                className={project?.isFavorite ? 'fill-current' : ''} 
              />
              {project?.isFavorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button
              variant="outline"
              onClick={handleArchiveProject}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <ApperIcon name="Archive" size={18} />
              Archive
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <ApperIcon name="Trash2" size={18} />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: 'BarChart3' },
            { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
            { id: 'members', label: 'Members', icon: 'Users' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ApperIcon name={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && projectStats && (
        <ProjectDashboard project={project} stats={projectStats} tasks={tasks} />
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onCreateSubtask={() => {}} // Handled by TaskCard internally
            onToggleSubtask={() => {}} // Handled by TaskCard internally
            viewMode="list"
          />
        </div>
      )}

{activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Project Members</h3>
            <Button size="sm" onClick={handleAddMember}>
              <ApperIcon name="UserPlus" size={16} />
              Add Member
            </Button>
          </div>
          
{project.members && project.members.length > 0 ? (
            <div className="space-y-4">
              {project.members.map(member => (
                <MemberCard
                  key={member.Id}
                  member={member}
                  onEdit={handleEditMember}
                  onRemove={handleRemoveMember}
                  canManageMembers={true}
                />
              ))}
            </div>
) : (
            <div className="text-center py-12">
              <ApperIcon name="Users" size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No members yet</h4>
              <p className="text-gray-600 mb-4">Add team members to collaborate on this project</p>
              <Button onClick={handleAddMember}>
                <ApperIcon name="UserPlus" size={16} />
                Add First Member
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskEditModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
/>

      {/* Member Management Modal */}
      <MemberManagementModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSuccess={handleMemberModalSuccess}
        projectId={id}
        editingMember={editingMember}
/>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <ApperIcon name="AlertTriangle" size={24} className="text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{project?.name}"? This action cannot be undone and will remove all associated tasks and data.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
              >
                Delete Project
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail