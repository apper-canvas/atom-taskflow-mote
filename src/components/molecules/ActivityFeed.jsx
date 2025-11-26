import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';

const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_created':
        return 'Plus';
      case 'task_completed':
        return 'CheckCircle';
      case 'task_assigned':
        return 'UserCheck';
      case 'member_joined':
        return 'UserPlus';
      case 'member_left':
        return 'UserMinus';
      case 'comment_added':
        return 'MessageCircle';
      case 'file_uploaded':
        return 'Upload';
      case 'deadline_updated':
        return 'Calendar';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'task_created':
        return 'text-blue-600 bg-blue-100';
      case 'task_completed':
        return 'text-green-600 bg-green-100';
      case 'task_assigned':
        return 'text-purple-600 bg-purple-100';
      case 'member_joined':
        return 'text-emerald-600 bg-emerald-100';
      case 'member_left':
        return 'text-red-600 bg-red-100';
      case 'comment_added':
        return 'text-orange-600 bg-orange-100';
      case 'file_uploaded':
        return 'text-cyan-600 bg-cyan-100';
      case 'deadline_updated':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ApperIcon name="Activity" size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">No activity yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Team activity will appear here as members work on tasks
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.Id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          {/* Activity Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
            <ApperIcon 
              name={getActivityIcon(activity.type)} 
              size={14} 
            />
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium text-gray-900">
                    {activity.user.name}
                  </span>{' '}
                  {activity.message}
                </p>
                
                {/* Additional context for specific activity types */}
                {activity.type === 'comment_added' && activity.metadata.comment && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 italic">
                    "{activity.metadata.comment}"
                  </div>
                )}
                
                {activity.metadata.taskTitle && (
                  <div className="mt-1 text-xs text-gray-500">
                    Task: {activity.metadata.taskTitle}
                  </div>
                )}
              </div>
              
              <time className="text-xs text-gray-400 flex-shrink-0 ml-3">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </time>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ActivityFeed;