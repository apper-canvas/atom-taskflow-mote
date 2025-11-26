// Mock service for saved filters and view preferences
const delay = () => new Promise(resolve => setTimeout(resolve, 100))

class FilterService {
  constructor() {
    this.loadFromLocalStorage()
  }

  // Smart view configurations
  getSmartViews() {
    return {
      all: {
        id: 'all',
        name: 'All Tasks',
        icon: 'List',
        color: 'gray',
        filters: {}
      },
      myTasks: {
        id: 'myTasks',
        name: 'My Tasks',
        icon: 'User',
        color: 'blue',
        filters: {
          assignedTo: 'current-user' // Would be actual user ID in real app
        }
      },
      today: {
        id: 'today',
        name: 'Today',
        icon: 'Calendar',
        color: 'orange',
        filters: {
          dueDateRange: 'today'
        }
      },
      upcoming: {
        id: 'upcoming',
        name: 'Upcoming',
        icon: 'Clock',
        color: 'green',
        filters: {
          dueDateRange: 'next7days'
        }
      },
      overdue: {
        id: 'overdue',
        name: 'Overdue',
        icon: 'AlertCircle',
        color: 'red',
        filters: {
          dueDateRange: 'overdue'
        }
      },
      completed: {
        id: 'completed',
        name: 'Completed',
        icon: 'CheckCircle',
        color: 'green',
        filters: {
          status: 'completed'
        }
      }
    }
  }

  // Get all saved custom filters
  async getSavedFilters() {
    await delay()
    return [...this.savedFilters]
  }

  // Save a new custom filter
  async saveFilter(filterData) {
    await delay()
    const newFilter = {
      Id: Math.max(0, ...this.savedFilters.map(f => f.Id)) + 1,
      name: filterData.name,
      filters: filterData.filters,
      sortBy: filterData.sortBy || 'updatedAt',
      viewMode: filterData.viewMode || 'list',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    }
    
    this.savedFilters.unshift(newFilter)
    this.saveToLocalStorage()
    return { ...newFilter }
  }

  // Update existing saved filter
  async updateFilter(id, updates) {
    await delay()
    const index = this.savedFilters.findIndex(f => f.Id === parseInt(id))
    if (index === -1) {
      throw new Error(`Filter with Id ${id} not found`)
    }
    
    const updatedFilter = {
      ...this.savedFilters[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.savedFilters[index] = updatedFilter
    this.saveToLocalStorage()
    return { ...updatedFilter }
  }

  // Delete saved filter
  async deleteFilter(id) {
    await delay()
    const index = this.savedFilters.findIndex(f => f.Id === parseInt(id))
    if (index === -1) {
      throw new Error(`Filter with Id ${id} not found`)
    }
    
    this.savedFilters.splice(index, 1)
    this.saveToLocalStorage()
  }

  // Track filter usage
  async trackFilterUsage(filterId) {
    await delay()
    const filter = this.savedFilters.find(f => f.Id === parseInt(filterId))
    if (filter) {
      filter.usageCount = (filter.usageCount || 0) + 1
      filter.lastUsedAt = new Date().toISOString()
      this.saveToLocalStorage()
    }
  }

  // Get/set user view preferences
  async getViewPreferences() {
    await delay()
    return { ...this.viewPreferences }
  }

  async setViewPreferences(preferences) {
    await delay()
    this.viewPreferences = { ...this.viewPreferences, ...preferences }
    this.saveToLocalStorage()
    return { ...this.viewPreferences }
  }

  // Local storage methods
  saveToLocalStorage() {
    localStorage.setItem('taskflow_saved_filters', JSON.stringify(this.savedFilters))
    localStorage.setItem('taskflow_view_preferences', JSON.stringify(this.viewPreferences))
  }

  loadFromLocalStorage() {
    this.savedFilters = []
    this.viewPreferences = {
      defaultView: 'all',
      defaultSort: 'updatedAt',
      defaultViewMode: 'list',
      filterPanelCollapsed: false
    }

    try {
      const stored = localStorage.getItem('taskflow_saved_filters')
      if (stored) {
        this.savedFilters = JSON.parse(stored)
      }

      const prefs = localStorage.getItem('taskflow_view_preferences')
      if (prefs) {
        this.viewPreferences = { ...this.viewPreferences, ...JSON.parse(prefs) }
      }
    } catch (error) {
      console.error('Failed to load saved filters from localStorage:', error)
    }
  }
}

export const filterService = new FilterService()
export default filterService