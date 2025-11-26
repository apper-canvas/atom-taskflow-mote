import tasksData from "@/services/mockData/tasks.json"

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
      title: taskData.title || "",
      description: taskData.description || "",
      category: taskData.category || "Personal",
      priority: taskData.priority || "Medium",
      dueDate: taskData.dueDate || null,
      parentTaskId: taskData.parentTaskId || null,
      tags: taskData.tags || [],
      completed: false,
      completedAt: null,
      isRecurring: taskData.isRecurring || false,
      recurrence: taskData.recurrence || null,
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
      updatedAt: new Date().toISOString()
    }
    
    // Handle completion status
    if (updates.completed !== undefined) {
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
        // Ensure all tasks have tags array
        const migratedTasks = loadedTasks.map(task => ({
          ...task,
          tags: task.tags || []
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
      this.saveToLocalStorage()
    }
  }
}

// Initialize on module load
taskService.initialize()