import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import commentService from "@/services/api/commentService";
import ApperIcon from "@/components/ApperIcon";
import Textarea from "@/components/atoms/Textarea";
import Button from "@/components/atoms/Button";
import MentionDropdown from "@/components/molecules/MentionDropdown";

const CommentInput = ({ 
  onSubmit, 
onCancel, 
  placeholder = "Add a comment...", 
  submitText = "Post Comment",
  initialContent = "",
  enableTopicSelection = false,
  taskId = null
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
  const textareaRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
if (!content.trim() || isSubmitting) return;

    // Load topics when topic selection is enabled
    if (enableTopicSelection && taskId && availableTopics.length === 0) {
      try {
        const { commentService } = await import('@/services/api/commentService');
        const topics = await commentService.getCommentTopics(taskId);
        setAvailableTopics(topics);
      } catch (error) {
        console.error('Failed to load topics:', error);
      }
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(content, mentions, []);
      setContent('');
      setMentions([]);
    } catch (error) {
      console.error('Failed to submit comment:', error);
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
      className="space-y-4"
      onSubmit={handleSubmit}
    >
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
          className="resize-none border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-lg"
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

      {/* Enhanced Mentioned Users */}
      {mentions.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <ApperIcon name="AtSign" size={14} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Mentioning:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {mentions.map((mention, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-full font-medium"
              >
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                  {mention.name.charAt(0)}
                </div>
                {mention.name}
                <button
                  type="button"
                  onClick={() => setMentions(prev => prev.filter((_, i) => i !== index))}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ApperIcon name="X" size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ApperIcon name="Info" size={14} />
          <span>Use @ to mention team members • Support rich text formatting</span>
        </div>
        
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Posting...
              </>
            ) : (
              <>
                <ApperIcon name="Send" size={16} className="mr-2" />
                {submitText}
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.form>
  );
};

export default CommentInput;