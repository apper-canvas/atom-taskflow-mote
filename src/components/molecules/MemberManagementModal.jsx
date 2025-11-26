import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Modal from '@/components/atoms/Modal'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import Button from '@/components/atoms/Button'
import ApperIcon from '@/components/ApperIcon'
import toast from '@/utils/toast'
import { projectService } from '@/services/api/projectService'

function MemberManagementModal({ isOpen, onClose, onSuccess, projectId, editingMember = null }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Member'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Role options
  const roleOptions = [
    { value: 'Owner', label: 'Owner', description: 'Full access to project and settings' },
    { value: 'Admin', label: 'Admin', description: 'Can manage members and project settings' },
    { value: 'Member', label: 'Member', description: 'Can create and edit tasks' },
    { value: 'Viewer', label: 'Viewer', description: 'Can only view project content' }
  ]

  // Initialize form when editing
  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name || '',
        email: editingMember.email || '',
        role: editingMember.role || 'Member'
      })
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Member'
      })
    }
    setErrors({})
  }, [editingMember, isOpen])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      if (editingMember) {
        // Update existing member role
        await projectService.updateMemberRole(projectId, editingMember.Id, formData.role)
        toast.success('Member role updated successfully')
      } else {
        // Add new member
        await projectService.addMember(projectId, formData)
        toast.success('Member added successfully')
      }
      
      onSuccess()
      handleClose()
    } catch (error) {
      toast.error(error.message || 'Failed to save member')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Member'
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingMember ? 'Edit Member' : 'Add Team Member'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ApperIcon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter member's full name"
              disabled={loading || editingMember}
              error={errors.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter member's email"
              disabled={loading || editingMember}
              error={errors.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Select
              value={formData.role}
              onChange={(value) => handleInputChange('role', value)}
              disabled={loading}
              error={errors.role}
            >
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
            {formData.role && (
              <p className="text-xs text-gray-500 mt-1">
                {roleOptions.find(r => r.value === formData.role)?.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            <ApperIcon name={editingMember ? "Save" : "UserPlus"} size={16} />
            {editingMember ? 'Update Member' : 'Add Member'}
          </Button>
        </div>
      </motion.div>
    </Modal>
  )
}

export default MemberManagementModal