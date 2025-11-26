import commentsData from "@/services/mockData/comments.json";

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
  
  const maxId = comments.length > 0 ? Math.max(...comments.map(c => c.Id)) : 0;
  
  const newComment = {
    Id: maxId + 1,
    taskId: parseInt(commentData.taskId),
parentId: commentData.parentId || null,
    topic: commentData.topic || null,
    content: commentData.content || "",
    contentType: commentData.contentType || "text", // text, html, markdown
    authorId: commentData.authorId || 1,
    authorName: commentData.authorName || "Current User",
    authorEmail: commentData.authorEmail || "user@example.com",
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
    updatedAt: new Date().toISOString()
  };
  
  comments.push(newComment);
  return newComment;
};

// Update an existing comment
export const updateComment = async (id, updates) => {
  await new Promise(resolve => setTimeout(resolve, 250));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(id));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  const originalComment = { ...comments[index] };
  
  // Track edit history if content changed
  const editHistory = [...(comments[index].editHistory || [])];
  if (updates.content && updates.content !== comments[index].content) {
    editHistory.push({
      content: comments[index].content,
      editedAt: comments[index].updatedAt,
      editedBy: comments[index].authorId
    });
  }

  comments[index] = {
    ...comments[index],
    ...updates,
    isEdited: updates.content ? true : comments[index].isEdited,
    editHistory,
    updatedAt: new Date().toISOString()
  };
  
  return comments[index];
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

// Add reaction to comment
export const addReaction = async (commentId, reaction, userId) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const index = comments.findIndex(comment => comment.Id === parseInt(commentId));
  if (index === -1) {
    throw new Error('Comment not found');
  }

  const comment = comments[index];
  const reactions = [...(comment.reactions || [])];
  
  // Check if user already reacted with this emoji
  const existingReaction = reactions.find(r => r.emoji === reaction && r.userId === userId);
  
  if (existingReaction) {
    // Remove existing reaction
    const reactionIndex = reactions.findIndex(r => r.emoji === reaction && r.userId === userId);
    reactions.splice(reactionIndex, 1);
  } else {
    // Add new reaction
    reactions.push({
      emoji: reaction,
      userId,
      userName: "Current User",
      createdAt: new Date().toISOString()
    });
  }

  comments[index] = {
    ...comment,
    reactions,
    updatedAt: new Date().toISOString()
  };
  
  return comments[index];
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

// Build threaded comment structure
export const buildCommentThreads = (comments) => {
  const commentMap = {};
  const topicGroups = {};

  // First pass: create comment map and group by topic
  comments.forEach(comment => {
    commentMap[comment.Id] = { ...comment, replies: [] };
    
    const topic = comment.topic || 'General';
    if (!topicGroups[topic]) {
      topicGroups[topic] = [];
    }
  });

  // Second pass: build threads within topics
  comments.forEach(comment => {
    const topic = comment.topic || 'General';
    
    if (comment.parentId && commentMap[comment.parentId]) {
      commentMap[comment.parentId].replies.push(commentMap[comment.Id]);
    } else {
      topicGroups[topic].push(commentMap[comment.Id]);
    }
  });

  // Sort threads within each topic: pinned first, then by creation date
  Object.keys(topicGroups).forEach(topic => {
    topicGroups[topic].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
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

const commentService = {
  getCommentsByTaskId,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  addReaction,
  toggleLike,
  togglePin,
  toggleResolve,
  searchComments,
  markAsRead,
  getTeamMembers,
  getCommentStats,
buildCommentThreads,
  getCommentTopics
};

export default commentService;