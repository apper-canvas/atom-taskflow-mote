import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import ApperIcon from '@/components/ApperIcon'
import Badge from '@/components/atoms/Badge'
import Button from '@/components/atoms/Button'

function MemberCard({ member, onEdit, onRemove, canManageMembers = true }) {
  const [showMenu, setShowMenu] = useState(false)

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Owner':
        return 'default'
      case 'Admin':
        return 'secondary'
      case 'Member':
        return 'outline'
      case 'Viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColors = (name) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-emerald-500 to-green-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-purple-600'
    ]
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  const handleRemoveClick = () => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from this project?`)) {
      onRemove(member.Id)
    }
    setShowMenu(false)
  }

  const handleEditClick = () => {
    onEdit(member)
    setShowMenu(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow bg-white"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColors(member.name)} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}>
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(member.name)
          )}
        </div>

        {/* Member Info */}
        <div className="flex-1">
          <div className="font-medium text-gray-900">{member.name}</div>
<div className="text-sm text-gray-500">{member.email}</div>
          {member.joinedAt && (
            <div className="text-xs text-gray-400 mt-1">
              Joined {(() => {
                try {
                  const date = new Date(member.joinedAt)
                  if (isNaN(date.getTime())) return 'recently'
                  return format(date, 'MMM d, yyyy')
                } catch (error) {
                  return 'recently'
                }
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <Badge variant={getRoleBadgeVariant(member.role)}>
          {member.role}
        </Badge>

        {/* Actions Menu */}
        {canManageMembers && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
            >
              <ApperIcon name="MoreHorizontal" size={16} />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <ApperIcon name="Edit2" size={14} />
                  Edit Role
                </button>
                <button
                  onClick={handleRemoveClick}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <ApperIcon name="UserMinus" size={14} />
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </motion.div>
  )
}

export default MemberCard