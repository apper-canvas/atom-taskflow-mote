import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import { notificationService } from '@/services/api/notificationService';
import { formatDistanceToNow, format } from 'date-fns';
import toast from '@/utils/toast';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedNotifications = notifications
    .filter(notification => {
      if (filter === 'unread') return !notification.isRead;
      if (filter === 'read') return notification.isRead;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
n.Id === notificationId ? { ...n, isRead: true } : n
      ));
      toast('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await notificationService.markAsUnread(notificationId);
      setNotifications(prev => prev.map(n => 
n.Id === notificationId ? { ...n, isRead: false } : n
      ));
      toast('Notification marked as unread');
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
      toast('Failed to mark as unread', 'error');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await notificationService.delete(notificationId);
setNotifications(prev => prev.filter(n => n.Id !== notificationId));
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
      toast('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast('Failed to delete notification', 'error');
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await Promise.all(selectedNotifications.map(id => notificationService.markAsRead(id)));
      setNotifications(prev => prev.map(n => 
        selectedNotifications.includes(n.Id) ? { ...n, isRead: true } : n
));
      setSelectedNotifications([]);
      toast(`${selectedNotifications.length} notifications marked as read`);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast('Failed to mark notifications as read', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedNotifications.length} notifications?`)) return;

    try {
      await Promise.all(selectedNotifications.map(id => notificationService.delete(id)));
setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.Id)));
      setSelectedNotifications([]);
      toast(`${selectedNotifications.length} notifications deleted`);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      toast('Failed to delete notifications', 'error');
    }
  };

  const handleSelectAll = () => {
    const visibleIds = filteredAndSortedNotifications.map(n => n.Id);
    if (selectedNotifications.length === visibleIds.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(visibleIds);
    }
  };

  const getNotificationIcon = (type) => {
const iconMap = {
      task_assigned: 'UserPlus',
      task_completed: 'CheckCircle',
      task_due: 'Clock',
      task_overdue: 'AlertTriangle',
      task_mentioned: 'AtSign',
      task_comment: 'MessageCircle',
      task_updated: 'Edit',
      reminder: 'Bell',
      comment_reply: 'MessageCircle',
      comment_mention: 'AtSign'
    };
    return iconMap[type] || 'Bell';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      task_assigned: 'text-blue-500',
      task_completed: 'text-green-500',
      task_due: 'text-orange-500',
      task_overdue: 'text-red-500',
      task_mentioned: 'text-purple-500',
      task_comment: 'text-indigo-500',
      task_updated: 'text-gray-500',
      reminder: 'text-yellow-500',
      comment_reply: 'text-indigo-500',
      comment_mention: 'text-purple-500'
    };
    return colorMap[type] || 'text-gray-500';
  };

const getNotificationBgColor = (type) => {
    const colorMap = {
      task_assigned: 'bg-blue-50',
      task_completed: 'bg-green-50',
      task_due: 'bg-orange-50',
      task_overdue: 'bg-red-50',
      task_mentioned: 'bg-purple-50',
      task_comment: 'bg-indigo-50',
      task_updated: 'bg-gray-50',
      reminder: 'bg-yellow-50',
      comment_reply: 'bg-indigo-50',
      comment_mention: 'bg-purple-50'
    };
    return colorMap[type] || 'bg-gray-50';
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadNotifications} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
<div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">
                Manage your notifications and preferences
                {filter === 'priority' && ' • Showing priority notifications only'}
              </p>
            </div>
            <Button
              onClick={() => navigate('/notifications/preferences')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ApperIcon name="Settings" size={16} />
              Preferences
            </Button>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
<Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="min-w-32"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="priority">Priority Only</option>
                </Select>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="min-w-32"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </Select>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedNotifications.length === filteredAndSortedNotifications.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {selectedNotifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedNotifications.length} selected
                  </span>
                  <Button
                    onClick={handleBulkMarkAsRead}
                    variant="outline"
                    size="sm"
                  >
                    Mark as read
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredAndSortedNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <ApperIcon name="Bell" size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'unread' ? "You don't have any unread notifications" : 
                 filter === 'read' ? "You don't have any read notifications" :
                 "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            filteredAndSortedNotifications.map((notification) => (
              <motion.div
                key={notification.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.Id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(prev => [...prev, notification.Id]);
                      } else {
                        setSelectedNotifications(prev => prev.filter(id => id !== notification.Id));
                      }
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  
                  <div className={`flex-shrink-0 p-3 rounded-full ${getNotificationBgColor(notification.type)}`}>
                    <ApperIcon 
                      name={getNotificationIcon(notification.type)} 
                      size={24} 
                      className={getNotificationColor(notification.type)}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-700 mb-3">
                          {notification.message}
</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{(() => {
                            try {
                              if (!notification.createdAt) return 'No date'
                              const date = new Date(notification.createdAt)
                              if (isNaN(date.getTime())) return 'No date'
                              return format(date, 'MMM d, yyyy h:mm a')
                            } catch (error) {
                              return 'No date'
                            }
                          })()}</span>
                          <span>•</span>
                          <span>{(() => {
                            try {
                              if (!notification.createdAt) return 'Recently'
                              const date = new Date(notification.createdAt)
                              if (isNaN(date.getTime())) return 'Recently'
                              return formatDistanceToNow(date, { addSuffix: true })
                            } catch (error) {
                              return 'Recently'
                            }
                          })()}</span>
                          {!notification.isRead && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Unread
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {notification.isRead ? (
                          <button
                            onClick={() => handleMarkAsUnread(notification.Id)}
                            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Mark unread
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsRead(notification.Id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.Id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;