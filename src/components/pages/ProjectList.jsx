import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { projectService } from '@/services/api/projectService'
import ApperIcon from '@/components/ApperIcon'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import ProjectCard from '@/components/molecules/ProjectCard'
import ProjectCreateModal from '@/components/molecules/ProjectCreateModal'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import toast from '@/utils/toast'

function ProjectList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updatedAt")

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

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
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
    all: projects.length,
    Active: projects.filter(p => p.status === 'Active').length,
    Completed: projects.filter(p => p.status === 'Completed').length,
    'On Hold': projects.filter(p => p.status === 'On Hold').length,
    Archived: projects.filter(p => p.status === 'Archived').length
  }

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadProjects} />

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
            <div className="text-sm text-gray-600">{status === 'all' ? 'All Projects' : status}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="Search"
          />
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
    </div>
  )
}

export default ProjectList