import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '@/components/atoms/Modal';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import ApperIcon from '@/components/ApperIcon';
import { teamService } from '@/services/api/teamService';
import toast from '@/utils/toast';

const TeamMemberModal = ({ isOpen, onClose, onSuccess, teamId, editingMember = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Member'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Role options with descriptions
  const roleOptions = [
    { 
      value: 'Owner', 
      label: 'Owner', 
      description: 'Full access to team and settings. Can delete team.' 
    },
    { 
      value: 'Admin', 
      label: 'Admin', 
      description: 'Can manage members, tasks, and team settings.' 
    },
    { 
      value: 'Member', 
      label: 'Member', 
      description: 'Can create and edit tasks, view team content.' 
    },
    { 
      value: 'Viewer', 
      label: 'Viewer', 
      description: 'Can only view team content, cannot edit.' 
    }
  ];

  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name || '',
        email: editingMember.email || '',
        role: editingMember.role || 'Member'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Member'
      });
    }
    setErrors({});
  }, [editingMember, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', role: 'Member' });
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (editingMember) {
        // Update existing member role
        await teamService.updateMemberRole(teamId, editingMember.Id, formData.role);
        toast.success('Member role updated successfully');
      } else {
        // Add new member
        await teamService.addMember(teamId, formData);
        toast.success('Member added successfully');
      }
      
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingMember ? 'Edit Member' : 'Add Team Member'}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ApperIcon name="X" size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
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

            {/* Email */}
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
              {!editingMember && (
                <p className="text-xs text-gray-500 mt-1">
                  An invitation will be sent to this email address
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
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

            {!editingMember && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <ApperIcon name="Mail" size={16} className="text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Invitation Email
                    </h4>
                    <p className="text-xs text-blue-700">
                      The member will receive an email invitation with instructions to join this team.
                      They can accept or decline the invitation.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ApperIcon name={editingMember ? "Save" : "UserPlus"} size={16} />
            {loading ? 'Saving...' : (editingMember ? 'Update Member' : 'Add Member')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TeamMemberModal;