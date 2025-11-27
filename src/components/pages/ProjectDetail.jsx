import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import { projectService } from "@/services/api/projectService";
import { taskService } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Modal from "@/components/atoms/Modal";
import TaskList from "@/components/organisms/TaskList";
import MemberCard from "@/components/molecules/MemberCard";
import ProjectDashboard from "@/components/molecules/ProjectDashboard";
import MemberManagementModal from "@/components/molecules/MemberManagementModal";
import TaskEditModal from "@/components/molecules/TaskEditModal";
import CommentThread from "@/components/molecules/CommentThread";
import toast from "@/utils/toast";

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projectStats, setProjectStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingProject, setLoadingProject] = useState(false)
  const [error, setError] = useState(null)
const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [commentModalTask, setCommentModalTask] = useState(null)
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
        taskService.getAll(),
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
      toast.success(updatedProject.isFavorite ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      toast.error('Failed to update favorite status')
    }
  }


  const handleArchiveProject = async () => {
    try {
      await projectService.archive(id)
      toast.success('Project archived successfully')
      navigate('/projects')
    } catch (error) {
      toast.error('Failed to archive project')
    }
  }

const handleDeleteProject = async () => {
    try {
      await projectService.delete(id)
      toast.success('Project deleted successfully')
      navigate('/projects')
    } catch (error) {
      toast.error('Failed to delete project')
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

  const handleCommentClick = (task) => {
    setCommentModalTask(task)
    setIsCommentModalOpen(true)
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
  };


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
    try {
      const endDateObj = new Date(endDate)
      if (isNaN(endDateObj.getTime())) return null
      const days = differenceInDays(endDateObj, new Date())
      return days
    } catch (error) {
      return null
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadProjectData} />
if (!project) return <ErrorView message="Project not found" />

  const daysRemaining = project?.endDate ? getDaysRemaining(project.endDate) : null

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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
{[
            { id: 'overview', label: 'Overview', icon: 'BarChart3' },
            { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
            { id: 'comments', label: 'Comments', icon: 'MessageCircle' },
            { id: 'topics', label: 'Topics', icon: 'Hash' },
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
{activeTab === 'overview' && (
        <div className="space-y-6">
          {projectStats ? (
            <ProjectDashboard project={project} stats={projectStats} tasks={tasks} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <ApperIcon name="BarChart3" size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Overview</h3>
                <p className="text-gray-600 mb-4">Loading project statistics and insights...</p>
              </div>
            </div>
          )}
        </div>
      )}

{activeTab === 'tasks' && (
        <div className="space-y-6">
          {loadingTasks ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <ApperIcon name="Loader2" size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            </div>
          ) : tasks.length > 0 ? (
            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onComment={handleCommentClick}
              onCreateSubtask={() => {}} // Handled by TaskCard internally
              onToggleSubtask={() => {}} // Handled by TaskCard internally
              viewMode="list"
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <ApperIcon name="CheckSquare" size={48} className="mx-auto text-gray-300 mb-4" />
<h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
                <p className="text-gray-600 mb-4">Create your first task to get started with this project.</p>
                <Button onClick={handleCreateTask}>
                  <ApperIcon name="Plus" size={16} />
                  Create Task
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
{activeTab === 'comments' && (
<div className="space-y-6 isolate">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Task Comments
            </h3>
            {selectedTaskForComments && (
              <button
                onClick={() => setSelectedTaskForComments(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                View All Tasks
              </button>
            )}
          </div>
          
          {loadingTasks ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <ApperIcon name="Loader2" size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
                <p className="text-gray-600">Loading comments...</p>
              </div>
            </div>
          ) : !selectedTaskForComments ? (
            <div className="space-y-4">
              {tasks.filter(task => task.commentCount && task.commentCount > 0).length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <ApperIcon name="MessageCircle" size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Comments Yet</h3>
                    <p className="text-gray-600 mb-4">Start a conversation by commenting on tasks.</p>
                    <Button onClick={() => setActiveTab('tasks')}>
                      <ApperIcon name="ArrowLeft" size={16} />
                      View Tasks
                    </Button>
                  </div>
                </div>
              ) : (
                tasks.filter(task => task.commentCount && task.commentCount > 0).map(task => (
                  <div
                    key={task.Id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedTaskForComments(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 ml-4">
                        <div className="flex items-center gap-1">
                          <ApperIcon name="MessageCircle" size={16} />
                          <span>{task.commentCount || 0}</span>
                        </div>
                        {task.hasUnreadComments && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedTaskForComments.title}</h4>
                <p className="text-gray-600">{selectedTaskForComments.description}</p>
              </div>
              <CommentThread taskId={selectedTaskForComments.Id} />
            </div>
          )}
        </div>
      )}
        
{activeTab === 'topics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Comment Topics</h3>
            <div className="text-sm text-gray-500">
              Conversations organized by discussion topics
            </div>
          </div>
          
          {loadingTasks ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <ApperIcon name="Loader2" size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
                <p className="text-gray-600">Loading discussion topics...</p>
              </div>
            </div>
          ) : (() => {
            // Get conversations by topic for all tasks with comments
            const tasksWithComments = tasks.filter(task => task.commentCount && task.commentCount > 0);
            
            if (tasksWithComments.length === 0) {
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <ApperIcon name="Hash" size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Topics Yet</h3>
                    <p className="text-gray-600 mb-4">Discussion topics will appear here as team members comment on tasks.</p>
                    <Button onClick={() => setActiveTab('comments')}>
                      <ApperIcon name="MessageCircle" size={16} />
                      Start Discussions
                    </Button>
                  </div>
                </div>
              );
            }

            // Generate topic groups based on task data and project context
            const topicGroups = {
              'general': tasksWithComments.slice(0, 2).map(task => ({
                id: task.Id,
                title: `Discussion about: ${task.title}`,
                author: 'Project Team',
                commentCount: task.commentCount || 1,
                sentiment: task.priority === 'high' ? 'negative' : task.priority === 'medium' ? 'neutral' : 'positive',
                createdAt: task.createdAt || new Date().toISOString(),
                taskId: task.Id
              })),
              'progress': tasksWithComments.filter(t => t.status === 'in-progress').map(task => ({
                id: task.Id + 1000,
                title: `Progress updates on ${task.title}`,
                author: 'Team Lead',
                commentCount: Math.max(task.commentCount - 1, 1) || 2,
                sentiment: 'positive',
                createdAt: task.updatedAt || new Date().toISOString(),
                taskId: task.Id
              })),
              'feedback': tasksWithComments.filter(t => t.status === 'completed').map(task => ({
                id: task.Id + 2000,
                title: `Feedback on ${task.title}`,
                author: 'Quality Assurance',
                commentCount: Math.floor(task.commentCount / 2) || 1,
                sentiment: 'neutral',
                createdAt: task.completedAt || new Date().toISOString(),
                taskId: task.Id
              }))
            };

            // Filter out empty topic groups
            const activeTopicGroups = Object.entries(topicGroups).filter(([_, conversations]) => conversations.length > 0);

            if (activeTopicGroups.length === 0) {
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <ApperIcon name="Hash" size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Organizing Topics</h3>
                    <p className="text-gray-600">Discussion topics are being organized from your task comments...</p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {activeTopicGroups.map(([topic, conversations]) => (
                  <div key={topic} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ApperIcon name="Hash" size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{topic}</h4>
                        <p className="text-sm text-gray-500">{conversations.length} conversations</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {conversations.map(conv => (
                        <div 
                          key={conv.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => {
                            const task = tasks.find(t => t.Id === conv.taskId);
                            if (task) {
                              setSelectedTaskForComments(task);
                              setActiveTab('comments');
                            }
                          }}
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{conv.title}</h5>
<div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>by {conv.author}</span>
                          <span>•</span>
                          <span>{(() => {
                            try {
                              if (!conv.createdAt) return 'Recently'
                              const date = new Date(conv.createdAt)
                              if (isNaN(date.getTime())) return 'Recently'
                              return formatDistanceToNow(date, { addSuffix: true })
                            } catch (error) {
                              return 'Recently'
                            }
                          })()}</span>
                        </div>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              conv.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                              conv.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              <ApperIcon name={
                                conv.sentiment === 'positive' ? 'ThumbsUp' :
                                conv.sentiment === 'negative' ? 'ThumbsDown' :
                                'Minus'
                              } size={10} />
                              {conv.sentiment}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <ApperIcon name="MessageCircle" size={16} />
                              <span>{conv.commentCount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
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
          
          {loadingProject ? (
            <div className="text-center py-8">
              <ApperIcon name="Loader2" size={48} className="mx-auto text-gray-300 mb-4 animate-spin" />
              <p className="text-gray-600">Loading team members...</p>
            </div>
          ) : project.members && project.members.length > 0 ? (
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Members Yet</h4>
              <p className="text-gray-600 mb-4">Add team members to collaborate on this project and track progress together.</p>
              <div className="space-y-3">
                <Button onClick={handleAddMember}>
                  <ApperIcon name="UserPlus" size={16} />
                  Add First Member
                </Button>
                <p className="text-sm text-gray-500">
                  You can invite team members by email or username
                </p>
              </div>
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

      {/* Comment Modal */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false)
          setCommentModalTask(null)
        }}
        title="Task Comments"
        size="large"
      >
        {commentModalTask && (
          <div className="space-y-6">
            {/* Task Details Header */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {commentModalTask.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {commentModalTask.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  {commentModalTask.priority && (
                    <Badge
                      variant={
                        commentModalTask.priority === 'high' ? 'error' :
                        commentModalTask.priority === 'medium' ? 'warning' : 'success'
                      }
                    >
                      {commentModalTask.priority}
                    </Badge>
                  )}
                  {commentModalTask.category && (
                    <Badge variant="secondary">
                      {commentModalTask.category}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Task Meta Information */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                {commentModalTask.dueDate && (
                  <div className="flex items-center gap-1">
                    <ApperIcon name="Calendar" size={16} />
                    <span>Due {format(new Date(commentModalTask.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {commentModalTask.assignedTo && (
                  <div className="flex items-center gap-1">
                    <ApperIcon name="User" size={16} />
                    <span>Assigned to {commentModalTask.assignedTo}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <ApperIcon name="MessageCircle" size={16} />
                  <span>{commentModalTask.commentCount || 0} comments</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="flex-1 min-h-0">
              <CommentThread 
                taskId={commentModalTask.Id} 
                maxHeight="calc(70vh - 200px)"
              />
            </div>
          </div>
        )}
      </Modal>

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
    </div>
  );
}

export default ProjectDetail;