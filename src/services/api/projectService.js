import projectsData from "@/services/mockData/projects.json";
let projects = [...projectsData].map(project => ({
...project,
  isFavorite: project.isFavorite || false,
  isArchived: project.isArchived || false,
  fileSettings: {
    allowedFileTypes: ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerTask: 10,
    enableVersioning: true,
    autoArchiveOldVersions: false
  }
}))

const projectService = {
  // Get all projects
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...projects])
      }, 100)
    })
  },

  // Get project by ID
  async getById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(id))
        if (project) {
          resolve({ ...project })
        } else {
          reject(new Error('Project not found'))
        }
      }, 100)
    })
  },

  // Create new project
  async create(projectData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const maxId = Math.max(...projects.map(p => p.Id), 0)
        const newProject = {
          Id: maxId + 1,
...projectData,
          status: projectData.status || 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          members: projectData.members || [],
isFavorite: false,
          isArchived: false,
          fileSettings: {
            allowedFileTypes: ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx'],
            maxFileSize: 10 * 1024 * 1024,
            maxFilesPerTask: 10,
            enableVersioning: true,
            autoArchiveOldVersions: false
          },
          settings: {
            isPublic: projectData.settings?.isPublic || false,
            allowMemberInvites: projectData.settings?.allowMemberInvites || true,
            requireApproval: projectData.settings?.requireApproval || false,
            ...projectData.settings
          }
        }
        projects.unshift(newProject)
        resolve({ ...newProject })
      }, 200)
    })
  },

  // Update project
  async update(id, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = projects.findIndex(p => p.Id === parseInt(id))
        if (index !== -1) {
          const updatedProject = {
            ...projects[index],
            ...data,
            updatedAt: new Date().toISOString()
          }
          projects[index] = updatedProject
          resolve({ ...updatedProject })
        } else {
          reject(new Error('Project not found'))
        }
      }, 200)
    })
  },

// Toggle project favorite status
  async toggleFavorite(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(id))
        if (project) {
          project.isFavorite = !project.isFavorite
          project.updatedAt = new Date().toISOString()
          resolve(project)
        } else {
          reject(new Error('Project not found'))
        }
      }, 200)
    })
  },

  // Archive project
  async archive(id) {
return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(id))
        if (project) {
          project.status = 'Archived'
          project.isArchived = true
          project.archivedAt = new Date().toISOString()
          project.archivedBy = 'current-user'
          project.updatedAt = new Date().toISOString()
          resolve(project)
        } else {
          reject(new Error('Project not found'))
        }
      }, 200)
    })
  },

  // Restore archived project
  async restore(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(id))
        if (project) {
          project.status = 'Active'
          project.isArchived = false
          project.archivedAt = null
          project.archivedBy = null
          project.updatedAt = new Date().toISOString()
          resolve({ ...project })
        } else {
          reject(new Error('Project not found'))
        }
}, 200)
    })
  },

  // Delete project permanently
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = projects.findIndex(p => p.Id === parseInt(id))
        if (index !== -1) {
          projects.splice(index, 1)
          resolve()
        } else {
          reject(new Error('Project not found'))
}
      }, 200)
    })
  },

  // Get project templates
// Get built-in project templates
  async getTemplates() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userTemplates = this.getUserTemplates()
        
        // Built-in project templates
        const builtInTemplates = [
          {
            Id: -1,
            name: 'Software Development Project',
            description: 'Complete software development lifecycle with agile methodology',
            icon: '💻',
            color: '#3b82f6',
            category: 'Technology',
            isBuiltIn: true,
            isPublic: true,
            tags: [
              { Id: 1, name: 'development', color: '#3b82f6' },
              { Id: 2, name: 'agile', color: '#10b981' }
            ],
            defaults: {
              color: '#3b82f6',
              status: 'Active',
              settings: {
                isPublic: false,
                allowMemberInvites: true,
                requireApproval: false
              }
            },
            tasks: [
              { 
                title: 'Project Setup & Requirements Gathering', 
                priority: 'High', 
                category: 'Work',
                description: 'Set up development environment and gather detailed requirements',
                estimatedTime: 480
              },
              { 
                title: 'System Architecture & Design', 
                priority: 'High', 
                category: 'Work',
                description: 'Create system architecture diagrams and database design',
                estimatedTime: 360
              },
              { 
                title: 'Development Environment Setup', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Configure development tools, CI/CD pipeline, and version control',
                estimatedTime: 240
              },
              { 
                title: 'Core Feature Development', 
                priority: 'High', 
                category: 'Work',
                description: 'Implement core application features and functionality',
                estimatedTime: 1200
              },
              { 
                title: 'Testing & Quality Assurance', 
                priority: 'High', 
                category: 'Work',
                description: 'Comprehensive testing including unit, integration, and end-to-end tests',
                estimatedTime: 480
              },
              { 
                title: 'Documentation & Deployment', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Create user documentation and deploy to production environment',
                estimatedTime: 320
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 142
          },
          {
            Id: -2,
            name: 'Marketing Campaign Launch',
            description: 'End-to-end marketing campaign from strategy to analysis',
            icon: '📢',
            color: '#f59e0b',
            category: 'Marketing',
            isBuiltIn: true,
            isPublic: true,
            tags: [
              { Id: 3, name: 'marketing', color: '#f59e0b' },
              { Id: 4, name: 'campaign', color: '#ef4444' }
            ],
            defaults: {
              color: '#f59e0b',
              status: 'Active',
              settings: {
                isPublic: false,
                allowMemberInvites: true,
                requireApproval: true
              }
            },
            tasks: [
              { 
                title: 'Market Research & Target Audience Analysis', 
                priority: 'High', 
                category: 'Work',
                description: 'Research market trends and define target customer segments',
                estimatedTime: 240
              },
              { 
                title: 'Campaign Strategy & Messaging Development', 
                priority: 'High', 
                category: 'Work',
                description: 'Develop campaign strategy, key messages, and value propositions',
                estimatedTime: 320
              },
              { 
                title: 'Creative Content Creation', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Create visuals, copy, videos, and other marketing materials',
                estimatedTime: 480
              },
              { 
                title: 'Channel Selection & Media Planning', 
                priority: 'High', 
                category: 'Work',
                description: 'Choose marketing channels and plan media buy and scheduling',
                estimatedTime: 180
              },
              { 
                title: 'Campaign Launch & Monitoring', 
                priority: 'High', 
                category: 'Work',
                description: 'Execute campaign launch and monitor initial performance',
                estimatedTime: 120
              },
              { 
                title: 'Performance Analysis & Optimization', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Analyze campaign results and optimize for better performance',
                estimatedTime: 200
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 87
          },
          {
            Id: -3,
            name: 'Event Planning & Management',
            description: 'Comprehensive event planning from conception to execution',
            icon: '🎉',
            color: '#8b5cf6',
            category: 'Events',
            isBuiltIn: true,
            isPublic: true,
            tags: [
              { Id: 5, name: 'event', color: '#8b5cf6' },
              { Id: 6, name: 'planning', color: '#10b981' }
            ],
            defaults: {
              color: '#8b5cf6',
              status: 'Active',
              settings: {
                isPublic: true,
                allowMemberInvites: true,
                requireApproval: false
              }
            },
            tasks: [
              { 
                title: 'Event Concept & Budget Planning', 
                priority: 'High', 
                category: 'Work',
                description: 'Define event concept, objectives, and establish budget parameters',
                estimatedTime: 180
              },
              { 
                title: 'Venue Selection & Booking', 
                priority: 'High', 
                category: 'Work',
                description: 'Research, visit, and secure appropriate venue for the event',
                estimatedTime: 240
              },
              { 
                title: 'Vendor Coordination & Catering', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Coordinate with caterers, AV teams, decorators, and other vendors',
                estimatedTime: 320
              },
              { 
                title: 'Marketing & Guest Registration', 
                priority: 'High', 
                category: 'Work',
                description: 'Promote event and manage attendee registration process',
                estimatedTime: 200
              },
              { 
                title: 'Event Day Coordination', 
                priority: 'High', 
                category: 'Work',
                description: 'Manage all aspects of event execution and troubleshoot issues',
                estimatedTime: 600
              },
              { 
                title: 'Post-Event Follow-up & Analysis', 
                priority: 'Low', 
                category: 'Work',
                description: 'Gather feedback, send thank you messages, and analyze event success',
                estimatedTime: 120
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 64
          },
          {
            Id: -4,
            name: 'Personal Goal Achievement',
            description: 'Structured approach to setting and achieving personal goals',
            icon: '🎯',
            color: '#10b981',
            category: 'Personal',
            isBuiltIn: true,
            isPublic: true,
            tags: [
              { Id: 7, name: 'personal', color: '#10b981' },
              { Id: 8, name: 'goals', color: '#8b5cf6' }
            ],
            defaults: {
              color: '#10b981',
              status: 'Active',
              settings: {
                isPublic: false,
                allowMemberInvites: false,
                requireApproval: false
              }
            },
            tasks: [
              { 
                title: 'Goal Definition & Vision Setting', 
                priority: 'High', 
                category: 'Personal',
                description: 'Clearly define specific, measurable, achievable goals',
                estimatedTime: 120
              },
              { 
                title: 'Action Plan & Milestone Creation', 
                priority: 'High', 
                category: 'Personal',
                description: 'Break down goals into actionable steps and key milestones',
                estimatedTime: 180
              },
              { 
                title: 'Resource Assessment & Skill Development', 
                priority: 'Medium', 
                category: 'Personal',
                description: 'Identify needed resources and skills to achieve goals',
                estimatedTime: 240
              },
              { 
                title: 'Progress Tracking & Regular Review', 
                priority: 'Medium', 
                category: 'Personal',
                description: 'Establish tracking system and schedule regular progress reviews',
                estimatedTime: 60
              },
              { 
                title: 'Obstacle Management & Adaptation', 
                priority: 'Medium', 
                category: 'Personal',
                description: 'Identify potential obstacles and create contingency plans',
                estimatedTime: 120
              },
              { 
                title: 'Celebration & Next Goal Planning', 
                priority: 'Low', 
                category: 'Personal',
                description: 'Celebrate achievements and plan next set of goals',
                estimatedTime: 90
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 93
          },
          {
            Id: -5,
            name: 'Product Launch Strategy',
            description: 'Complete product launch from development to market introduction',
            icon: '🚀',
            color: '#ef4444',
            category: 'Business',
            isBuiltIn: true,
            isPublic: true,
            tags: [
              { Id: 9, name: 'product', color: '#ef4444' },
              { Id: 10, name: 'launch', color: '#f59e0b' }
            ],
            defaults: {
              color: '#ef4444',
              status: 'Active',
              settings: {
                isPublic: false,
                allowMemberInvites: true,
                requireApproval: true
              }
            },
            tasks: [
              { 
                title: 'Product Development & Testing', 
                priority: 'High', 
                category: 'Work',
                description: 'Complete product development and conduct thorough testing',
                estimatedTime: 800
              },
              { 
                title: 'Market Research & Competitive Analysis', 
                priority: 'High', 
                category: 'Work',
                description: 'Analyze target market and competitive landscape',
                estimatedTime: 200
              },
              { 
                title: 'Pricing Strategy & Business Model', 
                priority: 'High', 
                category: 'Work',
                description: 'Develop pricing strategy and finalize business model',
                estimatedTime: 160
              },
              { 
                title: 'Launch Marketing & PR Campaign', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Create and execute comprehensive launch marketing campaign',
                estimatedTime: 400
              },
              { 
                title: 'Sales Team Training & Channel Setup', 
                priority: 'Medium', 
                category: 'Work',
                description: 'Train sales team and establish distribution channels',
                estimatedTime: 240
              },
              { 
                title: 'Launch Execution & Customer Support', 
                priority: 'High', 
                category: 'Work',
                description: 'Execute product launch and provide initial customer support',
                estimatedTime: 320
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 71
          },
          {
            Id: -6,
            name: 'Home Renovation Project',
            description: 'Complete home renovation from planning to completion',
            icon: '🏠',
            color: '#6b7280',
            category: 'Personal',
            isBuiltIn: true,
            isPublic: true,
            tags: [
              { Id: 11, name: 'home', color: '#6b7280' },
              { Id: 12, name: 'renovation', color: '#f59e0b' }
            ],
            defaults: {
              color: '#6b7280',
              status: 'Active',
              settings: {
                isPublic: false,
                allowMemberInvites: true,
                requireApproval: false
              }
            },
            tasks: [
              { 
                title: 'Planning & Design Phase', 
                priority: 'High', 
                category: 'Personal',
                description: 'Create renovation plans, get permits, and finalize design',
                estimatedTime: 320
              },
              { 
                title: 'Budget Planning & Contractor Selection', 
                priority: 'High', 
                category: 'Personal',
                description: 'Establish budget and select qualified contractors',
                estimatedTime: 240
              },
              { 
                title: 'Material Selection & Procurement', 
                priority: 'Medium', 
                category: 'Personal',
                description: 'Choose materials, fixtures, and coordinate deliveries',
                estimatedTime: 180
              },
              { 
                title: 'Demolition & Structural Work', 
                priority: 'High', 
                category: 'Personal',
                description: 'Complete demolition and any structural modifications',
                estimatedTime: 480
              },
              { 
                title: 'Installation & Finishing Work', 
                priority: 'High', 
                category: 'Personal',
                description: 'Install new elements and complete finishing touches',
                estimatedTime: 720
              },
              { 
                title: 'Final Inspection & Touch-ups', 
                priority: 'Medium', 
                category: 'Personal',
                description: 'Conduct final inspection and complete any necessary touch-ups',
                estimatedTime: 120
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            usageCount: 38
          }
        ]
        
        // Combine built-in templates with user templates
        resolve([...builtInTemplates, ...userTemplates])
      }, 100)
    })
  },

  // Get user-created templates only
  getUserTemplates() {
    try {
      const stored = localStorage.getItem("taskflow-project-templates")
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load user project templates:", error)
      return []
    }
  },

// Create project from template (legacy method for compatibility)
  async createFromTemplate(templateId, projectData) {
    if (!this.getTemplates || typeof this.getTemplates !== 'function') {
      throw new Error('getTemplates method is not available')
    }
    
    const templates = await this.getTemplates()
    const template = templates.find(t => t.Id === templateId)
    
    if (!template) {
      throw new Error('Template not found')
    }

    const projectFromTemplate = {
      ...projectData,
      icon: projectData.icon || template.icon,
      color: projectData.color || template.color,
      defaultCategory: template.category || 'Work'
    }

    const project = await this.create(projectFromTemplate)

    // Create tasks if template has them
    if (template.tasks && template.tasks.length > 0) {
      const { taskService } = await import('./taskService')
      
      for (const taskTemplate of template.tasks) {
        await taskService.create({
          ...taskTemplate,
          projectId: project.Id
        })
      }
    }

    // Increment usage count for user templates only
    if (!template.isBuiltIn) {
      await this.updateTemplate(templateId, {
        usageCount: template.usageCount + 1
      })
    }

    return project
  },

  // Add member to project
  async addMember(projectId, memberData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(projectId))
        if (!project) {
          reject(new Error('Project not found'))
          return
        }

        const newMember = {
          Id: Date.now(),
          ...memberData,
          joinedAt: new Date().toISOString(),
          role: memberData.role || 'Member'
        }

        if (!project.members) {
          project.members = []
        }
        project.members.push(newMember)
        project.updatedAt = new Date().toISOString()
        
        resolve({ ...newMember })
      }, 200)
    })
  },

  // Remove member from project
  async removeMember(projectId, memberId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(projectId))
        if (!project) {
          reject(new Error('Project not found'))
          return
        }

        if (!project.members) {
          reject(new Error('No members found'))
          return
        }

        const memberIndex = project.members.findIndex(m => m.Id === parseInt(memberId))
        if (memberIndex === -1) {
          reject(new Error('Member not found'))
          return
        }

        project.members.splice(memberIndex, 1)
        project.updatedAt = new Date().toISOString()
        
        resolve()
      }, 200)
    })
  },

  // Update member role
  async updateMemberRole(projectId, memberId, role) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const project = projects.find(p => p.Id === parseInt(projectId))
        if (!project) {
          reject(new Error('Project not found'))
          return
        }

        if (!project.members) {
          reject(new Error('No members found'))
          return
        }

        const member = project.members.find(m => m.Id === parseInt(memberId))
        if (!member) {
          reject(new Error('Member not found'))
          return
        }

        member.role = role
        project.updatedAt = new Date().toISOString()
        
        resolve({ ...member })
      }, 200)
    })
  },

  // Get project statistics
  async getProjectStats(projectId) {
    return new Promise(async (resolve, reject) => {
      try {
        const project = projects.find(p => p.Id === parseInt(projectId))
        if (!project) {
          reject(new Error('Project not found'))
          return
        }

        // Import task service to get project tasks
        const { taskService } = await import('./taskService')
        const allTasks = await taskService.getAll()
        const projectTasks = allTasks.filter(task => task.projectId === parseInt(projectId))

        const stats = {
          totalTasks: projectTasks.length,
          completedTasks: projectTasks.filter(task => task.completed).length,
          activeTasks: projectTasks.filter(task => !task.completed).length,
          overdueTasks: projectTasks.filter(task => {
            if (!task.dueDate && !task.dueDateTime) return false
            const dueDate = new Date(task.dueDate || task.dueDateTime)
            return !task.completed && dueDate < new Date()
          }).length,
          completionPercentage: projectTasks.length > 0 
            ? Math.round((projectTasks.filter(task => task.completed).length / projectTasks.length) * 100)
            : 0,
          priorityBreakdown: {
            High: projectTasks.filter(task => task.priority === 'High' && !task.completed).length,
            Medium: projectTasks.filter(task => task.priority === 'Medium' && !task.completed).length,
            Low: projectTasks.filter(task => task.priority === 'Low' && !task.completed).length
          }
        }

        setTimeout(() => resolve(stats), 100)
      } catch (error) {
        reject(error)
      }
    })
  },

  // Project Template Management
  async getTemplateById(id) {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    const templates = await this.getTemplates()
    const template = templates.find(t => t.Id === parseInt(id))
    if (!template) {
      throw new Error(`Project template with Id ${id} not found`)
    }
    return { ...template }
  },

  async createTemplate(templateData) {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    const userTemplates = this.getUserTemplates()
    const maxId = userTemplates.length > 0 ? Math.max(...userTemplates.map(t => t.Id)) : 0
    
    const newTemplate = {
      Id: maxId + 1,
      name: templateData.name,
      description: templateData.description || "",
      category: templateData.category || "Business",
      icon: templateData.icon || "📁",
      isPublic: templateData.isPublic || false,
      isBuiltIn: false,
      defaults: {
        color: templateData.defaults?.color || "#3b82f6",
        status: templateData.defaults?.status || "Active",
        settings: templateData.defaults?.settings || {}
      },
      tasks: Array.isArray(templateData.tasks) ? templateData.tasks : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user",
      usageCount: 0
    }
    
    userTemplates.push(newTemplate)
    this.saveProjectTemplatesToStorage(userTemplates)
    return { ...newTemplate }
  },

  async updateTemplate(id, updates) {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    const userTemplates = this.getUserTemplates()
    const index = userTemplates.findIndex(t => t.Id === parseInt(id))
    
    if (index === -1) {
      throw new Error(`Project template with Id ${id} not found or cannot be modified`)
    }
    
    userTemplates[index] = {
      ...userTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.saveProjectTemplatesToStorage(userTemplates)
    return { ...userTemplates[index] }
  },

  async deleteTemplate(id) {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    const userTemplates = this.getUserTemplates()
    const index = userTemplates.findIndex(t => t.Id === parseInt(id))
    
    if (index === -1) {
      throw new Error(`Project template with Id ${id} not found or cannot be deleted`)
    }
    
    const deleted = userTemplates.splice(index, 1)[0]
    this.saveProjectTemplatesToStorage(userTemplates)
    return { ...deleted }
  },

  async getTemplateCategories() {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    const templates = await this.getTemplates()
    const categories = [...new Set(templates.map(t => t.category))]
    return categories.length > 0 ? categories : ["Business", "Personal", "Technology", "Marketing", "Events", "Education"]
  },

  async exportTemplates() {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    const userTemplates = this.getUserTemplates()
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      type: "project-templates",
      templates: userTemplates.map(template => ({
        ...template,
        createdBy: undefined,
        Id: undefined
      }))
    }
    return exportData
  },

  async importTemplates(importData) {
    const delay = () => new Promise(resolve => setTimeout(resolve, 100));
    await delay()
    if (!importData.templates || !Array.isArray(importData.templates)) {
      throw new Error("Invalid project template data format")
    }
    
    const existingUserTemplates = this.getUserTemplates()
    const maxId = existingUserTemplates.length > 0 ? Math.max(...existingUserTemplates.map(t => t.Id)) : 0
    
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
        usageCount: 0,
        isBuiltIn: false
      }
      existingUserTemplates.push(newTemplate)
      importedTemplates.push(newTemplate)
    }
    
    this.saveProjectTemplatesToStorage(existingUserTemplates)
    return importedTemplates
  },

  saveProjectTemplatesToStorage(templates) {
    try {
      localStorage.setItem("taskflow-project-templates", JSON.stringify(templates))
    } catch (error) {
      console.error("Failed to save project templates to localStorage:", error)
    }
  }
}
export { projectService }