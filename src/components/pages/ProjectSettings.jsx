import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { projectService } from "@/services/api/projectService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Textarea from "@/components/atoms/Textarea";
import Modal from "@/components/atoms/Modal";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import toast, { showToast } from "@/utils/toast";

function ProjectSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (id) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      setError(null)
      const projectData = await projectService.getById(id)
      setProject(projectData)
      setFormData({
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        icon: projectData.icon,
        status: projectData.status,
        startDate: projectData.startDate ? projectData.startDate.split('T')[0] : '',
        endDate: projectData.endDate ? projectData.endDate.split('T')[0] : '',
        settings: projectData.settings || {}
      })
} catch (err) {
      setError(err.message)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    if (field.startsWith('settings.')) {
      const settingKey = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedProject = await projectService.update(id, {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
})
      setProject(updatedProject)
      toast.success('Project settings updated successfully!')
    } catch (err) {
      toast.error('Failed to update project settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
try {
      await projectService.delete(id)
      toast.success('Project deleted successfully')
      navigate('/projects')
    } catch (err) {
      toast.error('Failed to delete project')
    }
  }

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue', color: '#3b82f6' },
    { value: '#10b981', label: 'Green', color: '#10b981' },
    { value: '#f59e0b', label: 'Orange', color: '#f59e0b' },
    { value: '#ef4444', label: 'Red', color: '#ef4444' },
    { value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' },
    { value: '#06b6d4', label: 'Cyan', color: '#06b6d4' },
    { value: '#84cc16', label: 'Lime', color: '#84cc16' },
    { value: '#f97316', label: 'Orange', color: '#f97316' }
  ]

  const iconOptions = [
    '📁', '🚀', '💼', '🎯', '🔧', '📊', '🎨', '💡',
    '🏗️', '📱', '🌐', '⚙️', '📢', '🏠', '🏃‍♂️', '📝'
  ]

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadProject} />
  if (!project) return <ErrorView message="Project not found" />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ApperIcon name="ArrowLeft" size={18} />
            Back to Project
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Settings</h1>
        <p className="text-gray-600">Configure your project settings and preferences</p>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="space-y-6">
            <Input
              label="Project Name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name"
              required
            />
            
            <Textarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your project..."
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange('color', option.value)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        formData.color === option.value
                          ? 'border-gray-400 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: option.color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => handleInputChange('icon', icon)}
                      className={`w-12 h-12 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Status"
                value={formData.status || 'Active'}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Archived">Archived</option>
              </Select>

              <Input
                label="Start Date"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />

              <Input
                label="End Date"
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* Project Permissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Permissions & Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Public Project</h4>
                <p className="text-sm text-gray-600">Allow anyone to view this project</p>
              </div>
              <input
                type="checkbox"
                checked={formData.settings?.isPublic || false}
                onChange={(e) => handleInputChange('settings.isPublic', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Member Invites</h4>
                <p className="text-sm text-gray-600">Allow members to invite others</p>
              </div>
              <input
                type="checkbox"
                checked={formData.settings?.allowMemberInvites || false}
                onChange={(e) => handleInputChange('settings.allowMemberInvites', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Require Approval</h4>
                <p className="text-sm text-gray-600">New members need approval to join</p>
              </div>
              <input
                type="checkbox"
                checked={formData.settings?.requireApproval || false}
                onChange={(e) => handleInputChange('settings.requireApproval', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-red-200 p-6"
        >
          <h2 className="text-xl font-semibold text-red-900 mb-6">Danger Zone</h2>
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Delete Project</h4>
            <p className="text-sm text-red-700 mb-4">
              Once you delete a project, there is no going back. This will also delete all associated tasks.
            </p>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setShowDeleteModal(true)}
            >
              <ApperIcon name="Trash2" size={16} />
              Delete Project
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${id}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="p-6">
          <div className="text-center">
            <ApperIcon name="AlertTriangle" size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you absolutely sure?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold"> "{project?.name}"</span> and all of its tasks.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <ApperIcon name="Trash2" size={16} />
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProjectSettings