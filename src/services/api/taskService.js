import tasksData from "@/services/mockData/tasks.json";
let tasks = [...tasksData]

const delay = () => new Promise(resolve => setTimeout(resolve, 300))

export const taskService = {
  async getAll() {
    await delay()
    return [...tasks]
  },

  async getById(id) {
    await delay()
    const task = tasks.find(t => t.Id === parseInt(id))
    if (!task) {
      throw new Error(`Task with Id ${id} not found`)
    }
    return { ...task }
  },

  async create(taskData) {
    await delay()
const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.Id)) : 0
    const newTask = {
Id: maxId + 1,
      projectId: taskData.projectId || null,
      title: taskData.title || "",
      description: taskData.description || "",
      category: taskData.category || "Personal",
      priority: taskData.priority || "Medium",
      status: taskData.status || "Not Started",
      dueDate: taskData.dueDate || null,
      dueDateTime: taskData.dueDateTime || null,
      parentTaskId: taskData.parentTaskId || null,
      tags: taskData.tags || [],
      completed: taskData.status === "Completed" || false,
      completedAt: taskData.status === "Completed" ? new Date().toISOString() : null,
isRecurring: taskData.isRecurring || false,
      recurrence: taskData.recurrence || null,
      assignedTo: taskData.assignedTo || null,
      reminders: taskData.reminders || [],
      estimatedTime: taskData.estimatedTime || null,
      actualTime: taskData.actualTime || 0,
      timeSpent: taskData.timeSpent || 0,
      isTracking: false,
      trackingStartedAt: null,
      notes: taskData.notes || "",
      attachments: Array.isArray(taskData.attachments) ? taskData.attachments.map(att => ({
        ...att,
        folderId: att.folderId || null,
        isArchived: att.isArchived || false,
        storageLocation: att.storageLocation || 'local'
      })) : [],
linkedTasks: Array.isArray(taskData.linkedTasks) ? taskData.linkedTasks : [],
      externalLinks: Array.isArray(taskData.externalLinks) ? taskData.externalLinks : [],
      commentCount: 0,
      hasUnreadComments: false,
      lastCommentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    tasks.push(newTask)
    this.saveToLocalStorage()
    return { ...newTask }
  },

async update(id, updates) {
    await delay()
    const index = tasks.findIndex(t => t.Id === parseInt(id))
    if (index === -1) {
      throw new Error(`Task with Id ${id} not found`)
    }
    
    const updatedTask = {
...tasks[index],
      ...updates,
tags: updates.tags || tasks[index].tags || [],
      isRecurring: updates.isRecurring !== undefined ? updates.isRecurring : tasks[index].isRecurring,
      recurrence: updates.recurrence !== undefined ? updates.recurrence : tasks[index].recurrence,
      assignedTo: updates.assignedTo !== undefined ? updates.assignedTo : tasks[index].assignedTo,
      reminders: updates.reminders !== undefined ? updates.reminders : (tasks[index].reminders || []),
      estimatedTime: updates.estimatedTime !== undefined ? updates.estimatedTime : tasks[index].estimatedTime,
      actualTime: updates.actualTime !== undefined ? updates.actualTime : (tasks[index].actualTime || 0),
      timeSpent: updates.timeSpent !== undefined ? updates.timeSpent : (tasks[index].timeSpent || 0),
      isTracking: updates.isTracking !== undefined ? updates.isTracking : (tasks[index].isTracking || false),
      trackingStartedAt: updates.trackingStartedAt !== undefined ? updates.trackingStartedAt : tasks[index].trackingStartedAt,
notes: updates.notes !== undefined ? updates.notes : (tasks[index].notes || ""),
      attachments: updates.attachments !== undefined ? 
        (Array.isArray(updates.attachments) ? updates.attachments.map(att => ({
          ...att,
          folderId: att.folderId || null,
          isArchived: att.isArchived || false,
          storageLocation: att.storageLocation || 'local'
        })) : []) : 
        (Array.isArray(tasks[index].attachments) ? tasks[index].attachments : []),
      linkedTasks: updates.linkedTasks !== undefined ? 
        (Array.isArray(updates.linkedTasks) ? updates.linkedTasks : []) : 
        (Array.isArray(tasks[index].linkedTasks) ? tasks[index].linkedTasks : []),
externalLinks: updates.externalLinks !== undefined ?
        (Array.isArray(updates.externalLinks) ? updates.externalLinks : []) :
        (Array.isArray(tasks[index].externalLinks) ? tasks[index].externalLinks : []),
      commentCount: updates.commentCount !== undefined ? updates.commentCount : (tasks[index].commentCount || 0),
      hasUnreadComments: updates.hasUnreadComments !== undefined ? updates.hasUnreadComments : (tasks[index].hasUnreadComments || false),
      lastCommentAt: updates.lastCommentAt !== undefined ? updates.lastCommentAt : tasks[index].lastCommentAt,
      updatedAt: new Date().toISOString()
    }
    
    // Handle status and completion synchronization
    if (updates.status !== undefined) {
      updatedTask.status = updates.status
      updatedTask.completed = updates.status === "Completed"
      updatedTask.completedAt = updates.status === "Completed" 
        ? new Date().toISOString() 
        : null
    }
    
    // Handle direct completion status changes
    if (updates.completed !== undefined && updates.status === undefined) {
      updatedTask.completed = updates.completed
      updatedTask.status = updates.completed ? "Completed" : "Not Started"
      updatedTask.completedAt = updates.completed 
        ? new Date().toISOString() 
        : null
    }
    
    tasks[index] = updatedTask
    
    // Update parent task progress if this is a subtask
    if (updatedTask.parentTaskId) {
      this.updateParentTaskProgress(updatedTask.parentTaskId)
    }
    
    this.saveToLocalStorage()
    return { ...updatedTask }
  },

  // Get subtasks for a parent task
  async getSubtasks(parentTaskId) {
    await delay()
    return tasks.filter(task => task.parentTaskId === parseInt(parentTaskId))
      .map(task => ({ ...task }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  // Create a subtask
  async createSubtask(parentTaskId, subtaskData) {
    const parentTask = tasks.find(t => t.Id === parseInt(parentTaskId))
    if (!parentTask) {
      throw new Error(`Parent task with Id ${parentTaskId} not found`)
    }
    
    const subtask = await this.create({
      ...subtaskData,
      parentTaskId: parseInt(parentTaskId),
      category: subtaskData.category || parentTask.category,
      priority: subtaskData.priority || parentTask.priority
    })
    
    // Update parent task progress
    this.updateParentTaskProgress(parseInt(parentTaskId))
    
    return subtask
  },

  // Update parent task progress based on subtasks
  updateParentTaskProgress(parentTaskId) {
    const subtasks = tasks.filter(task => task.parentTaskId === parentTaskId)
    if (subtasks.length === 0) return
    
    const completedSubtasks = subtasks.filter(task => task.completed).length
    const parentIndex = tasks.findIndex(t => t.Id === parentTaskId)
    
    if (parentIndex !== -1) {
      const progressPercentage = Math.round((completedSubtasks / subtasks.length) * 100)
      tasks[parentIndex] = {
        ...tasks[parentIndex],
        subtaskProgress: progressPercentage,
        subtaskCount: subtasks.length,
        completedSubtasks: completedSubtasks,
        updatedAt: new Date().toISOString()
      }
      
      // Auto-complete parent if all subtasks are done
      if (completedSubtasks === subtasks.length && subtasks.length > 0) {
        tasks[parentIndex].completed = true
        tasks[parentIndex].completedAt = new Date().toISOString()
      } else if (tasks[parentIndex].completed && completedSubtasks < subtasks.length) {
        // Uncheck parent if not all subtasks are complete
        tasks[parentIndex].completed = false
        tasks[parentIndex].completedAt = null
      }
    }
  },

  // Get task hierarchy (parent with its subtasks)
  async getTaskHierarchy(taskId) {
    await delay()
    const mainTask = tasks.find(t => t.Id === parseInt(taskId))
    if (!mainTask) {
      throw new Error(`Task with Id ${taskId} not found`)
    }
    
    const subtasks = await this.getSubtasks(taskId)
    return {
      ...mainTask,
      subtasks
    }
  },

  async delete(id) {
    await delay()
    const index = tasks.findIndex(t => t.Id === parseInt(id))
    if (index === -1) {
      throw new Error(`Task with Id ${id} not found`)
    }
    const deletedTask = tasks.splice(index, 1)[0]
    this.saveToLocalStorage()
    return { ...deletedTask }
  },

  // Local storage methods
saveToLocalStorage() {
    try {
      localStorage.setItem("taskflow-tasks", JSON.stringify(tasks))
    } catch (error) {
      console.error("Failed to save tasks to localStorage:", error)
    }
  },

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem("taskflow-tasks")
      if (stored) {
const loadedTasks = JSON.parse(stored)
// Ensure all tasks have required fields for new features
        const migratedTasks = loadedTasks.map(task => ({
          ...task,
          tags: task.tags || [],
          assignedTo: task.assignedTo || null,
          projectId: task.projectId || null,
          dueDateTime: task.dueDateTime || task.dueDate || null,
reminders: task.reminders || [],
          estimatedTime: task.estimatedTime || null,
          actualTime: task.actualTime || 0,
          timeSpent: task.timeSpent || 0,
          isRecurring: task.isRecurring || false,
          recurrence: task.recurrence || null,
          isTracking: task.isTracking || false,
          trackingStartedAt: task.trackingStartedAt || null,
notes: task.notes || "",
          attachments: Array.isArray(task.attachments) ? task.attachments.map(att => ({
            ...att,
            folderId: att.folderId || null,
            isArchived: att.isArchived || false,
            storageLocation: att.storageLocation || 'local'
          })) : [],
          linkedTasks: Array.isArray(task.linkedTasks) ? task.linkedTasks : [],
          externalLinks: Array.isArray(task.externalLinks) ? task.externalLinks : [],
          commentCount: task.commentCount || 0,
          hasUnreadComments: task.hasUnreadComments || false,
          lastCommentAt: task.lastCommentAt || null
        }))
        tasks.length = 0
        tasks.push(...migratedTasks)
        return true
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage:", error)
    }
    return false
  },

  // Initialize storage
initialize() {
    if (!this.loadFromLocalStorage()) {
      this.saveToLocalStorage();
    }
  },

  // Automation Features

// Create follow-up task automatically
  async createFollowupTask(parentTaskId, followupData = {}) {
    await delay();
    
    const parentTask = tasks.find(t => t.Id === parentTaskId);
    if (!parentTask) {
      throw new Error('Parent task not found');
    }

    const defaultFollowupData = {
      title: followupData.title || `Follow-up: ${parentTask.title}`,
      description: followupData.description || `Follow-up task for: ${parentTask.title}`,
      priority: followupData.priority || parentTask.priority,
      projectId: followupData.projectId || parentTask.projectId,
      assignedTo: followupData.assignedTo || parentTask.assignedTo,
      dueDate: followupData.dueDate || this.calculateFollowupDueDate(parentTask),
      tags: followupData.tags || parentTask.tags || [],
      parentTaskId: parentTaskId,
      isFollowup: true,
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const followupTask = await this.create(defaultFollowupData);
    
    // Update parent task with follow-up reference
    const updatedParent = await this.update(parentTaskId, {
      ...parentTask,
      hasFollowup: true,
      followupTaskId: followupTask.Id,
      updatedAt: new Date().toISOString()
    });

    return followupTask;
  },

  // Calculate follow-up due date based on rules
  calculateFollowupDueDate(parentTask) {
    const now = new Date();
    const parentDue = parentTask.dueDate ? new Date(parentTask.dueDate) : now;
    
    // Default follow-up rules
    const followupDelayDays = this.getFollowupDelayDays(parentTask.priority);
    const followupDate = new Date(Math.max(now.getTime(), parentDue.getTime()));
    followupDate.setDate(followupDate.getDate() + followupDelayDays);
    
    return followupDate.toISOString();
  },

  // Get follow-up delay based on priority
  getFollowupDelayDays(priority) {
    const delayMap = {
      'High': 1,      // 1 day for high priority
      'Medium': 3,    // 3 days for medium priority  
      'Low': 7        // 1 week for low priority
    };
    return delayMap[priority] || 3; // Default to 3 days
  },

  // Configure automation rules
  async configureAutomationRules(rules) {
    await delay();
    
    // Store automation rules (in real app, would be in database)
    if (!this.automationRules) {
      this.automationRules = {};
    }
    
    this.automationRules = {
      ...this.automationRules,
      ...rules,
      updatedAt: new Date().toISOString()
    };
    
    return this.automationRules;
  },

  // Get automation rules
  async getAutomationRules() {
    await delay();
    return this.automationRules || {
      autoCreateFollowup: true,
      followupDelayDays: {
        'High': 1,
        'Medium': 3,
        'Low': 7
      },
      inheritPriority: true,
      inheritAssignee: true,
      inheritTags: true,
      emailNotifications: true,
      notificationTypes: ['task_assigned', 'task_due', 'task_overdue']
    };
  },

  // Process task completion and trigger automation
  async processTaskCompletion(taskId, completedBy = null) {
    await delay();
    
    const task = tasks.find(t => t.Id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Mark task as completed
    const completedTask = await this.update(taskId, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
      completedBy: completedBy,
      updatedAt: new Date().toISOString()
    });

    // Get automation rules
    const rules = await this.getAutomationRules();
    
    // Auto-create follow-up if enabled
    if (rules.autoCreateFollowup && this.shouldCreateFollowup(task)) {
      try {
        const followupTask = await this.createFollowupTask(taskId);
        
        // Send notification about follow-up creation
        if (typeof window !== 'undefined' && window.notificationService) {
          await window.notificationService.createTaskNotification(
            'task_assigned',
            followupTask.Id,
            followupTask.title,
            `Follow-up task created for completed task: ${task.title}`,
            followupTask.assignedTo
          );
        }
      } catch (error) {
        console.error('Failed to create follow-up task:', error);
      }
    }

    // Trigger email notifications if enabled
    if (rules.emailNotifications && typeof window !== 'undefined' && window.notificationService) {
      try {
        await window.notificationService.sendEmailNotification({
          type: 'task_completed',
          taskId: task.Id,
          taskTitle: task.title,
          assignedTo: task.assignedTo,
          completedBy: completedBy,
          completedAt: completedTask.completedAt
        });
      } catch (error) {
        console.error('Failed to send completion email:', error);
      }
    }

    return completedTask;
  },

  // Determine if follow-up should be created
  shouldCreateFollowup(task) {
    // Don't create follow-up for follow-up tasks
    if (task.isFollowup) return false;
    
    // Don't create if task already has a follow-up
    if (task.hasFollowup) return false;
    
    // Create follow-up for high priority tasks or tasks with specific tags
    return task.priority === 'High' || 
           (task.tags && task.tags.includes('follow-up-required')) ||
           task.projectId; // Create follow-ups for project tasks
  },

  // Get follow-up task candidates (tasks that might need follow-ups)
  async getFollowupCandidates() {
    await delay();
    
    const completedTasks = tasks.filter(task => 
      task.status === 'Completed' && 
      !task.hasFollowup && 
      !task.isFollowup
    );

    return completedTasks.filter(task => this.shouldCreateFollowup(task));
  },

  // Batch process follow-up creation
  async batchCreateFollowups(taskIds) {
    await delay();
    
    const results = [];
    for (const taskId of taskIds) {
      try {
        const followupTask = await this.createFollowupTask(taskId);
        results.push({ success: true, taskId, followupTask });
      } catch (error) {
        results.push({ success: false, taskId, error: error.message });
      }
    }
    
    return results;
  }
}
// Update comment statistics for a task
export const updateTaskCommentStats = async (taskId, commentCount, hasUnread = false, lastCommentAt = null) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const index = tasks.findIndex(task => task.Id === parseInt(taskId));
  if (index === -1) {
    throw new Error('Task not found');
  }

  tasks[index] = {
    ...tasks[index],
    commentCount: commentCount || 0,
    hasUnreadComments: hasUnread,
    lastCommentAt: lastCommentAt || tasks[index].lastCommentAt,
    updatedAt: new Date().toISOString()
};

  taskService.saveToLocalStorage();
  return tasks[index];
};
// Template Management

// Template Management
taskService.getTemplates = async function() {
  await delay()
try {
    const stored = localStorage.getItem("taskflow-task-templates")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Failed to load task templates:", error)
    return []
  }
}

taskService.getTemplateById = async function(id) {
  await delay()
  const templates = await this.getTemplates()
  const template = templates.find(t => t.Id === parseInt(id))
  if (!template) {
    throw new Error(`Template with Id ${id} not found`)
  }
  return { ...template }
}

taskService.createTemplate = async function(templateData) {
  await delay()
  const templates = await this.getTemplates()
  const maxId = templates.length > 0 ? Math.max(...templates.map(t => t.Id)) : 0
  
  const newTemplate = {
    Id: maxId + 1,
    name: templateData.name,
    description: templateData.description || "",
    category: templateData.category || "General",
    icon: templateData.icon || "📝",
    isPublic: templateData.isPublic || false,
    tags: templateData.tags || [],
    defaults: {
      title: templateData.defaults?.title || "",
      description: templateData.defaults?.description || "",
      category: templateData.defaults?.category || "Personal",
      priority: templateData.defaults?.priority || "Medium",
      status: templateData.defaults?.status || "Not Started",
      projectId: templateData.defaults?.projectId || null,
      tags: templateData.defaults?.tags || [],
      estimatedTime: templateData.defaults?.estimatedTime || null,
      assignedTo: templateData.defaults?.assignedTo || null
    },
    subtasks: Array.isArray(templateData.subtasks) ? templateData.subtasks : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "current-user", // In real app, would be from auth
    usageCount: 0
  }
  
  templates.push(newTemplate)
  this.saveTemplatesToStorage(templates)
  return { ...newTemplate }
}

taskService.updateTemplate = async function(id, updates) {
  await delay()
  const templates = await this.getTemplates()
  const index = templates.findIndex(t => t.Id === parseInt(id))
  
  if (index === -1) {
    throw new Error(`Template with Id ${id} not found`)
  }
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  this.saveTemplatesToStorage(templates)
  return { ...templates[index] }
}

taskService.deleteTemplate = async function(id) {
  await delay()
  const templates = await this.getTemplates()
  const index = templates.findIndex(t => t.Id === parseInt(id))
  
  if (index === -1) {
    throw new Error(`Template with Id ${id} not found`)
  }
  
  const deleted = templates.splice(index, 1)[0]
  this.saveTemplatesToStorage(templates)
  return { ...deleted }
}

taskService.createFromTemplate = async function(templateId, overrides = {}) {
  await delay()
  const template = await this.getTemplateById(templateId)
  
  // Create main task from template
  const taskData = {
    ...template.defaults,
    ...overrides,
    title: overrides.title || template.defaults.title || template.name
  }
  
  const mainTask = await this.create(taskData)
  
  // Create subtasks if template has them
  if (template.subtasks && template.subtasks.length > 0) {
    for (const subtaskTemplate of template.subtasks) {
      await this.createSubtask(mainTask.Id, {
        ...subtaskTemplate,
        category: taskData.category,
        priority: taskData.priority,
        projectId: taskData.projectId
      })
    }
  }
  
  // Increment usage count
  await this.updateTemplate(templateId, {
    usageCount: template.usageCount + 1
  })
  
  return mainTask
}

taskService.getTemplateCategories = async function() {
  await delay()
  const templates = await this.getTemplates()
  const categories = [...new Set(templates.map(t => t.category))]
  return categories.length > 0 ? categories : ["General", "Work", "Personal", "Project"]
}

taskService.getPopularTemplates = async function(limit = 10) {
  await delay()
  const templates = await this.getTemplates()
  return templates
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, limit)
}

taskService.exportTemplates = async function() {
  await delay()
  const templates = await this.getTemplates()
  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    templates: templates.map(template => ({
      ...template,
      createdBy: undefined, // Remove user-specific data
      Id: undefined // Will be regenerated on import
    }))
  }
  return exportData
}

taskService.importTemplates = async function(importData) {
  await delay()
  if (!importData.templates || !Array.isArray(importData.templates)) {
    throw new Error("Invalid template data format")
  }
  
  const existingTemplates = await this.getTemplates()
  const maxId = existingTemplates.length > 0 ? Math.max(...existingTemplates.map(t => t.Id)) : 0
  
  const importedTemplates = []
  let currentId = maxId
  
  for (const templateData of importData.templates) {
    currentId++
    const newTemplate = {
      ...templateData,
      Id: currentId,
      createdBy: "imported",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    }
    existingTemplates.push(newTemplate)
    importedTemplates.push(newTemplate)
  }
  
  this.saveTemplatesToStorage(existingTemplates)
  return importedTemplates
}

taskService.saveTemplatesToStorage = function(templates) {
  try {
    localStorage.setItem("taskflow-task-templates", JSON.stringify(templates))
  } catch (error) {
    console.error("Failed to save templates to localStorage:", error)
  }
}

// Initialize on module load
taskService.initialize()