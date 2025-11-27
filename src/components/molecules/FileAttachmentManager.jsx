import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { cn } from '@/utils/cn';
import toast from '@/utils/toast';
import fileService from '@/services/api/fileService';

const FileAttachmentManager = ({ 
  attachments = [], 
  onChange, 
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  acceptedTypes = ['*/*'],
  disabled = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const type = file.type || '';
    const extension = file.name?.split('.').pop()?.toLowerCase() || '';
    
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'headphones';
    if (type.includes('pdf') || extension === 'pdf') return 'file-text';
    if (type.includes('word') || ['doc', 'docx'].includes(extension)) return 'file-text';
    if (type.includes('excel') || ['xls', 'xlsx'].includes(extension)) return 'spreadsheet';
    if (type.includes('powerpoint') || ['ppt', 'pptx'].includes(extension)) return 'presentation';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'cpp'].includes(extension)) return 'code';
    return 'file';
  };

  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }
    
    if (attachments.length + uploadingFiles.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed.`;
    }

    return null;
  };

  const handleFiles = useCallback(async (files) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    errors.forEach(error => toast.error(error));

    if (validFiles.length === 0) return;

    // Start upload process
    setUploadingFiles(prev => [...prev, ...validFiles.map(file => ({ 
      file, 
      progress: 0, 
      id: Math.random().toString(36).substr(2, 9) 
    }))]);

    // Process each file
    for (const file of validFiles) {
      try {
        // Simulate upload progress
        const uploadId = Math.random().toString(36).substr(2, 9);
        
        // Update progress
        const updateProgress = (progress) => {
          setUploadingFiles(prev => prev.map(upload => 
            upload.file === file ? { ...upload, progress } : upload
          ));
        };

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          updateProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Create file object for service
        const fileData = {
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // In real app, this would be uploaded URL
          lastModified: file.lastModified || Date.now()
        };

        // Save to service (this creates the file record)
        const savedFile = await fileService.create(fileData);

        // Add to attachments
        onChange([...attachments, savedFile]);

        // Remove from uploading
        setUploadingFiles(prev => prev.filter(upload => upload.file !== file));

        toast.success(`${file.name} uploaded successfully`);

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
        
        // Remove from uploading
        setUploadingFiles(prev => prev.filter(upload => upload.file !== file));
      }
    }
  }, [attachments, onChange, maxFileSize, maxFiles, disabled]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (!disabled) {
      const files = e.dataTransfer.files;
      handleFiles(files);
    }
  }, [handleFiles, disabled]);

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow re-upload of same file
    e.target.value = '';
  };

  const removeFile = async (fileId) => {
    try {
      // Remove from service
      await fileService.delete(fileId);
      
      // Update local state
      onChange(attachments.filter(file => file.Id !== fileId));
      
      toast.success('File removed');
    } catch (error) {
      console.error('Remove file error:', error);
      toast.error('Failed to remove file');
    }
  };

  const openFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
          isDragOver 
            ? "border-primary bg-blue-50 scale-[1.02]"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:bg-gray-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileInput}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            openFileInput();
          }
        }}
        aria-label="Upload files"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept={acceptedTypes.join(',')}
          disabled={disabled}
        />
        
        <motion.div
          animate={{ scale: isDragOver ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <ApperIcon 
            name="upload" 
            size={40} 
            className={cn(
              "mx-auto mb-4",
              isDragOver ? "text-primary" : "text-gray-400"
            )} 
          />
        </motion.div>
        
        <p className="text-sm text-gray-600 mb-2">
          {isDragOver ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
        </p>
        
        <p className="text-xs text-gray-500">
          Max {maxFiles} files, {formatFileSize(maxFileSize)} each
        </p>
      </div>

      {/* Uploading Files */}
      <AnimatePresence>
        {uploadingFiles.map((upload) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <ApperIcon 
              name={getFileIcon(upload.file)} 
              size={20} 
              className="text-blue-600 mr-3 flex-shrink-0" 
            />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {upload.file.name}
              </p>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-blue-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <span className="text-xs text-blue-600 font-medium">
                  {upload.progress}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Attached Files */}
      <AnimatePresence>
        {attachments.map((file) => (
          <motion.div
            key={file.Id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <ApperIcon 
              name={getFileIcon(file)} 
              size={20} 
              className="text-gray-600 mr-3 flex-shrink-0" 
            />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name || file.originalName}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFile(file.Id)}
              className="ml-2 text-gray-400 hover:text-red-600 p-1"
              disabled={disabled}
              aria-label={`Remove ${file.name || file.originalName}`}
            >
              <ApperIcon name="x" size={16} />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* File Count Info */}
      {(attachments.length > 0 || uploadingFiles.length > 0) && (
        <div className="text-xs text-gray-500 text-center">
          {attachments.length} of {maxFiles} files attached
          {uploadingFiles.length > 0 && ` (${uploadingFiles.length} uploading)`}
        </div>
      )}
    </div>
  );
};

export default FileAttachmentManager;