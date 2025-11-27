import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import commentService, { addReaction, analyzeSentiment, buildCommentThreads, createComment, deleteComment, generateConversationSummary, getCommentStats, getCommentsByTaskId, markAsRead, removeReaction, searchComments, toggleLike, togglePin, toggleResolve, updateComment } from "@/services/api/commentService";
import { updateTaskCommentStats } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Select from "@/components/atoms/Select";
import CommentReactions from "@/components/molecules/CommentReactions";
import CommentInput from "@/components/molecules/CommentInput";
import toast from "@/utils/toast";

const CommentThread = ({ taskId, maxHeight = "400px" }) => {
  const [comments, setComments] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [filterType, setFilterType] = useState('all'); // all, pinned, resolved, unread, topic, sentiment, author
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [conversationSummary, setConversationSummary] = useState(null);
  const [collapsedThreads, setCollapsedThreads] = useState(new Set());
  const [commentStats, setCommentStats] = useState({
    total: 0,
    unread: 0,
    pinned: 0,
    resolved: 0,
    threads: 0
  });
const currentUserId = 1; // This would come from authentication context
const currentUserName = 'Current User'; // This would come from authentication context
const currentUserEmail = 'user@example.com'; // This would come from authentication context
  const EDIT_WINDOW_MINUTES = 5; // Configurable edit window
  useEffect(() => {
    loadComments();
  }, [taskId]);

  useEffect(() => {
    buildThreads();
}, [comments, searchQuery, filterType, selectedTopic, selectedSentiment, selectedAuthor]);

  useEffect(() => {
    loadCommentStats();
  }, [comments]);

  const loadCommentStats = async () => {
    try {
      const stats = await commentService.getCommentStats(taskId);
      setCommentStats(stats);
    } catch (error) {
      console.error('Failed to load comment stats:', error);
    }
  };
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
    
    // Apply author filter if different from search
    if (filterType === 'author' && selectedAuthor && !searchQuery.trim()) {
      filteredComments = await commentService.filterCommentsByAuthor(taskId, selectedAuthor);
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
      case 'topic':
        if (selectedTopic) {
          filteredComments = filteredComments.filter(c => c.topic === selectedTopic);
        }
        break;
      case 'sentiment':
        if (selectedSentiment) {
          filteredComments = filteredComments.filter(c => c.sentiment === selectedSentiment);
        }
        break;
      case 'author':
        if (selectedAuthor) {
          filteredComments = filteredComments.filter(c => c.authorName === selectedAuthor);
        }
        break;
      default:
        // Reset selections when switching away from specific filters
        if (filterType !== 'topic' && selectedTopic) {
          setSelectedTopic('');
        }
        if (filterType !== 'sentiment' && selectedSentiment) {
          setSelectedSentiment('');
        }
        if (filterType !== 'author' && selectedAuthor) {
          setSelectedAuthor('');
        }
        break;
    }

    const threadStructure = commentService.buildCommentThreads(filteredComments);
    setThreads(threadStructure);
  };

const toggleThreadCollapse = (commentId) => {
    setCollapsedThreads(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(commentId)) {
        newCollapsed.delete(commentId);
      } else {
        newCollapsed.add(commentId);
      }
      return newCollapsed;
    });
  };

  const handleAddComment = async (content, mentions = [], attachments = [], parentId = null, quotedCommentId = null, topic = null) => {
    try {
      const newComment = await commentService.createComment({
        taskId,
        parentId,
        content,
        topic,
        contentType: 'html',
        mentions,
        attachments,
        quotedCommentId,
authorId: currentUserId,
        authorName: currentUserName,
        authorEmail: currentUserEmail,
        authorAvatar: null
      });

      setComments(prev => [...prev, newComment]);
      await updateTaskCommentStats(taskId, comments.length + 1, false, new Date().toISOString());
      
      setReplyingTo(null);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  // Check if comment is from current user
const isOwnComment = (comment) => {
    return comment?.authorId === currentUserId;
  };

  const getEditStatus = (comment) => {
    if (!comment || comment.authorId !== currentUserId) {
      return { canEdit: false, reason: 'Not your comment' };
    }
    
    const editWindowMinutes = comment.editWindowMinutes || EDIT_WINDOW_MINUTES;
    const createdAt = new Date(comment.createdAt);
    const now = new Date();
    const minutesSinceCreation = (now - createdAt) / (1000 * 60);
    const remainingMinutes = Math.max(0, editWindowMinutes - minutesSinceCreation);
    
    return {
      canEdit: minutesSinceCreation <= editWindowMinutes,
      remainingMinutes: Math.ceil(remainingMinutes),
      remainingSeconds: Math.ceil((remainingMinutes * 60) % 60),
      totalMinutes: editWindowMinutes
    };
  };

  // Handle profile navigation (prepared for future implementation)
  const handleProfileClick = (authorId, authorName) => {
    // Future: navigate to user profile
    console.log(`Navigate to profile: ${authorName} (${authorId})`);
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
      
      // Check if reaction was added or removed for appropriate toast
      const userReaction = updatedComment.reactions.find(r => r.userId === 1 && r.emoji === emoji);
      if (userReaction) {
        toast.success(`Added ${emoji} reaction`);
      } else {
        toast.success(`Removed ${emoji} reaction`);
      }
    } catch (error) {
      toast.error('Failed to update reaction');
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

const RenderComment = ({ comment, isReply = false }) => {
  const sentiment = analyzeSentiment(comment.content);
  
  const getSentimentColor = (sentimentType) => {
    switch (sentimentType) {
      case 'positive': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'negative': return 'text-rose-700 bg-rose-50 border-rose-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getSentimentIcon = (sentimentType) => {
    switch (sentimentType) {
      case 'positive': return 'ThumbsUp';
      case 'negative': return 'ThumbsDown';
      default: return 'Minus';
    }
  };

  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editTimeRemaining, setEditTimeRemaining] = useState(null);
  const editStatus = getEditStatus(comment);

  // Update remaining edit time every second
  useEffect(() => {
    if (editStatus.canEdit && isOwnComment(comment)) {
      const interval = setInterval(() => {
        const newStatus = getEditStatus(comment);
        setEditTimeRemaining(newStatus);
        if (!newStatus.canEdit) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [comment, currentUserId]);

  return (
    <>
      <motion.div
        key={comment.Id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          isReply ? 'ml-12 mt-4 border-l-4 border-l-blue-200 pl-6' : 'mb-6'
        } ${
          comment.isPinned 
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm' 
            : 'bg-white border-slate-200'
        } rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-6`}
    >
      {/* Comment Header */}
<div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {/* Enhanced Avatar with Profile Click */}
          <div className="relative">
            <button
              onClick={() => handleProfileClick(comment.authorId, comment.authorName)}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-base font-semibold ring-2 ring-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
              title={`View ${comment?.authorName || 'User'}'s profile`}
            >
              {comment?.authorAvatar ? (
                <img 
                  src={comment.authorAvatar} 
                  alt={comment?.authorName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                comment?.authorName?.charAt(0) || '?'
              )}
            </button>
            {comment.isUnread && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
<div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => handleProfileClick(comment.authorId, comment.authorName)}
                className="font-semibold text-slate-900 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                title={`View ${comment?.authorName || 'User'}'s profile`}
              >
{comment?.authorName?.trim() || 'Unknown User'}
              </button>
              {/* Enhanced Status Indicators */}
              <div className="flex items-center gap-2">
                {comment.isPinned && (
                  <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    <ApperIcon name="Pin" size={12} />
                    Pinned
                  </div>
                )}
                {comment.isResolved && (
                  <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    <ApperIcon name="CheckCircle" size={12} />
                    Resolved
                  </div>
                )}
                {/* Enhanced Sentiment Indicator */}
                {sentiment.confidence > 0.4 && (
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${getSentimentColor(sentiment.sentiment)}`}>
                    <ApperIcon name={getSentimentIcon(sentiment.sentiment)} size={12} />
                    <span className="capitalize">{sentiment.sentiment}</span>
                  </div>
                )}
              </div>
            </div>
            
<div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="font-medium">{(() => {
                try {
                  if (!comment.createdAt) return 'Recently'
                  const date = new Date(comment.createdAt)
                  if (isNaN(date.getTime())) return 'Recently'
                  return formatDistanceToNow(date, { addSuffix: true })
                } catch (error) {
                  return 'Recently'
                }
              })()}</span>
              {comment.isEdited && (
                <button
                  onClick={() => setShowEditHistory(true)}
                  className="text-slate-400 text-xs hover:text-blue-600 transition-colors duration-200 cursor-pointer flex items-center gap-1"
                  title={`Last edited ${formatDistanceToNow(new Date(comment.updatedAt), { addSuffix: true })}. Click to view edit history.`}
                >
                  • <ApperIcon name="Edit3" size={12} />
                  <span>edited</span>
                </button>
              )}
            </div>
          </div>
        </div>

{/* Enhanced Action Buttons */}
        <div className="flex items-center justify-between">
          {/* Primary Actions */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-slate-50 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => handleToggleLike(comment.Id)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  comment.likedBy?.includes(currentUserId) 
                    ? 'text-rose-600 bg-rose-100 hover:bg-rose-200' 
                    : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
                title="Like"
              >
                <ApperIcon name="Heart" size={16} />
              </button>
              <button
                onClick={() => setReplyingTo(comment.Id)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                title="Reply"
              >
                <ApperIcon name="MessageCircle" size={16} />
              </button>
              <button
                onClick={() => handleTogglePin(comment.Id)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  comment.isPinned 
                    ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' 
                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
                title={comment.isPinned ? 'Unpin' : 'Pin'}
              >
                <ApperIcon name="Pin" size={16} />
              </button>
              <button
                onClick={() => handleToggleResolve(comment.Id)}
                className={`p-2 rounded-md transition-all duration-200 ${
                  comment.isResolved 
                    ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' 
                    : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                }`}
                title={comment.isResolved ? 'Reopen' : 'Resolve'}
              >
                <ApperIcon name="CheckCircle" size={16} />
              </button>
            </div>
          </div>

          {/* Management Actions - Only show for own comments */}
{isOwnComment(comment) && (
            <div className="flex items-center bg-slate-50 rounded-lg p-1 gap-0.5">
              <button
                onClick={() => setEditingComment(comment.Id)}
                disabled={!editStatus.canEdit}
                className={`p-2 rounded-md transition-all duration-200 relative group ${
                  editStatus.canEdit
                    ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed opacity-50'
                }`}
                title={editStatus.canEdit 
                  ? `Edit comment (${editStatus.remainingMinutes}m ${editStatus.remainingSeconds}s remaining)`
                  : 'Edit window expired'
                }
              >
                <ApperIcon name="Edit3" size={16} />
                {editStatus.canEdit && editStatus.remainingMinutes <= 1 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {editStatus.remainingSeconds}s left
                  </div>
                )}
              </button>
              <button
                onClick={() => handleDeleteComment(comment.Id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all duration-200"
                title="Delete"
              >
                <ApperIcon name="Trash2" size={16} />
              </button>
            </div>
)}
        </div>
      </div>
      
      {/* Enhanced Comment Content */}
      {/* Enhanced Comment Content */}
      {editingComment === comment.Id ? (
        <div className="ml-16">
          <CommentInput
            initialContent={comment.content}
            onSubmit={(content) => handleEditComment(comment.Id, content)}
            onCancel={() => setEditingComment(null)}
            placeholder="Edit your comment..."
            submitText="Update Comment"
          />
        </div>
      ) : (
        <div className="ml-16 space-y-4">
          <div 
            className="text-slate-700 leading-relaxed text-base prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />
          
          {/* Enhanced Conversation Summary */}
          {!isReply && comment.replies && comment.replies.length > 2 && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ApperIcon name="MessageSquare" size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-blue-900">Conversation Summary</span>
              </div>
              {(() => {
                const allComments = [comment, ...(comment.replies || [])];
                const summary = generateConversationSummary(allComments);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-blue-800">
                      <div className="flex items-center gap-1">
                        <ApperIcon name="Users" size={14} />
                        <span className="font-medium">{summary.participantCount}</span>
                        <span className="text-blue-600">participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ApperIcon name="Lightbulb" size={14} />
                        <span className="font-medium">{summary.keyPoints.length}</span>
                        <span className="text-blue-600">key points</span>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        summary.overallSentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                        summary.overallSentiment === 'negative' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <ApperIcon name={getSentimentIcon(summary.overallSentiment)} size={12} />
                        <span className="capitalize">{summary.overallSentiment} tone</span>
                      </div>
                    </div>
                    {summary.topics.length > 0 && (
                      <div className="flex items-center gap-2">
                        <ApperIcon name="Hash" size={14} className="text-blue-500" />
                        <div className="flex flex-wrap gap-1">
                          {summary.topics.slice(0, 3).map((topic, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Enhanced Attachments */}
          {comment.attachments?.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-600">Attachments</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {comment.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ApperIcon name="Paperclip" size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate block">{file.name}</span>
                      <span className="text-xs text-slate-500">Click to download</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Reactions and Stats */}
      <div className="flex items-center justify-between mt-6 ml-16">
        <CommentReactions 
          reactions={comment.reactions || []}
          onAddReaction={(emoji) => handleAddReaction(comment.Id, emoji)}
        />
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {comment.likes > 0 && (
            <div className="flex items-center gap-1.5">
              <ApperIcon name="Heart" size={14} className="text-rose-500" />
              <span className="font-medium">{comment.likes}</span>
            </div>
          )}
          {comment.replies?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <ApperIcon name="MessageCircle" size={14} className="text-blue-500" />
              <span className="font-medium">{comment.replies.length} replies</span>
            </div>
          )}
        </div>
      </div>

{/* Enhanced Reply Input */}
      {replyingTo === comment.Id && (
        <div className="mt-6 ml-16 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-3">
            <span className="text-sm font-medium text-slate-700">
              Replying to <span className="font-semibold text-blue-600">{comment?.authorName || 'Anonymous'}</span>
            </span>
          </div>
          <CommentInput
            onSubmit={(content, mentions, attachments) => 
              handleAddComment(content, mentions, attachments, comment.Id)
            }
            onCancel={() => setReplyingTo(null)}
            placeholder={`Reply to ${comment?.authorName || 'Anonymous'}...`}
            submitText="Post Reply"
          />
        </div>
      )}

      {/* Enhanced Replies */}
{/* Thread Controls and Replies */}
      {comment?.replies?.length > 0 && !isReply && (
        <div className="mt-6 ml-16">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => toggleThreadCollapse(comment.Id)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all duration-200 group"
              title={collapsedThreads.has(comment.Id) ? 'Expand thread' : 'Collapse thread'}
            >
              <motion.div
                animate={{ rotate: collapsedThreads.has(comment.Id) ? 0 : 90 }}
                transition={{ duration: 0.2 }}
              >
                <ApperIcon name="ChevronRight" size={16} />
              </motion.div>
              <span className="flex items-center gap-1.5">
                <ApperIcon name="MessageCircle" size={14} className="text-slate-500" />
                {collapsedThreads.has(comment.Id) ? 'View' : 'Hide'} {comment.totalReplyCount || comment.replies.length} 
                {comment.totalReplyCount === 1 || comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </button>
            
            {/* Reply Count Badge */}
            <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              <ApperIcon name="Users" size={12} />
              <span className="text-xs font-medium">
                {[...new Set([comment.authorId, ...comment.replies.map(r => r.authorId)])].length} participants
              </span>
            </div>
          </div>
          
          <AnimatePresence>
            {!collapsedThreads.has(comment.Id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-4 overflow-hidden"
              >
                {comment.replies.map(reply => 
                  reply ? <RenderComment key={reply.Id} comment={reply} isReply={true} /> : null
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </motion.div>
    </>
  );
};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
return (
<div className="space-y-6 relative">
      {/* Enhanced Comments Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <ApperIcon name="MessageCircle" size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Comments</h2>
              <p className="text-sm text-slate-600">Collaborate and discuss with your team</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
              <ApperIcon name="MessageSquare" size={16} />
              <span className="font-semibold">{commentStats.total}</span>
              <span className="text-blue-600">comments</span>
            </div>
            
            {commentStats.unread > 0 && (
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{commentStats.unread} unread</span>
              </div>
            )}
            
            {commentStats.pinned > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
                <ApperIcon name="Pin" size={14} />
                <span className="text-sm font-medium">{commentStats.pinned}</span>
              </div>
            )}
            
            {commentStats.resolved > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
                <ApperIcon name="CheckCircle" size={14} />
                <span className="text-sm font-medium">{commentStats.resolved}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <ApperIcon name="Search" size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-32"
            >
              <option value="all">All Comments</option>
              <option value="pinned">📌 Pinned</option>
              <option value="resolved">✅ Resolved</option>
              <option value="unread">🔵 Unread</option>
              <option value="author">👤 By Author</option>
              <option value="sentiment">😊 By Sentiment</option>
              <option value="topic">🏷️ By Topic</option>
            </select>
            
            {/* Enhanced Topic Selection */}
            {filterType === 'topic' && (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-40"
              >
                <option value="">Select Topic</option>
                {[...new Set(comments.map(c => c.topic).filter(Boolean))].map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
)}
            
            {/* Author Filter */}
            {filterType === 'author' && (
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-40"
              >
                <option value="">Select Author</option>
                {[...new Set(comments.map(c => c.authorName).filter(Boolean))].map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            )}
            
            {/* Enhanced Sentiment Filter */}
            {filterType === 'sentiment' && (
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-40"
              >
                <option value="">All Sentiments</option>
                <option value="positive">😊 Positive</option>
                <option value="negative">😞 Negative</option>
                <option value="neutral">😐 Neutral</option>
              </select>
            )}
          </div>
        </div>
        
        {/* Filter Summary */}
{(searchQuery || filterType !== 'all' || selectedTopic || selectedSentiment || selectedAuthor) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ApperIcon name="Filter" size={14} />
              <span>Active filters:</span>
              <div className="flex flex-wrap gap-1">
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {filterType}
                  </span>
                )}
                {selectedTopic && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Topic: {selectedTopic}
                  </span>
                )}
                {selectedSentiment && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Sentiment: {selectedSentiment}
                  </span>
                )}
                {selectedAuthor && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Author: {selectedAuthor}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

{/* Enhanced Comments List */}
      <div className="space-y-4 mb-8" style={{ maxHeight, overflowY: 'auto' }}>
        <AnimatePresence>
          {threads.length > 0 ? (
            threads.map((comment) => (
              <motion.div
                key={comment.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`transition-all duration-200 hover:shadow-md ${
                  isOwnComment(comment)
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ring-2 ring-blue-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
}`}
              >
                <RenderComment comment={comment} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <ApperIcon name="MessageCircle" size={32} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {searchQuery || filterType !== 'all' ? 'No comments match your search' : 'No comments yet'}
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search criteria or filters to find what you\'re looking for' 
                  : 'Start the conversation! Share your thoughts, ask questions, or provide feedback to keep the team connected and informed.'
                }
              </p>
              {(!searchQuery && filterType === 'all') && (
                <button
                  onClick={() => document.getElementById('comment-input')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ApperIcon name="Plus" size={18} />
                  Add a comment
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

{/* Enhanced Add New Comment Section */}
<div className="border-t-2 border-slate-100 pt-8">
        <CommentInput
          onSubmit={handleAddComment}
          placeholder="What's on your mind? Share updates, ask questions, or provide feedback..."
          taskId={taskId}
          enableTopicSelection={true}
        />
      </div>
    </div>
  );
};
export default CommentThread;