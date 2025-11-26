import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import { cn } from '@/utils/cn';
import toast from '@/utils/toast';

const FilePreviewModal = ({ file, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!file) return null;

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const downloadFile = (customName = null) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = customName || file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('File download started');
    } else {
      toast.error('File not available for download');
    }
  };

  const handleArchiveToggle = async () => {
    if (file.isArchived) {
      // Restore file
      toast.info('Restore functionality would be implemented here');
    } else {
      // Archive file
      toast.info('Archive functionality would be implemented here');
    }
  };

  const shareFile = () => {
    if (navigator.share) {
      navigator.share({
        title: file.name,
        text: `Check out this file: ${file.name}`,
        url: file.url
      }).catch(err => {
        toast.error('Error sharing file');
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(file.url).then(() => {
        toast.success('File link copied to clipboard');
      }).catch(() => {
        toast.error('Unable to share file');
      });
    }
  };

  const renderPreview = () => {
if (!file.category || !file.url) {
      return (
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ApperIcon name="File" size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Preview not available</p>
          </div>
        </div>
      );
    }
    
    // Check if file is archived
    if (file.isArchived) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center space-y-2">
            <ApperIcon name="File" size={48} className="text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600">Preview not available</p>
          </div>
        </div>
      );
    }

    switch (file.category) {
      case 'image':
        return (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="text-center space-y-2">
                  <ApperIcon name="ImageOff" size={48} className="text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Failed to load image</p>
                </div>
              </div>
            )}
            <img
              src={file.url}
              alt={file.name}
              className={cn(
                "max-w-full max-h-96 object-contain rounded-lg",
                loading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          </div>
        );

      case 'video':
        return (
          <video
            controls
            className="max-w-full max-h-96 rounded-lg"
            onLoadStart={() => setLoading(false)}
          >
            <source src={file.url} type={file.type} />
            Your browser does not support video playback.
          </video>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
              <ApperIcon name="Music" size={48} className="text-blue-600" />
            </div>
            <audio
              controls
              className="w-full"
              onLoadStart={() => setLoading(false)}
            >
              <source src={file.url} type={file.type} />
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case 'document':
        if (file.type === 'application/pdf') {
          return (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <ApperIcon name="FileText" size={48} className="text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-700">PDF Preview</p>
                <p className="text-xs text-red-600 mt-1">Click download to view the full document</p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center space-y-2">
              <ApperIcon name="FileText" size={48} className="text-blue-600 mx-auto" />
              <p className="text-sm text-gray-700 font-medium">Document File</p>
              <p className="text-xs text-gray-600">Click download to view content</p>
            </div>
          </div>
        );

      case 'archive':
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center space-y-2">
              <ApperIcon name="Archive" size={48} className="text-purple-600 mx-auto" />
              <p className="text-sm text-gray-700 font-medium">Archive File</p>
              <p className="text-xs text-gray-600">Click download to extract contents</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center space-y-2">
              <ApperIcon name="File" size={48} className="text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">Preview not supported</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ApperIcon name="Eye" size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
          </div>
<div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile()}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Download" size={16} />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareFile}
              className="flex items-center gap-2"
            >
              <ApperIcon name="Share" size={16} />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <ApperIcon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="space-y-4">
          <div className="flex justify-center">
            {renderPreview()}
          </div>

{/* File Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">File Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
<span className="text-gray-500">Name:</span>
                <span className="text-gray-900 ml-2 break-all">{file.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="text-gray-900 ml-2">{formatFileSize(file.size)}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="text-gray-900 ml-2">{file.type}</span>
              </div>
              <div>
                <span className="text-gray-500">Modified:</span>
                <span className="text-gray-900 ml-2">
                  {file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown'}
                </span>
              </div>
              {file.version && (
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="text-gray-900 ml-2">{file.version}</span>
                </div>
              )}
              {file.uploadedBy && (
                <div>
                  <span className="text-gray-500">Uploaded By:</span>
                  <span className="text-gray-900 ml-2">{file.uploadedBy}</span>
                </div>
              )}
              {file.folderId && (
                <div>
                  <span className="text-gray-500">Folder:</span>
                  <span className="text-gray-900 ml-2">Organized</span>
                </div>
              )}
              {file.storageLocation && (
                <div>
                  <span className="text-gray-500">Storage:</span>
                  <span className="text-gray-900 ml-2 capitalize">{file.storageLocation}</span>
                </div>
              )}
              {file.isArchived && (
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="text-orange-600 ml-2 flex items-center gap-1">
                    <ApperIcon name="Archive" size={14} />
                    Archived
                  </span>
                </div>
              )}
              {file.archivedAt && (
                <div>
                  <span className="text-gray-500">Archived:</span>
                  <span className="text-gray-900 ml-2">
                    {new Date(file.archivedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

{/* File Actions */}
            <div className="pt-3 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Actions</h5>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('File history feature coming soon')}
                  className="flex items-center gap-2"
                >
                  <ApperIcon name="History" size={14} />
                  View History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Comments feature coming soon')}
                  className="flex items-center gap-2"
                >
                  <ApperIcon name="MessageCircle" size={14} />
                  Comments ({file.comments?.length || 0})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Permissions feature coming soon')}
                  className="flex items-center gap-2"
                >
                  <ApperIcon name="Lock" size={14} />
                  Permissions
                </Button>
                {!file.isArchived ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveToggle}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                  >
                    <ApperIcon name="Archive" size={14} />
                    Archive File
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveToggle}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <ApperIcon name="RotateCcw" size={14} />
                    Restore File
                  </Button>
                )}
                {file.accessLogs && file.accessLogs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('Access logs feature coming soon')}
                    className="flex items-center gap-2"
                  >
                    <ApperIcon name="Activity" size={14} />
                    Access Logs ({file.accessLogs.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FilePreviewModal;