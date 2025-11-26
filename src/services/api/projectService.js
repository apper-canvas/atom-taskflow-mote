import projectsData from "@/services/mockData/projects.json";

let projects = [...projectsData].map(project => ({
  ...project,
  isFavorite: project.isFavorite || false,
  isArchived: project.isArchived || false
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
          project.updatedAt = new Date().toISOString()
          resolve(project)
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
  async getTemplates() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const templates = [
          {
            Id: 'template_1',
            name: 'Software Development',
            description: 'Complete software development workflow',
            icon: '💻',
            color: '#3b82f6',
            categories: ['Work'],
            defaultTasks: [
              { title: 'Requirements gathering', priority: 'High', category: 'Work' },
              { title: 'System design', priority: 'High', category: 'Work' },
              { title: 'Development', priority: 'Medium', category: 'Work' },
              { title: 'Testing', priority: 'Medium', category: 'Work' },
              { title: 'Deployment', priority: 'High', category: 'Work' }
            ]
          },
          {
            Id: 'template_2',
            name: 'Marketing Campaign',
            description: 'Marketing campaign planning and execution',
            icon: '📢',
            color: '#f59e0b',
            categories: ['Work'],
            defaultTasks: [
              { title: 'Market research', priority: 'High', category: 'Work' },
              { title: 'Content creation', priority: 'Medium', category: 'Work' },
              { title: 'Campaign launch', priority: 'High', category: 'Work' },
              { title: 'Performance analysis', priority: 'Medium', category: 'Work' }
            ]
          },
          {
            Id: 'template_3',
            name: 'Personal Goals',
            description: 'Personal development and goal tracking',
            icon: '🎯',
            color: '#10b981',
            categories: ['Personal'],
            defaultTasks: [
              { title: 'Set objectives', priority: 'High', category: 'Personal' },
              { title: 'Create action plan', priority: 'Medium', category: 'Personal' },
              { title: 'Track progress', priority: 'Medium', category: 'Personal' },
              { title: 'Review and adjust', priority: 'Low', category: 'Personal' }
            ]
          }
        ]
        resolve(templates)
      }, 100)
    })
  },

  // Create project from template
  async createFromTemplate(templateId, projectData) {
    const templates = await this.getTemplates()
    const template = templates.find(t => t.Id === templateId)
    
    if (!template) {
      throw new Error('Template not found')
    }

    const projectFromTemplate = {
      ...projectData,
      icon: projectData.icon || template.icon,
      color: projectData.color || template.color,
      defaultCategory: template.categories[0]
    }

    return this.create(projectFromTemplate)
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
          memberCount: project.members ? project.members.length : 0,
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
  }
}

export { projectService }