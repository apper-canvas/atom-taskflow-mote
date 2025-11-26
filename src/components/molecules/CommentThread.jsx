import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import ApperIcon from '@/components/ApperIcon';
import commentService from '@/services/api/commentService';
import { updateTaskCommentStats } from '@/services/api/taskService';
import CommentInput from './CommentInput';
import CommentReactions from './CommentReactions';
import toast from '@/utils/toast';

const CommentThread = ({ taskId, maxHeight = "600px" }) => {
  const [comments, setComments] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, pinned, resolved, unread
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  useEffect(() => {
    buildThreads();
  }, [comments, searchQuery, filterType]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getCommentsByTaskId(taskId);
      setComments(data);
      
      // Mark unread comments as read
      const unreadIds = data.filter(c => c.isUnread).map(c => c.Id);
      if (unreadIds.length > 0) {
        await commentService.markAsRead(unreadIds);
        // Update task comment stats
        await updateTaskCommentStats(taskId, data.length, false, data[0]?.createdAt);
      }
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const buildThreads = async () => {
    let filteredComments = comments;

    // Apply search filter
    if (searchQuery.trim()) {
      filteredComments = await commentService.searchComments(taskId, searchQuery);
    }

    // Apply type filter
    switch (filterType) {
      case 'pinned':
        filteredComments = filteredComments.filter(c => c.isPinned);
        break;
      case 'resolved':
        filteredComments = filteredComments.filter(c => c.isResolved);
        break;
      case 'unread':
        filteredComments = filteredComments.filter(c => c.isUnread);
        break;
      default:
        break;
    }

    const threadStructure = commentService.buildCommentThreads(filteredComments);
    setThreads(threadStructure);
  };

  const handleAddComment = async (content, mentions = [], attachments = [], parentId = null, quotedCommentId = null) => {
    try {
      const newComment = await commentService.createComment({
        taskId,
        parentId,
        content,
        contentType: 'html',
        mentions,
        attachments,
        quotedCommentId,
        authorName: 'Current User',
        authorEmail: 'user@example.com'
      });

      setComments(prev => [...prev, newComment]);
      await updateTaskCommentStats(taskId, comments.length + 1, false, new Date().toISOString());
      
      setReplyingTo(null);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      const updatedComment = await commentService.updateComment(commentId, { content });
      setComments(prev => prev.map(c => c.Id === commentId ? updatedComment : c));
      setEditingComment(null);
      toast.success('Comment updated successfully');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.Id !== commentId && c.parentId !== commentId));
      await updateTaskCommentStats(taskId, comments.length - 1, false);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleTogglePin = async (commentId) => {
    try {
      const updatedComment = await commentService.togglePin(commentId);
      setComments(prev => prev.map(c => c.Id === commentId ? updatedComment : c));
      toast.success(updatedComment.isPinned ? 'Comment pinned' : 'Comment unpinned');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleToggleResolve = async (commentId) => {
    try {
      const updatedComment = await commentService.toggleResolve(commentId);
      setComments(prev => prev.map(c => c.Id === commentId ? updatedComment : c));
      toast.success(updatedComment.isResolved ? 'Comment marked as resolved' : 'Comment reopened');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleAddReaction = async (commentId, emoji) => {
    try {
      const updatedComment = await commentService.addReaction(commentId, emoji, 1);
      setComments(prev => prev.map(c => c.Id === commentId ? updatedComment : c));
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const handleToggleLike = async (commentId) => {
    try {
      const updatedComment = await commentService.toggleLike(commentId, 1);
      setComments(prev => prev.map(c => c.Id === commentId ? updatedComment : c));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const renderComment = (comment, isReply = false) => (
    <motion.div
      key={comment.Id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-8 mt-3' : 'mb-4'} ${comment.isPinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white'} rounded-lg border border-gray-200 p-4`}
    >
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.authorName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
              {comment.isPinned && (
                <ApperIcon name="Pin" size={14} className="text-yellow-600" />
              )}
              {comment.isResolved && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Resolved</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              {comment.isEdited && <span>• edited</span>}
              {comment.isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToggleLike(comment.Id)}
            className={`p-1 rounded ${comment.likedBy?.includes(1) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Like"
          >
            <ApperIcon name="Heart" size={14} />
          </button>
          <button
            onClick={() => setReplyingTo(comment.Id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Reply"
          >
            <ApperIcon name="Reply" size={14} />
          </button>
          <button
            onClick={() => handleTogglePin(comment.Id)}
            className={`p-1 rounded ${comment.isPinned ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
            title={comment.isPinned ? 'Unpin' : 'Pin'}
          >
            <ApperIcon name="Pin" size={14} />
          </button>
          <button
            onClick={() => handleToggleResolve(comment.Id)}
            className={`p-1 rounded ${comment.isResolved ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            title={comment.isResolved ? 'Reopen' : 'Resolve'}
          >
            <ApperIcon name="Check" size={14} />
          </button>
          <button
            onClick={() => setEditingComment(comment.Id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Edit"
          >
            <ApperIcon name="Edit2" size={14} />
          </button>
          <button
            onClick={() => handleDeleteComment(comment.Id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete"
          >
            <ApperIcon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      {/* Comment Content */}
      {editingComment === comment.Id ? (
        <CommentInput
          initialContent={comment.content}
          onSubmit={(content) => handleEditComment(comment.Id, content)}
          onCancel={() => setEditingComment(null)}
          placeholder="Edit your comment..."
          submitText="Update"
        />
      ) : (
        <div className="mb-3">
          <div 
            className="text-sm text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
          {comment.attachments?.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                  <ApperIcon name="Paperclip" size={14} />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reactions and Stats */}
      <div className="flex items-center justify-between">
        <CommentReactions 
          reactions={comment.reactions || []}
          onAddReaction={(emoji) => handleAddReaction(comment.Id, emoji)}
        />
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {comment.likes > 0 && (
            <span className="flex items-center gap-1">
              <ApperIcon name="Heart" size={12} />
              {comment.likes}
            </span>
          )}
          {comment.replies?.length > 0 && (
            <span>{comment.replies.length} replies</span>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {replyingTo === comment.Id && (
        <div className="mt-4 ml-8">
          <CommentInput
            onSubmit={(content, mentions, attachments) => 
              handleAddComment(content, mentions, attachments, comment.Id)
            }
            onCancel={() => setReplyingTo(null)}
            placeholder={`Reply to ${comment.authorName}...`}
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies?.map(reply => renderComment(reply, true))}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="flex-1 relative">
          <ApperIcon name="Search" size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Comments</option>
          <option value="pinned">Pinned</option>
          <option value="resolved">Resolved</option>
          <option value="unread">Unread</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        <AnimatePresence>
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <ApperIcon name="MessageCircle" size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery || filterType !== 'all' ? 'No comments match your search' : 'No comments yet'}
              </p>
            </div>
          ) : (
            threads.map(thread => renderComment(thread))
          )}
        </AnimatePresence>
      </div>

      {/* Add Comment Input */}
      <div className="border-t border-gray-200 pt-4">
        <CommentInput
          onSubmit={handleAddComment}
          placeholder="Add a comment..."
        />
      </div>
    </div>
  );
};

export default CommentThread;