import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { projectService } from "@/services/api/projectService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ProjectCreateModal from "@/components/molecules/ProjectCreateModal";
import ProjectCard from "@/components/molecules/ProjectCard";
import toast from "@/utils/toast";

function ProjectList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
const [sortBy, setSortBy] = useState("updatedAt")
  const [confirmDelete, setConfirmDelete] = useState(null)
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await projectService.getAll()
      setProjects(data)
    } catch (err) {
      setError(err.message)
toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (projectData) => {
    try {
      const newProject = await projectService.create(projectData)
      setProjects(prev => [newProject, ...prev])
      setIsCreateModalOpen(false)
toast.success('Project created successfully! 🎉')
    } catch (err) {
toast.error('Failed to create project')
      throw err
    }
  }

const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

const handleToggleFavorite = async (projectId, e) => {
    e.stopPropagation()
    try {
      await projectService.toggleFavorite(projectId)
      await loadProjects()
      const project = projects.find(p => p.Id === projectId)
      toast.success(project?.isFavorite ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      toast.error('Failed to update favorite status')
    }
  }

const handleArchiveProject = async (projectId, e) => {
    e.stopPropagation()
    try {
      await projectService.archive(projectId)
      await loadProjects()
      toast.success('Project archived successfully')
    } catch (error) {
      toast.error('Failed to archive project')
    }
  }
const handleDeleteProject = async (projectId) => {
    try {
      await projectService.delete(projectId)
      await loadProjects()
      toast.success('Project deleted successfully')
      setConfirmDelete(null)
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }
  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Always show favorites first
      if (a.isFavorite !== b.isFavorite) {
        return b.isFavorite - a.isFavorite
      }
      
      // Then sort by selected criteria
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'updatedAt':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt)
      }
    })

const statusCounts = {
    all: projects.filter(p => !p.isArchived).length,
    Active: projects.filter(p => p.status === 'Active' && !p.isArchived).length,
    Completed: projects.filter(p => p.status === 'Completed' && !p.isArchived).length,
    'On Hold': projects.filter(p => p.status === 'On Hold' && !p.isArchived).length,
    Archived: projects.filter(p => p.status === 'Archived' || p.isArchived).length
  }

if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadProjects} />

  const confirmDeleteProject = (project, e) => {
    e.stopPropagation()
    setConfirmDelete(project)
  }
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage and organize your projects</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        >
          <ApperIcon name="Plus" size={18} />
          New Project
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {Object.entries(statusCounts).map(([status, count]) => (
<motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              statusFilter === status
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <div className="text-2xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              {status === 'all' ? 'All Projects' : status}
              {status === 'all' && projects.filter(p => p.isFavorite).length > 0 && (
                <ApperIcon name="Star" size={12} className="text-yellow-500 fill-current" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
<div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Input
            placeholder="Search projects and files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="Search"
          />
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              <div className="p-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Search Results</p>
              </div>
              <div className="p-2 space-y-1">
                <div className="text-xs text-gray-500 px-2 py-1">Projects matching "{searchTerm}"</div>
                <div className="text-xs text-gray-400 px-2 py-1">File search results would appear here</div>
                <div className="text-xs text-blue-600 px-2 py-1 cursor-pointer hover:bg-blue-50 rounded">
                  Advanced file search →
                </div>
              </div>
            </div>
          )}
        </div>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sm:w-48"
        >
          <option value="updatedAt">Recently Updated</option>
          <option value="createdAt">Recently Created</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredAndSortedProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <ApperIcon name="FolderOpen" size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== "all" ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters or search terms"
              : "Create your first project to get started organizing your tasks"
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <ApperIcon name="Plus" size={18} />
              Create Your First Project
            </Button>
          )}
        </motion.div>
      ) : (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map((project, index) => (
            <motion.div
              key={project.Id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ProjectCard
                project={project}
                onClick={() => handleProjectClick(project.Id)}
                onToggleFavorite={handleToggleFavorite}
                onArchive={handleArchiveProject}
                onDelete={confirmDeleteProject}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
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
              Are you sure you want to delete "{confirmDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteProject(confirmDelete.Id)}
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

export default ProjectList