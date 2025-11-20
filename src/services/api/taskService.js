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
      completed: false,
      completedAt: null,
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
      updatedAt: new Date().toISOString()
    }
    
    // Handle completion status
    if (updates.completed !== undefined) {
      updatedTask.completedAt = updates.completed 
        ? new Date().toISOString() 
        : null
    }
    
    tasks[index] = updatedTask
    this.saveToLocalStorage()
    return { ...updatedTask }
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
        tasks = JSON.parse(stored)
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