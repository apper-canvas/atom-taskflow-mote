import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import commentService, { getCommentTopics } from "@/services/api/commentService";
import ApperIcon from "@/components/ApperIcon";
import Textarea from "@/components/atoms/Textarea";
import Button from "@/components/atoms/Button";
import MentionDropdown from "@/components/molecules/MentionDropdown";
import { showToast } from "@/utils/toast";
import { cn } from "@/utils/cn";

// Safe SDK availability check
const checkApperSDKAvailable = () => {
  return typeof window !== 'undefined' && 
         window.ApperSDK && 
         typeof window.ApperSDK.ApperClient === 'function';
};

// Initialize ApperClient safely
const initializeApperClient = () => {
  if (!checkApperSDKAvailable()) {
    return null;
  }
  
  try {
    const { ApperClient } = window.ApperSDK;
    return new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  } catch (error) {
    console.warn('Failed to initialize ApperClient:', error);
    return null;
  }
};

// Wait for SDK with timeout
const waitForSDK = async (timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (checkApperSDKAvailable()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
};

const CommentInput = ({ 
  onSubmit, 
  onCancel, 
  placeholder = "Add a comment...", 
  submitText = "Post Comment",
  initialContent = "",
  enableTopicSelection = false,
taskId = null,
  contextComments = []
}) => {
  const [content, setContent] = useState(initialContent);
  const [mentions, setMentions] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [apperClient, setApperClient] = useState(null);
  const [apperError, setApperError] = useState(false);
  const textareaRef = useRef(null);
  // Initialize ApperClient on component mount
React.useEffect(() => {
    const initSDK = async () => {
      // Wait for SDK to be available
      const sdkAvailable = await waitForSDK();
      
      if (sdkAvailable) {
        const client = initializeApperClient();
        if (client) {
          setApperClient(client);
          setApperError(false);
        } else {
          console.warn('ApperSDK available but client initialization failed');
          setApperError(true);
        }
      } else {
        console.warn('ApperSDK not available - reply suggestions disabled');
        setApperError(true);
      }
    };
    
    initSDK();
  }, []);
  
  // AI Suggestion states
  const [suggestions, setSuggestions] = useState([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mentions
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = value.slice(atIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      
      if (spaceIndex === -1 || spaceIndex > 0) {
        setMentionQuery(spaceIndex === -1 ? afterAt : afterAt.slice(0, spaceIndex));
        setMentionPosition(atIndex);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };


  const handleMentionSelect = (member) => {
    const beforeMention = content.slice(0, mentionPosition);
    const afterMention = content.slice(mentionPosition + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${member.name} ${afterMention}`;
    
    setContent(newContent);
    setMentions(prev => [...prev, member]);
    setShowMentionDropdown(false);
    setMentionQuery('');
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleRichTextAction = (action) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    let replacement = '';
    
    switch (action) {
      case 'bold':
        replacement = `<strong>${selectedText || 'bold text'}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${selectedText || 'italic text'}</em>`;
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          replacement = `<a href="${url}" target="_blank" rel="noopener">${selectedText || 'link text'}</a>`;
        }
        break;
      case 'code':
        replacement = `<code>${selectedText || 'code'}</code>`;
        break;
      default:
        return;
    }

    if (replacement) {
      const newContent = content.slice(0, start) + replacement + content.slice(end);
      setContent(newContent);
    }
  };

const handleGenerateSuggestions = async () => {
    if (!content.trim()) {
      showToast.warning('Please enter some text first to get reply suggestions');
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
if (!apperClient) {
        console.info('apper_info: Got an error in this function: generate-reply-suggestions. ApperClient not initialized');
        showToast('Reply suggestions unavailable - ApperSDK not loaded', 'error');
        return;
      }

      const result = await apperClient.functions.invoke(import.meta.env.VITE_GENERATE_REPLY_SUGGESTIONS, {
        body: JSON.stringify({
          commentText: content,
          contextComments: contextComments || [],
          authorName: 'Current User'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (result.success) {
        setSuggestions(result.suggestions);
        setShowSuggestions(true);
        showToast.success('Reply suggestions generated!');
      } else {
        console.info(`apper_info: Got an error in this function: ${import.meta.env.VITE_GENERATE_REPLY_SUGGESTIONS}. The response body is: ${JSON.stringify(result)}.`);
        showToast.error(result.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.info(`apper_info: Got this error an this function: ${import.meta.env.VITE_GENERATE_REPLY_SUGGESTIONS}. The error is: ${error.message}`);
      showToast.error('Failed to generate reply suggestions');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

const handleSelectSuggestion = (suggestion) => {
    setContent(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    textareaRef.current?.focus();
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation with user feedback - prevent empty/whitespace content
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length === 0) {
      showToast.warning('Please enter a comment before submitting');
      return;
    }
    
    // Additional length validation
    if (trimmedContent.length < 3) {
      showToast.warning('Comment must be at least 3 characters long');
      return;
    }
    
    // Prevent double submissions
    if (isSubmitting) {
      return;
    }
    
    // Load topics when topic selection is enabled
    if (enableTopicSelection && taskId && availableTopics.length === 0) {
      try {
        const topics = await commentService.getCommentTopics(taskId);
        setAvailableTopics(topics);
      } catch (error) {
        console.error('Failed to load topics:', error);
      }
    }

    setIsSubmitting(true);
    
    try {
      // Pass validated trimmed content to ensure no whitespace-only comments
      await onSubmit(trimmedContent, mentions, null, null, null, selectedTopic);
      
      // Only clear form on successful submission
      setContent('');
      setMentions([]);
      setSelectedTopic('');
      showToast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      showToast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    setMentions([]);
    if (onCancel) onCancel();
  };

return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
      onSubmit={handleSubmit}
    >
      {/* Compact User Avatar and Info Section */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white shadow-lg">
          <ApperIcon name="User" size={16} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 text-sm">Current User</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500">Adding a comment</span>
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50 px-3 py-1.5 transition-all duration-200 text-xs"
                >
                  <ApperIcon name="X" size={12} className="mr-1" />
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg text-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <ApperIcon name="Send" size={14} className="mr-1.5" />
                    {submitText || 'Add Comment'}
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-600">Share your thoughts with the team</p>
        </div>
      </div>
      
      {/* Compact AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ApperIcon name="Brain" size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-900">AI Reply Suggestions</span>
            </div>
            <button
              onClick={handleDismissSuggestions}
              className="text-blue-600 hover:text-blue-800 p-1 rounded"
            >
              <ApperIcon name="X" size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="block w-full text-left p-2 text-xs bg-white border border-blue-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          rows={3}
          richText={true}
          toolbar={true}
          onBold={() => handleRichTextAction('bold')}
          onItalic={() => handleRichTextAction('italic')}
          onLink={() => handleRichTextAction('link')}
          onCode={() => handleRichTextAction('code')}
          className="resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-lg text-sm"
        />

        {/* Mention Dropdown */}
        {showMentionDropdown && (
          <div className="absolute z-20" style={{ top: '100%', left: '12px' }}>
            <MentionDropdown
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentionDropdown(false)}
            />
          </div>
        )}
      </div>

      {/* Compact Mentioned Users */}
      {mentions.length > 0 && (
        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1.5">
            <ApperIcon name="AtSign" size={12} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Mentioning:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mentions.map((mention, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium"
              >
                <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {mention.name.charAt(0)}
                </div>
                {mention.name}
                <button
                  type="button"
                  onClick={() => setMentions(prev => prev.filter((_, i) => i !== index))}
                  className="ml-0.5 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ApperIcon name="X" size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Compact Helper Text */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg">
          <ApperIcon name="Info" size={12} />
          <span>Use @ to mention team members • Supports rich text formatting • Press Ctrl+Enter to submit</span>
        </div>
        
        {/* Compact Action Buttons */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            {/* AI Suggestions Button */}
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isGeneratingSuggestions || !content.trim()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-all duration-200 text-xs px-3 py-1.5"
            >
              <ApperIcon 
                name="Brain" 
                size={12} 
                className={isGeneratingSuggestions ? "animate-pulse" : ""} 
              />
              {isGeneratingSuggestions ? 'Thinking...' : 'AI Suggest'}
            </Button>
            
            {/* Character Count */}
            {content.length > 100 && (
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">
                  {content.length} characters
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.form>
  );
};
export default CommentInput;