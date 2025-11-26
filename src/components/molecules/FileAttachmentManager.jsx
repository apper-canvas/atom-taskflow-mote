import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import fileService from "@/services/api/fileService";
import ApperIcon from "@/components/ApperIcon";
import Modal from "@/components/atoms/Modal";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import toast from "@/utils/toast";
import { cn } from "@/utils/cn";

const FileAttachmentManager = ({ 
  attachments = [], 
  externalLinks = [],
  onChange, 
  onExternalLinksChange,
  taskId = null,
  projectId = null,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  className 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [renameModal, setRenameModal] = useState({ isOpen: false, file: null, newName: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedFiles, setArchivedFiles] = useState([]);
  const [createFolderModal, setCreateFolderModal] = useState({ isOpen: false, name: '' });
  const [externalLinkModal, setExternalLinkModal] = useState({ 
    isOpen: false, 
    title: '', 
    url: '', 
    description: '' 
  });
  const [confirmArchive, setConfirmArchive] = useState({ isOpen: false, file: null });
  const [viewMode, setViewMode] = useState('files'); // 'files', 'links', 'archived'
  const fileInputRef = useRef(null);

  const supportedTypes = {
    'image/jpeg': { icon: 'Image', category: 'image' },
    'image/jpg': { icon: 'Image', category: 'image' },
    'image/png': { icon: 'Image', category: 'image' },
    'image/gif': { icon: 'Image', category: 'image' },
    'image/svg+xml': { icon: 'Image', category: 'image' },
    'image/webp': { icon: 'Image', category: 'image' },
    'application/pdf': { icon: 'FileText', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: 'FileText', category: 'document' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: 'FileSpreadsheet', category: 'document' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: 'FileText', category: 'document' },
    'text/plain': { icon: 'FileText', category: 'document' },
    'video/mp4': { icon: 'Video', category: 'video' },
    'video/webm': { icon: 'Video', category: 'video' },
    'audio/mp3': { icon: 'Music', category: 'audio' },
    'audio/mpeg': { icon: 'Music', category: 'audio' },
    'audio/wav': { icon: 'Music', category: 'audio' },
    'application/zip': { icon: 'Archive', category: 'archive' },
    'application/x-rar-compressed': { icon: 'Archive', category: 'archive' }
};

  // Load folders and archived files
  useEffect(() => {
    loadFolders();
    loadArchivedFiles();
  }, []);

  const loadFolders = async () => {
    try {
      const allFolders = await fileService.getFolders();
      setFolders(allFolders.filter(f => f.projectId === projectId || f.taskId === taskId));
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadArchivedFiles = async () => {
    try {
      const archived = await fileService.getArchived();
      const relevantArchived = archived.filter(file => 
        (projectId && file.projectId === projectId) || 
        (taskId && file.taskId === taskId)
      );
      setArchivedFiles(relevantArchived);
} catch (error) {
      console.error('Failed to load archived files:', error);
    }
  };

  const validateFile = (file) => {
    if (!supportedTypes[file.type]) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }
    if (attachments.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    return null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const processFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];
    // Create folder if needed
    const createFolder = async (folderName) => {
      try {
        const newFolder = await fileService.createFolder({
          name: folderName,
          projectId,
          taskId,
          parentFolderId: currentFolder?.Id || null
        });
        setFolders(prev => [...prev, newFolder]);
        toast.success('Folder created successfully');
        return newFolder;
      } catch (error) {
        toast.error('Failed to create folder');
        return null;
      }
    };

    const handleCreateFolder = async () => {
      if (!createFolderModal.name.trim()) {
        toast.error('Folder name cannot be empty');
        return;
      }
      
      await createFolder(createFolderModal.name.trim());
      setCreateFolderModal({ isOpen: false, name: '' });
    };

    const handleAddExternalLink = async () => {
      if (!externalLinkModal.url.trim()) {
        toast.error('URL cannot be empty');
        return;
      }

      if (!isValidUrl(externalLinkModal.url)) {
        toast.error('Please enter a valid URL');
        return;
      }

      try {
        const newLink = await fileService.createExternalLink({
          title: externalLinkModal.title.trim() || 'External Link',
          url: externalLinkModal.url.trim(),
          description: externalLinkModal.description.trim(),
          taskId,
          projectId,
          folderId: currentFolder?.Id || null
        });

        onExternalLinksChange && onExternalLinksChange([...externalLinks, newLink]);
        toast.success('External link added successfully');
        setExternalLinkModal({ isOpen: false, title: '', url: '', description: '' });
      } catch (error) {
        toast.error('Failed to add external link');
      }
    };

    const isValidUrl = (string) => {
      try {
        new URL(string);
        return true;
} catch (_) {
        return false;
      }
    };

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      toast.error(`File validation errors:\n${errors.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    // Simulate file processing with progress
    for (const file of validFiles) {
      const fileId = `${file.name}_${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 100) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: currentProgress + 10 };
        });
      }, 100);

// Create file data object
const fileData = {
        Id: Date.now() + Math.random(),
        name: file.name,
        originalName: file.originalName || file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file), // For preview purposes
        category: supportedTypes[file.type]?.category || 'other',
        version: 1,
        folderId: currentFolder?.Id || null,
        taskId,
        projectId,
        comments: [],
        sharedWith: [],
        permissions: { read: true, write: true, delete: true },
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'current-user',
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        accessLogs: [],
        storageLocation: 'local'
      };

      // Add to attachments after simulated processing
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
        
        onChange([...attachments, fileData]);
        toast.success(`${file.name} uploaded successfully`);
      }, 1200);
    }
}, [attachments, onChange, maxFileSize, maxFiles, currentFolder, taskId, projectId]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

const removeFile = (fileToRemove) => {
    const updatedFiles = attachments.filter(file => file.Id !== fileToRemove.Id);
    onChange(updatedFiles);
    toast.success('File removed successfully');
};

  const renameFile = async (fileToRename, newName) => {
    if (!newName.trim()) {
      toast.error('File name cannot be empty');
      return;
    }
    
    try {
      await fileService.update(fileToRename.Id, { name: newName.trim() });
      const updatedFiles = attachments.map(file => 
        file.Id === fileToRename.Id 
          ? { ...file, name: newName.trim() }
          : file
      );
      onChange(updatedFiles);
      setRenameModal({ isOpen: false, file: null, newName: '' });
      toast.success('File renamed successfully');
    } catch (error) {
      toast.error('Failed to rename file');
    }
  };

  const archiveFile = async (file) => {
    try {
      await fileService.archive(file.Id);
      const updatedFiles = attachments.filter(f => f.Id !== file.Id);
      onChange(updatedFiles);
      await loadArchivedFiles(); // Refresh archived files
      setConfirmArchive({ isOpen: false, file: null });
      toast.success('File archived successfully');
    } catch (error) {
      toast.error('Failed to archive file');
    }
  };

  const restoreFile = async (file) => {
    try {
      await fileService.restore(file.Id);
      const updatedArchivedFiles = archivedFiles.filter(f => f.Id !== file.Id);
      setArchivedFiles(updatedArchivedFiles);
      // Add back to attachments
      onChange([...attachments, { ...file, isArchived: false }]);
      toast.success('File restored successfully');
    } catch (error) {
      toast.error('Failed to restore file');
    }
  };

  const moveFileToFolder = async (fileId, targetFolderId) => {
    try {
      await fileService.moveToFolder(fileId, targetFolderId);
      const updatedFiles = attachments.map(file => 
        file.Id === fileId 
          ? { ...file, folderId: targetFolderId }
          : file
      );
      onChange(updatedFiles);
      toast.success('File moved successfully');
    } catch (error) {
      toast.error('Failed to move file');
    }
  };

  const deleteExternalLink = async (linkId) => {
    try {
      await fileService.deleteExternalLink(linkId);
      const updatedLinks = externalLinks.filter(l => l.Id !== linkId);
      onExternalLinksChange && onExternalLinksChange(updatedLinks);
      toast.success('External link deleted successfully');
    } catch (error) {
      toast.error('Failed to delete external link');
    }
  };
  const openRenameModal = (file) => {
    setRenameModal({ 
      isOpen: true, 
file, 
      newName: file.name.replace(/\.[^/.]+$/, "") // Remove extension
    });
  };

  const getCurrentFolderFiles = () => {
    return attachments.filter(file => file.folderId === currentFolder?.Id);
  };

  const getCurrentFolderLinks = () => {
    return externalLinks.filter(link => link.folderId === currentFolder?.Id);
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    let folder = currentFolder;
    
    while (folder) {
      breadcrumbs.unshift(folder);
      folder = folders.find(f => f.Id === folder.parentFolderId);
    }
    
    return breadcrumbs;
  };

const getDisplayFiles = () => {
    let filesToShow = [];
    
    switch (viewMode) {
      case 'files':
        filesToShow = getCurrentFolderFiles();
        break;
      case 'links':
        return getCurrentFolderLinks();
      case 'archived':
        filesToShow = archivedFiles;
        break;
      default:
        filesToShow = getCurrentFolderFiles();
    }
    
    return filesToShow.filter(file =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFileIcon = (file) => {
    return supportedTypes[file.type]?.icon || 'File';
  };

  const filteredAttachments = getDisplayFiles();

  const getFolderIcon = () => 'Folder';
  const getLinkIcon = () => 'ExternalLink';

  const getTotalSize = () => {
    return attachments.reduce((total, file) => total + (file.size || 0), 0);
  };

return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Navigation and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setCurrentFolder(null)}
            className={cn(
              "hover:text-blue-600 transition-colors",
              !currentFolder && "text-blue-600 font-medium"
            )}
          >
            Root
          </button>
          {getBreadcrumbs().map((folder, index) => (
            <React.Fragment key={folder.Id}>
              <ApperIcon name="ChevronRight" size={14} className="text-gray-400" />
              <button
                onClick={() => setCurrentFolder(folder)}
                className="hover:text-blue-600 transition-colors"
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('files')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              viewMode === 'files' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ApperIcon name="File" size={16} className="inline mr-1" />
            Files
          </button>
          <button
            onClick={() => setViewMode('links')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              viewMode === 'links' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ApperIcon name="ExternalLink" size={16} className="inline mr-1" />
            Links
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              viewMode === 'archived' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <ApperIcon name="Archive" size={16} className="inline mr-1" />
            Archived
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {viewMode === 'files' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Upload" size={16} />
              Upload Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateFolderModal({ isOpen: true, name: '' })}
              className="flex items-center gap-2"
            >
              <ApperIcon name="FolderPlus" size={16} />
              New Folder
            </Button>
          </>
        )}
        {viewMode === 'links' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExternalLinkModal({ isOpen: true, title: '', url: '', description: '' })}
            className="flex items-center gap-2"
          >
            <ApperIcon name="Plus" size={16} />
            Add External Link
          </Button>
        )}
      </div>

      {/* Upload Zone (only in files mode) */}
      {viewMode === 'files' && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
            isDragOver 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-manager"
            accept={Object.keys(supportedTypes).join(',')}
          />
          
          <motion.div
            animate={{ scale: isDragOver ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className={cn(
              "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isDragOver ? "bg-blue-100" : "bg-gray-100"
            )}>
              <ApperIcon 
                name="Upload" 
                size={24} 
                className={cn(
                  "transition-colors",
                  isDragOver ? "text-blue-600" : "text-gray-400"
                )} 
              />
            </div>
            
            <div>
              <p className={cn(
                "text-sm font-medium transition-colors",
                isDragOver ? "text-blue-600" : "text-gray-600"
              )}>
                {isDragOver ? "Drop files here" : "Drag and drop files here"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or <label htmlFor="file-upload-manager" className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">browse files</label>
              </p>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>Supported: Images, Documents, Videos, Audio, Archives</p>
              <p>Max size: {formatFileSize(maxFileSize)} per file • Max {maxFiles} files</p>
              {currentFolder && <p>Files will be saved to: {currentFolder.name}</p>}
            </div>
          </motion.div>
        </div>
      )}

      {/* Current Folder Files/Links Display */}
      {viewMode === 'files' && currentFolder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <ApperIcon name="Folder" size={16} />
            <span className="font-medium">Current Folder: {currentFolder.name}</span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      <AnimatePresence>
        {Object.keys(uploadProgress).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-700 truncate">{fileId.split('_')[0]}</span>
                  <span className="text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

{/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Attachments ({attachments.length})
            </h4>
            <span className="text-xs text-gray-500">
              Total: {formatFileSize(getTotalSize())}
            </span>
          </div>

          {/* File Search */}
          <div className="relative">
            <ApperIcon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Folder Navigation (only in files mode) */}
          {viewMode === 'files' && folders.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Folders</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {folders
                  .filter(folder => folder.parentFolderId === currentFolder?.Id)
                  .map((folder) => (
                    <motion.div
                      key={folder.Id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setCurrentFolder(folder)}
                    >
                      <ApperIcon name="Folder" size={20} className="text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {folder.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(folder.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle folder actions
                        }}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ApperIcon name="MoreHorizontal" size={16} />
                      </Button>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
          
<div className="grid gap-2">
            <AnimatePresence>
              {filteredAttachments.map((file, index) => (
                <motion.div
                  key={file.Id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ApperIcon name={getFileIcon(file)} size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
{/* Archive Button */}
                  {viewMode === 'files' && !file.isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmArchive({ isOpen: true, file })}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <ApperIcon name="Archive" size={16} className="text-orange-500" />
                    </Button>
                  )}

                  {/* Restore Button */}
                  {viewMode === 'archived' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreFile(file)}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <ApperIcon name="RotateCcw" size={16} className="text-green-500" />
                    </Button>
                  )}
<div className="flex items-center gap-1">
                  {/* Folder indicator */}
                  {file.folderId && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ApperIcon name="Folder" size={12} />
                      <span>{folders.find(f => f.Id === file.folderId)?.name || 'Unknown'}</span>
                    </div>
                  )}
                  
                  {/* Archive indicator */}
                  {file.isArchived && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <ApperIcon name="Archive" size={12} />
                      <span>Archived</span>
                    </div>
                  )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRenameModal(file)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                      title="Rename file"
                    >
                      <ApperIcon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                      title="Remove file"
                    >
                      <ApperIcon name="X" size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
</div>
        </div>
      )}

      {/* External Links Display */}
      {viewMode === 'links' && (
        <div className="space-y-3">
          {getCurrentFolderLinks().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ApperIcon name="ExternalLink" size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No external links</p>
                  <p className="text-sm">Add external links to reference external resources</p>
                </div>
              ) : (
                getCurrentFolderLinks().map((link) => (
                  <motion.div
                    key={link.Id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <ApperIcon name="ExternalLink" size={20} className="text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {link.title}
                      </h4>
                      <p className="text-xs text-blue-600 truncate hover:text-blue-800">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={() => {
                            // Log access
                            fileService.logAccess(link.Id, 'access', 'current-user').catch(() => {});
                          }}
                        >
                          {link.url}
                        </a>
                      </p>
                      {link.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Added {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExternalLink(link.Id)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ApperIcon name="Trash2" size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </motion.div>
                ))
)}
        </div>
      )}
      
      {/* Rename Modal */}
      {/* Rename Modal */}
{renameModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ApperIcon name="Edit" size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rename File</h3>
                <p className="text-sm text-gray-500">Enter a new name for this file</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={renameModal.newName}
                  onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new file name"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Extension: .{renameModal.file?.name.split('.').pop()}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRenameModal({ isOpen: false, file: null, newName: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => renameFile(renameModal.file, `${renameModal.newName}.${renameModal.file?.name.split('.').pop()}`)}
                  variant="default"
                  size="sm"
                >
                  Rename
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Folder Modal */}
      <Modal
        isOpen={createFolderModal.isOpen}
        onClose={() => setCreateFolderModal({ isOpen: false, name: '' })}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <Input
              type="text"
              value={createFolderModal.name}
              onChange={(e) => setCreateFolderModal(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter folder name..."
              className="w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setCreateFolderModal({ isOpen: false, name: '' })}
            >
              Cancel
</Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </div>
        </div>
      </Modal>

      {/* External Link Modal */}
      <Modal
        isOpen={externalLinkModal.isOpen}
        onClose={() => setExternalLinkModal({ isOpen: false, title: '', url: '', description: '' })}
        title="Add External Link"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Input
              type="text"
              value={externalLinkModal.title}
              onChange={(e) => setExternalLinkModal(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Link title (optional)"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL <span className="text-red-500">*</span>
            </label>
            <Input
              type="url"
              value={externalLinkModal.url}
              onChange={(e) => setExternalLinkModal(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Input
              type="text"
              value={externalLinkModal.description}
              onChange={(e) => setExternalLinkModal(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description..."
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setExternalLinkModal({ isOpen: false, title: '', url: '', description: '' })}
            >
              Cancel
            </Button>
            <Button onClick={handleAddExternalLink}>
              Add Link
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Archive Modal */}
      <Modal
        isOpen={confirmArchive.isOpen}
        onClose={() => setConfirmArchive({ isOpen: false, file: null })}
        title="Archive File"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to archive "{confirmArchive.file?.name}"? 
            You can restore it later from the archived files section.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmArchive({ isOpen: false, file: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => archiveFile(confirmArchive.file)}
            >
              Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default FileAttachmentManager;