import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { cn } from '@/utils/cn';
import toast from '@/utils/toast';

const FileAttachmentManager = ({ 
  attachments = [], 
  onChange, 
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  className 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
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
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file), // For preview purposes
        category: supportedTypes[file.type]?.category || 'other'
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
  }, [attachments, onChange, maxFileSize, maxFiles]);

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

  const getFileIcon = (file) => {
    return supportedTypes[file.type]?.icon || 'File';
  };

  const getTotalSize = () => {
    return attachments.reduce((total, file) => total + (file.size || 0), 0);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
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
          </div>
        </motion.div>
      </div>

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
          
          <div className="grid gap-2">
            <AnimatePresence>
              {attachments.map((file, index) => (
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
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
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
    </div>
  );
};

export default FileAttachmentManager;