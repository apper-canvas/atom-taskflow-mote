import tags from '../mockData/tags.json'

// Simulated delay for realistic API feel
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms))

const tagService = {
  // Get all tags
  async getAll() {
    await delay()
    return tags.map(tag => ({ ...tag }))
  },

  // Get tag by ID
  async getById(id) {
    await delay()
    const tag = tags.find(t => t.Id === parseInt(id))
    if (!tag) {
      throw new Error(`Tag with Id ${id} not found`)
    }
    return { ...tag }
  },

  // Create new tag
  async create(tagData) {
    await delay()
    
    // Validate required fields
    if (!tagData.name || !tagData.name.trim()) {
      throw new Error('Tag name is required')
    }

    // Check for duplicate names
    if (tags.some(t => t.name.toLowerCase() === tagData.name.trim().toLowerCase())) {
      throw new Error('Tag name already exists')
    }
    
    const maxId = tags.length > 0 ? Math.max(...tags.map(t => t.Id)) : 0
    const newTag = {
      Id: maxId + 1,
      name: tagData.name.trim(),
      color: tagData.color || '#3b82f6',
      icon: tagData.icon || 'Tag',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    tags.push(newTag)
    this.saveToLocalStorage()
    return { ...newTag }
  },

  // Update tag
  async update(id, updates) {
    await delay()
    const index = tags.findIndex(t => t.Id === parseInt(id))
    if (index === -1) {
      throw new Error(`Tag with Id ${id} not found`)
    }

    // Check for duplicate names (excluding current tag)
    if (updates.name && updates.name.trim()) {
      const existingTag = tags.find(t => 
        t.Id !== parseInt(id) && 
        t.name.toLowerCase() === updates.name.trim().toLowerCase()
      )
      if (existingTag) {
        throw new Error('Tag name already exists')
      }
    }
    
    const updatedTag = {
      ...tags[index],
      ...updates,
      name: updates.name ? updates.name.trim() : tags[index].name,
      updatedAt: new Date().toISOString()
    }
    
    tags[index] = updatedTag
    this.saveToLocalStorage()
    return { ...updatedTag }
  },

  // Delete tag
  async delete(id) {
    await delay()
    const index = tags.findIndex(t => t.Id === parseInt(id))
    if (index === -1) {
      throw new Error(`Tag with Id ${id} not found`)
    }
    
    const deletedTag = tags.splice(index, 1)[0]
    this.saveToLocalStorage()
    return { ...deletedTag }
  },

  // Search tags
  async search(query) {
    await delay()
    if (!query || !query.trim()) {
      return this.getAll()
    }
    
    const searchTerm = query.toLowerCase().trim()
    return tags
      .filter(tag => tag.name.toLowerCase().includes(searchTerm))
      .map(tag => ({ ...tag }))
  },

  // Get popular tags (most used)
  async getPopular(limit = 10) {
    await delay()
    // For now, return all tags sorted by name
    // In real implementation, this would sort by usage count
    return tags
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map(tag => ({ ...tag }))
  },

  // Local storage management
  saveToLocalStorage() {
    try {
      localStorage.setItem("taskflow-tags", JSON.stringify(tags))
    } catch (error) {
      console.error("Failed to save tags to localStorage:", error)
    }
  },

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem("taskflow-tags")
      if (stored) {
        const loadedTags = JSON.parse(stored)
        tags.length = 0
        tags.push(...loadedTags)
        return true
      }
    } catch (error) {
      console.error("Failed to load tags from localStorage:", error)
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

// Initialize on import
tagService.initialize()

export default tagService