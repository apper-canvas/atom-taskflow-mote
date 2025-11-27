import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import Modal from '@/components/atoms/Modal';
import ApperIcon from '@/components/ApperIcon';

const EditHistoryModal = ({ isOpen, onClose, comment }) => {
  const formatEditTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown time';
      return format(date, 'MMM d, yyyy at h:mm a');
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formatRelativeTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'some time ago';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  if (!comment) return null;

  const allVersions = [
    {
      Id: 'current',
      content: comment.content,
      editedAt: comment.updatedAt,
      editedBy: comment.authorId,
      version: 'Current',
      isCurrent: true
    },
    ...(comment.editHistory || []).reverse()
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <ApperIcon name="History" size={20} className="text-blue-600" />
          <span>Edit History</span>
        </div>
      }
    >
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {allVersions.map((version, index) => (
          <motion.div
            key={version.Id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border ${
              version.isCurrent 
                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {version.isCurrent ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-green-700">
                      Current Version
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ApperIcon name="RotateCcw" size={14} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      Version {version.version}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                <div>{formatEditTime(version.editedAt)}</div>
                <div className="text-right opacity-75">
                  {formatRelativeTime(version.editedAt)}
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {version.content || 'No content'}
              </div>
            </div>
          </motion.div>
        ))}
        
        {allVersions.length === 1 && (
          <div className="text-center py-8 text-gray-500">
            <ApperIcon name="Clock" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No edit history available</p>
            <p className="text-xs opacity-75">This comment hasn't been edited yet</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ApperIcon name="Info" size={14} />
            <span>Comments can be edited for 5 minutes after posting</span>
          </div>
          <div>
            {allVersions.length - 1} {allVersions.length - 1 === 1 ? 'edit' : 'edits'}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditHistoryModal;