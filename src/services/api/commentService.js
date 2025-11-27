import commentsData from "@/services/mockData/comments.json";
import React from "react";
// Mock delay function for simulating API calls
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// Mock team members for mentions
const mockTeamMembers = [
  { Id: 1, name: "John Doe", email: "john@example.com", avatar: null },
  { Id: 2, name: "Sarah Wilson", email: "sarah@example.com", avatar: null },
  { Id: 3, name: "Mike Chen", email: "mike@example.com", avatar: null },
  { Id: 4, name: "Emily Davis", email: "emily@example.com", avatar: null },
  { Id: 5, name: "Alex Johnson", email: "alex@example.com", avatar: null }
];

// Helper function to get user by ID
const getUserById = (userId) => {
  const user = mockTeamMembers.find(member => member.Id === userId);
  return user || { Id: userId, name: `User ${userId}`, email: `user${userId}@example.com`, avatar: null };
};

let comments = [...commentsData];

// Get unique topics from comments
export const getCommentTopics = async (taskId) => {
  await delay();
  const taskComments = comments.filter(c => c.taskId === parseInt(taskId));
  const topics = [...new Set(taskComments.map(c => c.topic).filter(Boolean))];
  return topics.sort();
};

// Get all comments for a specific task
export const getCommentsByTaskId = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return comments.filter(comment => comment.taskId === parseInt(taskId));
};

// Get a single comment by ID
export const getCommentById = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return comments.find(comment => comment.Id === parseInt(id));
};

// Create a new comment
export const createComment = async (commentData) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Validate required fields
  if (!commentData) {
    throw new Error('Comment data is required');
  }
// Enhanced content validation - ensure it's not empty or whitespace only
  const content = commentData.content?.trim() || '';
  if (!content || content.length < 3) {
    throw new Error('Comment content must be at least 3 characters long');
  }
  if (!content.trim()) {
    throw new Error('Comment content cannot be empty');
  }
  
  // Validate taskId
  if (!commentData.taskId) {
    throw new Error('Task ID is required for comments');
  }
  
  const maxId = comments.length > 0 ? Math.max(...comments.map(c => c.Id)) : 0;
const newComment = {
    Id: maxId + 1,
    taskId: parseInt(commentData.taskId),
    parentId: commentData.parentId || null,
    topic: commentData.topic || null,
    content: content.trim(), // Use validated and trimmed content
    contentType: commentData.contentType || "html", // text, html, markdown
    authorId: commentData.authorId && commentData.authorId > 0 ? commentData.authorId : 1,
    authorName: commentData.authorName?.trim() || getUserById(commentData.authorId || 1).name,
    authorEmail: commentData.authorEmail?.trim() || getUserById(commentData.authorId || 1).email,
    authorAvatar: commentData.authorAvatar || null,
    mentions: Array.isArray(commentData.mentions) ? commentData.mentions : [],
    attachments: Array.isArray(commentData.attachments) ? commentData.attachments : [],
    reactions: [],
    likes: 0,
    likedBy: [],
    isPinned: false,
    isResolved: false,
    isEdited: false,
    editHistory: [],
    isUnread: false,
    quotedCommentId: commentData.quotedCommentId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    editWindowMinutes: 5 // Configurable edit window
  };
  
  comments.push(newComment);

  // Generate comment notifications asynchronously
  setTimeout(async () => {
    try {
      const { notificationService } = await import('./notificationService.js');
      
      // Notification for reply to existing comment
      if (commentData.parentId) {
        const parentComment = comments.find(c => c.Id === parseInt(commentData.parentId));
        if (parentComment && parentComment.authorId !== newComment.authorId) {
          await notificationService.createCommentNotification(
            'comment_reply',
            newComment.Id,
            commentData.taskId,
            `Task #${commentData.taskId}`,
            `${newComment.authorName} replied to your comment`,
            parentComment.authorId,
            newComment.authorName,
            content.trim()
          );
        }
      }

      // Notifications for mentions in comment
      if (commentData.mentions && Array.isArray(commentData.mentions)) {
        for (const mention of commentData.mentions) {
          if (mention.id && mention.id !== newComment.authorId) {
            await notificationService.createCommentNotification(
              'comment_mention',
              newComment.Id,
              commentData.taskId,
              `Task #${commentData.taskId}`,
              `${newComment.authorName} mentioned you in a comment`,
              mention.id,
              newComment.authorName,
              content.trim()
            );
          }
        }
      }
    } catch (error) {
      console.warn('Failed to send comment notifications:', error.message);
    }
  }, 50);
  // Trigger email notification for comment (async, don't block comment creation)
// Email notification (separate from in-app notifications)
  setTimeout(async () => {
    try {
      const { notificationService } = await import('./notificationService.js');
      
      // Create comment snippet for email (limit to 200 characters)
      let commentSnippet = content;
      if (commentSnippet.length > 200) {
        commentSnippet = commentSnippet.substring(0, 197) + '...';
      }

      // Get task information (mock data for now)
      const taskTitle = `Task #${commentData.taskId}`;
      
      await notificationService.sendEmailNotification({
        type: 'task_comment',
        taskId: commentData.taskId,
        taskTitle: taskTitle,
        assignedTo: newComment.authorEmail, // Send to comment author for now
        recipientEmail: newComment.authorEmail,
        commentSnippet: commentSnippet,
        commentAuthor: newComment.authorName,
        commentId: newComment.Id,
        priority: 'Normal'
      });

      console.log('Email notification sent for comment:', newComment.Id);
    } catch (error) {
      // Don't throw error to avoid blocking comment creation
      console.warn('Failed to send email notification for comment:', error.message);
    }
  }, 100); // Small delay to ensure comment is fully processed

  return newComment;
};

// Add reaction to comment
export const addReaction = async (commentId, emoji, userId = 1, userName = null) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const comment = comments.find(c => c.Id === commentId);
  if (!comment) throw new Error('Comment not found');
  
  // Get proper user name if not provided
  const resolvedUserName = userName || getUserById(userId).name;
  
  // Check if user already reacted with this emoji
  const existingReaction = comment.reactions.find(r => r.userId === userId && r.emoji === emoji);
  
  if (existingReaction) {
    // Remove existing reaction (toggle off)
    comment.reactions = comment.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
  } else {
    // Add new reaction
    comment.reactions.push({
      emoji,
      userId,
      userName: resolvedUserName,
      createdAt: new Date().toISOString()
    });
  }
  
  return comment;
};

export const removeReaction = async (commentId, emoji, userId = 1) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const comment = comments.find(c => c.Id === commentId);
  if (!comment) throw new Error('Comment not found');
  
  // Remove reaction from this user for this emoji
  comment.reactions = comment.reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
  
  return comment;
};

// Export getUserById for use in other components
export const getTeamMemberById = getUserById;

// Update an existing comment
export const updateComment = async (id, updates) => {
  await new Promise(resolve => setTimeout(resolve, 250));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(id));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  const comment = comments[index];
  
  // Check if edit window is still open
  const editWindowMinutes = comment.editWindowMinutes || 5;
  const createdAt = new Date(comment.createdAt);
  const now = new Date();
  const minutesSinceCreation = (now - createdAt) / (1000 * 60);
  
  if (minutesSinceCreation > editWindowMinutes) {
    throw new Error(`Edit window has expired. Comments can only be edited within ${editWindowMinutes} minutes of posting.`);
  }
  
  // Track edit history if content changed
  const editHistory = [...(comment.editHistory || [])];
  if (updates.content && updates.content !== comment.content) {
    editHistory.push({
      Id: editHistory.length + 1,
      content: comment.content,
      editedAt: comment.updatedAt,
      editedBy: comment.authorId,
      version: editHistory.length + 1
    });
  }

  comments[index] = {
    ...comment,
    ...updates,
    isEdited: updates.content ? true : comment.isEdited,
    editHistory,
    updatedAt: new Date().toISOString()
  };
  
  return comments[index];
};

// Helper function to check if comment is still editable
export const isCommentEditable = (comment, currentUserId = 1) => {
  if (!comment || comment.authorId !== currentUserId) {
    const author = getUserById(comment.authorId);
    return { canEdit: false, reason: `Not your comment (authored by ${author.name})` };
  }
  
  const editWindowMinutes = comment.editWindowMinutes || 5;
  const createdAt = new Date(comment.createdAt);
  const now = new Date();
  const minutesSinceCreation = (now - createdAt) / (1000 * 60);
  const remainingMinutes = Math.max(0, editWindowMinutes - minutesSinceCreation);
  
  return {
    canEdit: minutesSinceCreation <= editWindowMinutes,
    remainingMinutes: Math.ceil(remainingMinutes),
    remainingSeconds: Math.ceil((remainingMinutes * 60) % 60)
  };
};

// Delete a comment
export const deleteComment = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(id));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  // Also delete replies to this comment
  const deletedComment = comments[index];
  comments = comments.filter(comment => 
    comment.Id !== parseInt(id) && comment.parentId !== parseInt(id)
  );
  
  return deletedComment;
};

// Toggle like on comment
export const toggleLike = async (commentId, userId) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(commentId));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  const comment = comments[index];
  const likedBy = [...(comment.likedBy || [])];
  
  if (likedBy.includes(userId)) {
    // Remove like
    const likeIndex = likedBy.indexOf(userId);
    likedBy.splice(likeIndex, 1);
  } else {
    // Add like
    likedBy.push(userId);
  }

  comments[index] = {
    ...comment,
    likes: likedBy.length,
    likedBy,
    updatedAt: new Date().toISOString()
  };
  
  return comments[index];
};

// Pin/unpin comment
export const togglePin = async (commentId) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(commentId));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  comments[index] = {
    ...comments[index],
    isPinned: !comments[index].isPinned,
    updatedAt: new Date().toISOString()
  };
  
  return comments[index];
};

// Mark comment as resolved/unresolved
export const toggleResolve = async (commentId) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(commentId));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  comments[index] = {
    ...comments[index],
    isResolved: !comments[index].isResolved,
    updatedAt: new Date().toISOString()
  };
  
  return comments[index];
};

// Search comments
export const searchComments = async (taskId, query) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (!query.trim()) {
    return getCommentsByTaskId(taskId);
  }
  
  const taskComments = comments.filter(comment => comment.taskId === parseInt(taskId));
  return taskComments.filter(comment => 
    comment.content.toLowerCase().includes(query.toLowerCase()) ||
    comment.authorName.toLowerCase().includes(query.toLowerCase())
);
};

// Filter comments by author
export const filterCommentsByAuthor = async (taskId, authorName) => {
  await delay();
  
  if (!authorName.trim()) {
    return getCommentsByTaskId(taskId);
  }
  
  const taskComments = comments.filter(comment => comment.taskId === parseInt(taskId));
  return taskComments.filter(comment => 
    comment.authorName.toLowerCase() === authorName.toLowerCase()
  );
};

// Mark comments as read
export const markAsRead = async (commentIds) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  commentIds.forEach(commentId => {
    const index = comments.findIndex(comment => comment.Id === parseInt(commentId));
    if (index !== -1) {
      comments[index] = {
        ...comments[index],
        isUnread: false,
        updatedAt: new Date().toISOString()
      };
    }
  });
  
  return true;
};

// Get team members for mentions
export const getTeamMembers = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockTeamMembers;
};
// Get comment statistics for a task
export const getCommentStats = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const taskComments = comments.filter(comment => comment.taskId === parseInt(taskId));
  
  return {
    total: taskComments.length,
    unread: taskComments.filter(c => c.isUnread).length,
    pinned: taskComments.filter(c => c.isPinned).length,
resolved: taskComments.filter(c => c.isResolved).length,
    threads: taskComments.filter(c => !c.parentId).length
  };
};

// Build threaded comment structure - moved before export to fix hoisting
export const buildCommentThreads = (comments) => {
  const commentMap = {};
  const topicGroups = {};

  // First pass: create comment map and group by topic
  comments.forEach(comment => {
    commentMap[comment.Id] = { ...comment, replies: [], replyCount: 0 };
    
    const topic = comment.topic || 'General';
    if (!topicGroups[topic]) {
      topicGroups[topic] = [];
    }
  });

  // Second pass: build threads within topics and count replies
  comments.forEach(comment => {
    const topic = comment.topic || 'General';
    
    if (comment.parentId && commentMap[comment.parentId]) {
      commentMap[comment.parentId].replies.push(commentMap[comment.Id]);
      // Update reply count for parent
      commentMap[comment.parentId].replyCount = commentMap[comment.parentId].replies.length;
    } else {
      topicGroups[topic].push(commentMap[comment.Id]);
    }
  });

  // Third pass: recursively count all nested replies
  const countAllReplies = (comment) => {
    let totalReplies = comment.replies.length;
    comment.replies.forEach(reply => {
      totalReplies += countAllReplies(reply);
    });
    comment.totalReplyCount = totalReplies;
    return totalReplies;
  };

  // Apply recursive counting to all root comments
  Object.keys(topicGroups).forEach(topic => {
    topicGroups[topic].forEach(comment => {
      countAllReplies(comment);
    });
  });

// Sort threads within each topic: pinned first, then by creation date (oldest first, newest last)
  Object.keys(topicGroups).forEach(topic => {
    topicGroups[topic].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  });

  // Return flattened structure with topic headers
  const result = [];
  Object.keys(topicGroups).sort().forEach(topic => {
    if (topicGroups[topic].length > 0) {
      result.push({
        Id: `topic-${topic}`,
        type: 'topic-header',
        topic: topic,
        commentCount: topicGroups[topic].length,
        comments: topicGroups[topic]
      });
      result.push(...topicGroups[topic]);
    }
  });

  return result;
};

// Export all functions
export default {
  getCommentsByTaskId,
  createComment,
  updateComment,
  deleteComment,
  getCommentById,
  getCommentTopics,
  getTeamMembers,
  addReaction,
  removeReaction,
  toggleLike,
  togglePin,
  toggleResolve,
  searchComments,
  filterCommentsByAuthor,
  markAsRead,
  getCommentStats,
  buildCommentThreads
};

// Sentiment Analysis Functions
const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', confidence: 0, score: 0 };
  }

  const positiveWords = ['great', 'excellent', 'amazing', 'awesome', 'good', 'nice', 'perfect', 'love', 'wonderful', 'fantastic', 'brilliant', 'outstanding', 'superb', 'impressive', 'helpful', 'thanks', 'thank you', 'appreciate', 'well done', 'congratulations'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'stupid', 'wrong', 'broken', 'issue', 'problem', 'error', 'bug', 'fail', 'failed', 'disappointing', 'frustrated', 'annoying', 'difficult', 'confusing', 'unclear'];

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let positiveScore = 0;
  let negativeScore = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });

  const totalSentimentWords = positiveScore + negativeScore;
  
  if (totalSentimentWords === 0) {
    return { sentiment: 'neutral', confidence: 0.6, score: 0 };
  }

  const score = (positiveScore - negativeScore) / Math.max(words.length, 1);
  const confidence = Math.min(totalSentimentWords / Math.max(words.length, 1) * 2, 1);

  let sentiment = 'neutral';
  if (score > 0.1) sentiment = 'positive';
  else if (score < -0.1) sentiment = 'negative';

  return {
    sentiment,
    confidence: Math.max(confidence, 0.3),
    score: parseFloat(score.toFixed(3))
  };
};

const generateConversationSummary = (comments) => {
  if (!comments || comments.length === 0) {
    return {
      keyPoints: [],
      overallSentiment: 'neutral',
      participantCount: 0,
      timespan: null,
      topics: []
    };
  }

  const participants = [...new Set(comments.map(c => c.authorName))];
  const sortedComments = comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const timespan = {
    start: sortedComments[0]?.createdAt,
    end: sortedComments[sortedComments.length - 1]?.createdAt
  };

  // Extract key points (longer comments or those with reactions)
  const keyPoints = comments
    .filter(c => c.content.length > 50 || c.reactions?.length > 0 || c.isPinned)
    .slice(0, 3)
    .map(c => ({
      author: c.authorName,
      content: c.content.length > 100 ? c.content.substring(0, 100) + '...' : c.content,
      sentiment: analyzeSentiment(c.content).sentiment
    }));

  // Calculate overall sentiment
  const sentiments = comments.map(c => analyzeSentiment(c.content));
  const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
  let overallSentiment = 'neutral';
  if (avgScore > 0.1) overallSentiment = 'positive';
  else if (avgScore < -0.1) overallSentiment = 'negative';

  // Extract topics (simple keyword extraction)
  const allText = comments.map(c => c.content).join(' ').toLowerCase();
  const commonWords = allText.match(/\b\w{4,}\b/g) || [];
  const wordFreq = {};
  commonWords.forEach(word => {
    if (!['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'them', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'about', 'there', 'could', 'other', 'more', 'very', 'what', 'when', 'where', 'much', 'some', 'these', 'those'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const topics = Object.entries(wordFreq)
    .filter(([_, freq]) => freq > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, _]) => word);

  return {
    keyPoints,
    overallSentiment,
    participantCount: participants.length,
    timespan,
    topics
  };
};

const getConversationsByTopic = (taskId) => {
  const taskComments = comments.filter(comment => comment.taskId === parseInt(taskId));
  const threads = buildCommentThreads(taskComments);
  
  const conversations = threads.map(thread => {
    const allComments = [thread, ...(thread.replies || [])];
    const summary = generateConversationSummary(allComments);
    
    return {
      id: thread.Id,
      title: thread.content.length > 50 ? thread.content.substring(0, 50) + '...' : thread.content,
      author: thread.authorName,
      createdAt: thread.createdAt,
      commentCount: 1 + (thread.replies?.length || 0),
      summary,
      mainTopic: summary.topics[0] || 'general'
    };
  });

  // Group by topic
  const topicGroups = {};
  conversations.forEach(conv => {
    const topic = conv.mainTopic;
    if (!topicGroups[topic]) {
      topicGroups[topic] = [];
    }
    topicGroups[topic].push(conv);
  });

  return topicGroups;
};

// Build threaded comment structure

// Helper function to build context for AI suggestions
export const buildSuggestionContext = (comments, targetCommentId = null) => {
  if (!comments || comments.length === 0) return [];
  
  // If we have a specific comment we're replying to, include thread context
  if (targetCommentId) {
    const targetComment = comments.find(c => c.Id === targetCommentId);
    if (targetComment) {
      // Get the thread (parent and replies)
      const threadComments = comments.filter(c => 
        c.Id === targetCommentId || 
        c.parentId === targetCommentId || 
        (targetComment.parentId && (c.Id === targetComment.parentId || c.parentId === targetComment.parentId))
      );
      return threadComments.slice(-5).map(c => ({
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt
      }));
    }
  }
  
  // Otherwise return recent comments for general context
  return comments
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(c => ({
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt
    }));
};

// Validate suggestion content
export const validateSuggestion = (suggestion) => {
  if (!suggestion || typeof suggestion !== 'string') return false;
  const trimmed = suggestion.trim();
  return trimmed.length > 0 && trimmed.length <= 500; // Reasonable length limit
};

// Named exports for direct import
export { analyzeSentiment, generateConversationSummary, getConversationsByTopic };