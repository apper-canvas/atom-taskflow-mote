// Mock file service for file operations
let mockFiles = [];
let mockFolders = [
  { 
    Id: 1, 
    name: 'Documents', 
    parentFolderId: null, 
    projectId: null,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  { 
    Id: 2, 
    name: 'Images', 
    parentFolderId: null, 
    projectId: null,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  }
];
let mockExternalLinks = [];

const fileService = {
  // File operations
  async getAll() {
    return mockFiles.filter(file => !file.isArchived).map(file => ({ ...file }));
  },

  async getById(id) {
    const file = mockFiles.find(f => f.Id === id);
    if (!file) throw new Error('File not found');
    return { ...file };
  },

  async getByTaskId(taskId) {
    return mockFiles.filter(file => 
      file.taskId === taskId && !file.isArchived
    ).map(file => ({ ...file }));
  },

  async getByProjectId(projectId) {
    return mockFiles.filter(file => 
      file.projectId === projectId && !file.isArchived
    ).map(file => ({ ...file }));
  },

  async create(fileData) {
    const maxId = mockFiles.length > 0 ? Math.max(...mockFiles.map(f => f.Id)) : 0;
    const newFile = {
      Id: maxId + 1,
      name: fileData.name,
      originalName: fileData.originalName || fileData.name,
      size: fileData.size || 0,
      type: fileData.type || 'application/octet-stream',
      url: fileData.url || null,
      category: fileData.category || 'other',
      version: 1,
      folderId: fileData.folderId || null,
      taskId: fileData.taskId || null,
      projectId: fileData.projectId || null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: fileData.uploadedBy || 'current-user',
      lastModified: fileData.lastModified || Date.now(),
      comments: [],
      sharedWith: [],
      permissions: { read: true, write: true, delete: true },
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      accessLogs: [],
      storageLocation: fileData.storageLocation || 'local'
    };
    
    mockFiles.push(newFile);
    
    // Log access
    this.logAccess(newFile.Id, 'upload', 'current-user');
    
    return { ...newFile };
  },

  async update(id, updates) {
    const index = mockFiles.findIndex(f => f.Id === id);
    if (index === -1) throw new Error('File not found');
    
    const currentFile = mockFiles[index];
    
    // If name changed, increment version
    if (updates.name && updates.name !== currentFile.name) {
      updates.version = (currentFile.version || 1) + 1;
    }
    
    mockFiles[index] = {
      ...currentFile,
      ...updates,
      lastModified: Date.now()
    };
    
    // Log access
    this.logAccess(id, 'update', 'current-user');
    
    return { ...mockFiles[index] };
  },

  async delete(id) {
    const index = mockFiles.findIndex(f => f.Id === id);
    if (index === -1) throw new Error('File not found');
    
    const deletedFile = mockFiles.splice(index, 1)[0];
    
    // Log access
    this.logAccess(id, 'delete', 'current-user');
    
    return deletedFile;
  },

  async archive(id) {
    const index = mockFiles.findIndex(f => f.Id === id);
    if (index === -1) throw new Error('File not found');
    
    mockFiles[index] = {
      ...mockFiles[index],
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: 'current-user'
    };
    
    // Log access
    this.logAccess(id, 'archive', 'current-user');
    
    return { ...mockFiles[index] };
  },

  async restore(id) {
    const index = mockFiles.findIndex(f => f.Id === id);
    if (index === -1) throw new Error('File not found');
    
    mockFiles[index] = {
      ...mockFiles[index],
      isArchived: false,
      archivedAt: null,
      archivedBy: null
    };
    
    // Log access
    this.logAccess(id, 'restore', 'current-user');
    
    return { ...mockFiles[index] };
  },

  async getArchived() {
    return mockFiles.filter(file => file.isArchived).map(file => ({ ...file }));
  },

  async moveToFolder(fileId, folderId) {
    const index = mockFiles.findIndex(f => f.Id === fileId);
    if (index === -1) throw new Error('File not found');
    
    mockFiles[index] = {
      ...mockFiles[index],
      folderId: folderId
    };
    
    // Log access
    this.logAccess(fileId, 'move', 'current-user');
    
    return { ...mockFiles[index] };
  },

  // Folder operations
  async getFolders() {
    return mockFolders.map(folder => ({ ...folder }));
  },

  async getFolderById(id) {
    const folder = mockFolders.find(f => f.Id === id);
    if (!folder) throw new Error('Folder not found');
    return { ...folder };
  },

  async createFolder(folderData) {
    const maxId = mockFolders.length > 0 ? Math.max(...mockFolders.map(f => f.Id)) : 0;
    const newFolder = {
      Id: maxId + 1,
      name: folderData.name,
      parentFolderId: folderData.parentFolderId || null,
      projectId: folderData.projectId || null,
      taskId: folderData.taskId || null,
      createdAt: new Date().toISOString(),
      createdBy: folderData.createdBy || 'current-user'
    };
    
    mockFolders.push(newFolder);
    return { ...newFolder };
  },

  async updateFolder(id, updates) {
    const index = mockFolders.findIndex(f => f.Id === id);
    if (index === -1) throw new Error('Folder not found');
    
    mockFolders[index] = {
      ...mockFolders[index],
      ...updates
    };
    
    return { ...mockFolders[index] };
  },

  async deleteFolder(id) {
    const index = mockFolders.findIndex(f => f.Id === id);
    if (index === -1) throw new Error('Folder not found');
    
    // Check if folder has files
    const filesInFolder = mockFiles.filter(file => file.folderId === id);
    if (filesInFolder.length > 0) {
      throw new Error('Cannot delete folder with files. Move or delete files first.');
    }
    
    // Check for subfolders
    const subfolders = mockFolders.filter(folder => folder.parentFolderId === id);
    if (subfolders.length > 0) {
      throw new Error('Cannot delete folder with subfolders. Delete subfolders first.');
    }
    
    const deletedFolder = mockFolders.splice(index, 1)[0];
    return deletedFolder;
  },

  async getFilesByFolder(folderId) {
    return mockFiles.filter(file => 
      file.folderId === folderId && !file.isArchived
    ).map(file => ({ ...file }));
  },

  // External link operations
  async getExternalLinks() {
    return mockExternalLinks.map(link => ({ ...link }));
  },

  async getExternalLinksByTask(taskId) {
    return mockExternalLinks.filter(link => link.taskId === taskId).map(link => ({ ...link }));
  },

  async getExternalLinksByProject(projectId) {
    return mockExternalLinks.filter(link => link.projectId === projectId).map(link => ({ ...link }));
  },

  async createExternalLink(linkData) {
    const maxId = mockExternalLinks.length > 0 ? Math.max(...mockExternalLinks.map(l => l.Id)) : 0;
    const newLink = {
      Id: maxId + 1,
      title: linkData.title || 'External Link',
      url: linkData.url,
      description: linkData.description || '',
      taskId: linkData.taskId || null,
      projectId: linkData.projectId || null,
      folderId: linkData.folderId || null,
      createdAt: new Date().toISOString(),
      createdBy: linkData.createdBy || 'current-user',
      accessCount: 0,
      lastAccessedAt: null,
      isArchived: false,
      archivedAt: null,
      archivedBy: null
    };
    
    mockExternalLinks.push(newLink);
    return { ...newLink };
  },

  async updateExternalLink(id, updates) {
    const index = mockExternalLinks.findIndex(l => l.Id === id);
    if (index === -1) throw new Error('External link not found');
    
    mockExternalLinks[index] = {
      ...mockExternalLinks[index],
      ...updates
    };
    
    return { ...mockExternalLinks[index] };
  },

  async deleteExternalLink(id) {
    const index = mockExternalLinks.findIndex(l => l.Id === id);
    if (index === -1) throw new Error('External link not found');
    
    const deletedLink = mockExternalLinks.splice(index, 1)[0];
    return deletedLink;
  },

  async archiveExternalLink(id) {
    const index = mockExternalLinks.findIndex(l => l.Id === id);
    if (index === -1) throw new Error('External link not found');
    
    mockExternalLinks[index] = {
      ...mockExternalLinks[index],
      isArchived: true,
      archivedAt: new Date().toISOString(),
      archivedBy: 'current-user'
    };
    
    return { ...mockExternalLinks[index] };
  },

  async restoreExternalLink(id) {
    const index = mockExternalLinks.findIndex(l => l.Id === id);
    if (index === -1) throw new Error('External link not found');
    
    mockExternalLinks[index] = {
      ...mockExternalLinks[index],
      isArchived: false,
      archivedAt: null,
      archivedBy: null
    };
    
    return { ...mockExternalLinks[index] };
  },

  // Access logging
  async logAccess(fileId, action, userId) {
    const index = mockFiles.findIndex(f => f.Id === fileId);
    if (index === -1) return;
    
    if (!mockFiles[index].accessLogs) {
      mockFiles[index].accessLogs = [];
    }
    
    mockFiles[index].accessLogs.push({
      action,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent || 'Unknown'
    });
    
    // Keep only last 100 logs per file
    if (mockFiles[index].accessLogs.length > 100) {
      mockFiles[index].accessLogs = mockFiles[index].accessLogs.slice(-100);
    }
  },

  async getAccessLogs(fileId) {
    const file = mockFiles.find(f => f.Id === fileId);
    return file?.accessLogs || [];
  }
};

export default fileService;