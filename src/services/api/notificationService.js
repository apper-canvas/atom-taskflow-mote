import notificationsData from "@/services/mockData/notifications.json";
import React from "react";
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
    reminder: true,
    comment_reply: true,
    comment_mention: true
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

  async createCommentNotification(type, commentId, taskId, taskTitle, message, userId, authorName, commentContent = null) {
    const typeMessages = {
      comment_reply: 'Someone replied to your comment',
      comment_mention: 'You were mentioned in a comment'
    };

    const notification = {
      type,
      title: typeMessages[type] || 'Comment notification',
      message: message || typeMessages[type],
      taskId,
      userId,
      metadata: {
        taskTitle,
        taskId,
        commentId,
        authorName,
        commentContent: commentContent ? (commentContent.length > 100 ? commentContent.substring(0, 97) + '...' : commentContent) : null
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
  },

  // Email Automation Features
  
  // Send email notification
  async sendEmailNotification(emailData) {
    await delay();
    
    try {
      // Check if email notifications are enabled
      if (!userPreferences.emailFrequency || userPreferences.emailFrequency === 'never') {
        return { success: false, reason: 'Email notifications disabled' };
      }

      // Respect quiet hours for non-urgent emails
      if (!this.shouldSendNotification() && emailData.priority !== 'High') {
        return { success: false, reason: 'Quiet hours active' };
      }

      // Create email from template
      const emailContent = await this.createEmailFromTemplate(emailData);
      
      // Queue email for sending
      await this.queueEmail({
        ...emailContent,
        ...emailData,
        queuedAt: new Date().toISOString()
      });

      // Create notification record
      const notification = await this.create({
        type: 'email_sent',
        title: 'Email notification sent',
        message: `Email sent: ${emailContent.subject}`,
        taskId: emailData.taskId,
        metadata: {
          emailType: emailData.type,
          recipient: emailData.assignedTo,
          subject: emailContent.subject
        }
      });

      return { success: true, notificationId: notification.Id };
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw new Error(`Email notification failed: ${error.message}`);
    }
  },

// Create email content from template
  async createEmailFromTemplate(emailData) {
    await delay();
    
    const templates = {
      task_assigned: {
        subject: `New task assigned: ${emailData.taskTitle}`,
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Task Assignment</h2>
            <p>You have been assigned a new task:</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${emailData.taskTitle}</h3>
              ${emailData.description ? `<p style="color: #6b7280;">${emailData.description}</p>` : ''}
              ${emailData.dueDate ? `<p><strong>Due Date:</strong> ${new Date(emailData.dueDate).toLocaleDateString()}</p>` : ''}
              ${emailData.priority ? `<p><strong>Priority:</strong> ${emailData.priority}</p>` : ''}
            </div>
            <p>Click here to view the task in your dashboard.</p>
          </div>
        `,
        textTemplate: `New Task Assignment\n\nYou have been assigned: ${emailData.taskTitle}\n\n${emailData.description || ''}\n\nDue Date: ${emailData.dueDate ? new Date(emailData.dueDate).toLocaleDateString() : 'Not set'}\nPriority: ${emailData.priority || 'Not set'}`
      },
      
      task_completed: {
        subject: `Task completed: ${emailData.taskTitle}`,
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Task Completed</h2>
            <p>A task has been marked as completed:</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${emailData.taskTitle}</h3>
              <p><strong>Completed by:</strong> ${emailData.completedBy || 'Unknown'}</p>
              <p><strong>Completed at:</strong> ${emailData.completedAt ? new Date(emailData.completedAt).toLocaleString() : 'Just now'}</p>
            </div>
          </div>
        `,
        textTemplate: `Task Completed\n\nTask: ${emailData.taskTitle}\nCompleted by: ${emailData.completedBy || 'Unknown'}\nCompleted at: ${emailData.completedAt ? new Date(emailData.completedAt).toLocaleString() : 'Just now'}`
      },
      
      task_due: {
        subject: `Task due soon: ${emailData.taskTitle}`,
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Task Due Soon</h2>
            <p>This task is due soon:</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${emailData.taskTitle}</h3>
              <p><strong>Due Date:</strong> ${emailData.dueDate ? new Date(emailData.dueDate).toLocaleDateString() : 'Not set'}</p>
              <p><strong>Priority:</strong> ${emailData.priority || 'Not set'}</p>
            </div>
            <p>Please review and complete this task on time.</p>
          </div>
        `,
        textTemplate: `Task Due Soon\n\nTask: ${emailData.taskTitle}\nDue Date: ${emailData.dueDate ? new Date(emailData.dueDate).toLocaleDateString() : 'Not set'}\nPriority: ${emailData.priority || 'Not set'}`
      },
      
      task_overdue: {
        subject: `OVERDUE: ${emailData.taskTitle}`,
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Task Overdue</h2>
            <p>This task is now overdue:</p>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${emailData.taskTitle}</h3>
              <p><strong>Was Due:</strong> ${emailData.dueDate ? new Date(emailData.dueDate).toLocaleDateString() : 'Not set'}</p>
              <p><strong>Days Overdue:</strong> ${emailData.daysOverdue || 'Unknown'}</p>
              <p><strong>Priority:</strong> ${emailData.priority || 'Not set'}</p>
            </div>
            <p style="color: #ef4444; font-weight: bold;">Immediate attention required!</p>
          </div>
        `,
        textTemplate: `TASK OVERDUE\n\nTask: ${emailData.taskTitle}\nWas Due: ${emailData.dueDate ? new Date(emailData.dueDate).toLocaleDateString() : 'Not set'}\nDays Overdue: ${emailData.daysOverdue || 'Unknown'}\nPriority: ${emailData.priority || 'Not set'}\n\nImmediate attention required!`
      },

      task_comment: {
        subject: `New comment on ${emailData.taskTitle}`,
        htmlTemplate: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">New Comment</h2>
            <p>A new comment has been added to your task:</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${emailData.taskTitle}</h3>
              <div style="background: white; padding: 16px; border-radius: 6px; margin: 12px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Comment by:</strong> ${emailData.commentAuthor || 'Unknown User'}</p>
                <div style="color: #374151; line-height: 1.5;">
                  ${emailData.commentSnippet || 'No comment content available'}
                </div>
              </div>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                <strong>Posted:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
            <p>Click here to view the full conversation and respond.</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>You're receiving this email because you're involved with this task. Update your notification preferences in your account settings.</p>
            </div>
          </div>
        `,
        textTemplate: `New Comment on ${emailData.taskTitle}\n\nA new comment has been added to your task:\n\nTask: ${emailData.taskTitle}\nComment by: ${emailData.commentAuthor || 'Unknown User'}\nComment: ${emailData.commentSnippet || 'No comment content available'}\nPosted: ${new Date().toLocaleString()}\n\nView the full conversation in your dashboard.`
      }
    };

    const template = templates[emailData.type] || templates.task_assigned;
    
    return {
      subject: template.subject,
      html: template.htmlTemplate,
      text: template.textTemplate
    };
  },

  // Queue email for batch sending
  async queueEmail(emailData) {
    await delay();
    
    if (!this.emailQueue) {
      this.emailQueue = [];
    }
    
    const queueItem = {
      id: Date.now() + Math.random(),
      ...emailData,
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      queuedAt: new Date().toISOString()
    };
    
    this.emailQueue.push(queueItem);
    return queueItem;
  },

  // Process email queue
  async processEmailQueue() {
    await delay();
    
    if (!this.emailQueue || this.emailQueue.length === 0) {
      return { processed: 0, failed: 0 };
    }
    
    const queuedEmails = this.emailQueue.filter(email => email.status === 'queued');
    let processed = 0;
    let failed = 0;
    
    for (const email of queuedEmails) {
      try {
        // Send email via edge function
        const result = await this.sendEmailViaEdgeFunction(email);
        
        if (result.success) {
          email.status = 'sent';
          email.sentAt = new Date().toISOString();
          processed++;
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error) {
        email.attempts++;
        
        if (email.attempts >= email.maxAttempts) {
          email.status = 'failed';
          email.failedAt = new Date().toISOString();
          email.lastError = error.message;
          failed++;
        } else {
          email.status = 'queued'; // Retry later
          email.nextRetry = new Date(Date.now() + (email.attempts * 60000)).toISOString(); // Exponential backoff
        }
      }
    }
    
    return { processed, failed };
  },

  // Send email via edge function
  async sendEmailViaEdgeFunction(emailData) {
    try {
      // Initialize ApperClient
      if (typeof window === 'undefined' || !window.ApperSDK) {
        throw new Error('ApperSDK not available');
      }
      
      const { ApperClient } = window.ApperSDK;
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });

      const result = await apperClient.functions.invoke(import.meta.env.VITE_SEND_EMAIL_NOTIFICATION, {
        body: JSON.stringify({
          to: emailData.assignedTo || emailData.recipientEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          taskId: emailData.taskId,
          type: emailData.type
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (result.success === false) {
        console.info(`apper_info: Got an error in this function: ${import.meta.env.VITE_SEND_EMAIL_NOTIFICATION}. The response body is: ${JSON.stringify(result)}.`);
        return { success: false, error: result.error || 'Email sending failed' };
      }

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.info(`apper_info: Got this error an this function: ${import.meta.env.VITE_SEND_EMAIL_NOTIFICATION}. The error is: ${error.message}`);
      return { success: false, error: error.message };
    }
  },

  // Batch send emails
  async batchSendEmails(emailDataArray) {
    await delay();
    
    const results = [];
    
    for (const emailData of emailDataArray) {
      try {
        const result = await this.sendEmailNotification(emailData);
        results.push({ success: true, emailData, result });
      } catch (error) {
        results.push({ success: false, emailData, error: error.message });
      }
    }
    
    return results;
  },

  // Send task reminder emails
  async sendTaskReminders() {
    await delay();
    
    try {
      // This would typically get tasks from the task service
      // For now, we'll create a simple reminder system
      const reminderEmails = [];
      
      // Get tasks due in next 24 hours (mock implementation)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // In real implementation, this would query actual tasks
      const dueTasks = []; // taskService.getTasksDueBefore(tomorrow)
      
      for (const task of dueTasks) {
        reminderEmails.push({
          type: 'task_due',
          taskId: task.Id,
          taskTitle: task.title,
          assignedTo: task.assignedTo,
          dueDate: task.dueDate,
          priority: task.priority
        });
      }
      
      if (reminderEmails.length > 0) {
        return await this.batchSendEmails(reminderEmails);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to send task reminders:', error);
      throw new Error('Task reminder sending failed');
    }
  },

  // Configure email automation settings
  async configureEmailAutomation(settings) {
    await delay();
    
    const emailSettings = {
      enabled: settings.enabled ?? true,
      frequency: settings.frequency || 'instant', // instant, daily, weekly
      types: settings.types || ['task_assigned', 'task_due', 'task_overdue'],
      batchSize: settings.batchSize || 10,
      retryAttempts: settings.retryAttempts || 3,
      templates: settings.templates || {},
      updatedAt: new Date().toISOString()
    };
    
    // Store settings (in real app, would be in user preferences)
    if (!userPreferences.emailAutomation) {
      userPreferences.emailAutomation = {};
    }
    
    userPreferences.emailAutomation = emailSettings;
    return emailSettings;
  },

  // Get email automation settings
  async getEmailAutomationSettings() {
    await delay();
    return userPreferences.emailAutomation || {
      enabled: true,
      frequency: 'instant',
      types: ['task_assigned', 'task_due', 'task_overdue'],
      batchSize: 10,
      retryAttempts: 3
    };
  }
};