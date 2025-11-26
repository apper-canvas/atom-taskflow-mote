import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import { notificationService } from '@/services/api/notificationService';
import toast from '@/utils/toast';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    emailFrequency: 'instant',
    pushNotifications: true,
soundEnabled: true,
    priorityBasedNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    notificationTypes: {
      task_assigned: true,
      task_completed: true,
      task_due: true,
      task_overdue: true,
      task_mentioned: true,
      task_comment: true,
      task_updated: false,
      reminder: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await notificationService.getPreferences();
      setPreferences(data);
    } catch (err) {
      setError('Failed to load preferences. Please try again.');
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
await notificationService.updatePreferences(preferences);
      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotificationType = (type) => {
    setPreferences(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: !prev.notificationTypes[type]
      }
    }));
  };

  const notificationTypeLabels = {
    task_assigned: {
      title: 'Task Assignments',
      description: 'When you are assigned to a task'
    },
    task_completed: {
      title: 'Task Completions',
      description: 'When tasks you created or are assigned to are completed'
    },
    task_due: {
      title: 'Due Date Reminders',
      description: 'When tasks are approaching their due date'
    },
    task_overdue: {
      title: 'Overdue Tasks',
      description: 'When tasks are past their due date'
    },
    task_mentioned: {
      title: 'Mentions (@)',
      description: 'When you are mentioned in task comments or descriptions'
    },
    task_comment: {
      title: 'Comments',
      description: 'When someone comments on your tasks'
    },
    task_updated: {
      title: 'Task Updates',
      description: 'When tasks you follow are updated'
    },
    reminder: {
      title: 'Custom Reminders',
      description: 'Custom reminders you set for tasks'
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadPreferences} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate('/notifications')}
              variant="outline"
              size="sm"
            >
              <ApperIcon name="ArrowLeft" size={16} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
              <p className="text-gray-600">Customize how and when you receive notifications</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ApperIcon name="Mail" size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Frequency
                </label>
                <Select
                  value={preferences.emailFrequency}
                  onChange={(e) => setPreferences(prev => ({ ...prev, emailFrequency: e.target.value }))}
                  className="max-w-xs"
                >
                  <option value="instant">Instant (as they happen)</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="never">Never</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ApperIcon name="Smartphone" size={24} className="text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Enable Push Notifications</h3>
                  <p className="text-sm text-gray-600">Receive notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.pushNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

<div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Notification Sounds</h3>
                  <p className="text-sm text-gray-600">Play sound when receiving notifications</p>
                </div>
                <div className="flex items-center gap-3">
                  {preferences.soundEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await notificationService.playNotificationSound();
                          toast.success('Sound test played');
                        } catch (error) {
                          toast.error('Unable to play sound');
                        }
                      }}
                      className="text-xs px-3 py-1"
                    >
                      <ApperIcon name="Volume2" size={14} className="mr-1" />
                      Test Sound
                    </Button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.soundEnabled}
                      onChange={(e) => setPreferences(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Priority-Based Notifications</h3>
                  <p className="text-sm text-gray-600">Only receive notifications for high priority tasks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.priorityBasedNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, priorityBasedNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ApperIcon name="Moon" size={24} className="text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Quiet Hours</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Enable Quiet Hours</h3>
                  <p className="text-sm text-gray-600">Pause notifications during certain hours</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quietHoursEnabled}
                    onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {preferences.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ApperIcon name="Settings" size={24} className="text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Types</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(notificationTypeLabels).map(([type, { title, description }]) => (
                <div key={type} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <h3 className="font-medium text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.notificationTypes[type]}
                      onChange={() => handleToggleNotificationType(type)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              loading={saving}
              className="px-8"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;