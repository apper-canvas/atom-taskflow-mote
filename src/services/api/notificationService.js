import notificationsData from "@/services/mockData/notifications.json";
// Simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user preferences
let userPreferences = {
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
};

// In-memory storage for notifications (in a real app, this would be a database)
let notifications = [...notificationsData];
let nextId = Math.max(...notifications.map(n => n.Id)) + 1;

export const notificationService = {
  // Get all notifications
  async getAll() {
    await delay();
    return [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

// Get recent notifications (for bell dropdown)
  async getRecent(limit = 10) {
    await delay();
    let filteredNotifications = [...notifications];
    
    // Apply priority-based filtering if enabled
    if (userPreferences.priorityBasedNotifications) {
      filteredNotifications = filteredNotifications.filter(notification => {
        // Only show notifications for high priority tasks
        return notification.metadata?.priority === 'High' || !notification.metadata?.priority;
      });
    }
    
    return filteredNotifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  // Get unread count
  async getUnreadCount() {
    await delay();
    return notifications.filter(n => !n.isRead).length;
  },

  // Mark notification as read
  async markAsRead(id) {
    await delay();
    const notification = notifications.find(n => n.Id === id);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
    }
    return notification;
  },

  // Mark notification as unread
  async markAsUnread(id) {
    await delay();
    const notification = notifications.find(n => n.Id === id);
    if (notification) {
      notification.isRead = false;
      notification.readAt = null;
    }
    return notification;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    await delay();
    const now = new Date().toISOString();
    notifications.forEach(n => {
      if (!n.isRead) {
        n.isRead = true;
        n.readAt = now;
      }
    });
    return notifications.filter(n => n.isRead);
  },

  // Delete notification
  async delete(id) {
    await delay();
    const index = notifications.findIndex(n => n.Id === id);
    if (index !== -1) {
      notifications.splice(index, 1);
      return true;
    }
    return false;
  },

  // Create new notification
  async create(notificationData) {
    await delay();
    const newNotification = {
      Id: nextId++,
      ...notificationData,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotification);
    return newNotification;
  },

  // Get user notification preferences
  async getPreferences() {
    await delay();
    return { ...userPreferences };
  },

  // Update user notification preferences
  async updatePreferences(preferences) {
    await delay();
    userPreferences = { ...preferences };
    return userPreferences;
  },

  // Create task-related notification
  async createTaskNotification(type, taskId, taskTitle, message, userId = null) {
    const typeMessages = {
      task_assigned: 'You have been assigned to a task',
      task_completed: 'Task has been completed',
      task_due: 'Task is due soon',
      task_overdue: 'Task is overdue',
      task_mentioned: 'You were mentioned in a task',
      task_comment: 'New comment on your task',
      task_updated: 'Task has been updated',
      reminder: 'Task reminder'
    };

    const notification = {
      type,
      title: typeMessages[type] || 'Task notification',
      message: message || `${taskTitle}`,
      taskId,
      userId,
      metadata: {
        taskTitle,
        taskId
      }
    };

    return this.create(notification);
  },

  // Batch create notifications
  async createBatch(notificationsData) {
    await delay();
    const createdNotifications = notificationsData.map(data => ({
      Id: nextId++,
      ...data,
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString()
    }));
    
    notifications.unshift(...createdNotifications);
    return createdNotifications;
  },

  // Get notifications by type
  async getByType(type) {
    await delay();
    return notifications.filter(n => n.type === type);
  },

  // Get notifications for specific task
  async getByTask(taskId) {
    await delay();
    return notifications.filter(n => n.taskId === taskId);
  },

  // Check if notifications should be sent (respects quiet hours)
  shouldSendNotification(preferences = userPreferences) {
    if (!preferences.quietHoursEnabled) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 - 08:00 next day)
      return !(currentTime >= startTime && currentTime <= endTime);
    } else {
      // Overnight quiet hours (e.g., 08:00 - 22:00)
      return currentTime >= endTime && currentTime <= startTime;
    }
  },

  // Snooze notification (mark as read temporarily)
  async snooze(id, minutes = 60) {
    await delay();
    const notification = notifications.find(n => n.Id === id);
    if (notification) {
      notification.snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      notification.isRead = true;
    }
    return notification;
  },

  // Get snoozed notifications that should be shown again
  async getUnsnoozed() {
    await delay();
    const now = new Date().toISOString();
    return notifications.filter(n => 
      n.snoozedUntil && n.snoozedUntil <= now
    ).map(n => {
      n.isRead = false;
      n.snoozedUntil = null;
      return n;
});
  },

  // Play notification sound
  async playNotificationSound() {
    if (!userPreferences.soundEnabled) return;
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillator for notification sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound (pleasant notification chime)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
      
      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Clean up
      setTimeout(() => {
        audioContext.close();
      }, 500);
      
    } catch (error) {
      console.error('Failed to play notification sound:', error);
      throw new Error('Audio playback failed');
    }
  }
};