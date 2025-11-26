import React from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';

const TeamStats = ({ team, tasks = [] }) => {
  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    notStarted: tasks.filter(t => t.status === 'Not Started').length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === 'Completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length
  };

  const completionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  // Member statistics
  const memberStats = {
    total: team.members.length,
    active: team.members.filter(m => m.status === 'Active').length,
    pending: team.members.filter(m => m.status === 'Pending').length
  };

  const stats = [
    {
      id: 'tasks',
      label: 'Total Tasks',
      value: taskStats.total,
      icon: 'CheckSquare',
      color: 'text-blue-600 bg-blue-100',
      details: [
        { label: 'Completed', value: taskStats.completed, color: 'text-green-600' },
        { label: 'In Progress', value: taskStats.inProgress, color: 'text-orange-600' },
        { label: 'Not Started', value: taskStats.notStarted, color: 'text-gray-600' }
      ]
    },
    {
      id: 'completion',
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: 'TrendingUp',
      color: completionRate >= 80 ? 'text-green-600 bg-green-100' : 
             completionRate >= 60 ? 'text-orange-600 bg-orange-100' : 
             'text-red-600 bg-red-100',
      details: [
        { label: 'Completed', value: taskStats.completed, color: 'text-green-600' },
        { label: 'Remaining', value: taskStats.total - taskStats.completed, color: 'text-gray-600' }
      ]
    },
    {
      id: 'members',
      label: 'Team Members',
      value: memberStats.total,
      icon: 'Users',
      color: 'text-purple-600 bg-purple-100',
      details: [
        { label: 'Active', value: memberStats.active, color: 'text-green-600' },
        { label: 'Pending', value: memberStats.pending, color: 'text-orange-600' }
      ]
    },
    {
      id: 'overdue',
      label: 'Overdue Tasks',
      value: taskStats.overdue,
      icon: 'AlertCircle',
      color: taskStats.overdue > 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100',
      details: taskStats.overdue > 0 ? [
        { label: 'Needs Attention', value: taskStats.overdue, color: 'text-red-600' }
      ] : [
        { label: 'All on Track', value: '✓', color: 'text-green-600' }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <ApperIcon name={stat.icon} size={20} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {stat.details.map((detail, detailIndex) => (
              <div key={detailIndex} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{detail.label}</span>
                <span className={`font-medium ${detail.color}`}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar for Completion Rate */}
          {stat.id === 'completion' && taskStats.total > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    completionRate >= 80 ? 'bg-green-500' :
                    completionRate >= 60 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default TeamStats;