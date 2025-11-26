import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Textarea from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';
import MentionDropdown from './MentionDropdown';

const CommentInput = ({ 
  onSubmit, 
  onCancel, 
  placeholder = "Add a comment...", 
  submitText = "Post Comment",
  initialContent = "" 
}) => {
  const [content, setContent] = useState(initialContent);
  const [mentions, setMentions] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      className="space-y-3"
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
          className="resize-none"
        />
        
        {/* Mention Dropdown */}
        {showMentionDropdown && (
          <div className="absolute z-10" style={{ top: '100%', left: '12px' }}>
            <MentionDropdown
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentionDropdown(false)}
            />
          </div>
        )}
      </div>

      {/* Mentioned Users */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((mention, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
            >
              <ApperIcon name="AtSign" size={12} />
              {mention.name}
              <button
                type="button"
                onClick={() => setMentions(prev => prev.filter((_, i) => i !== index))}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <ApperIcon name="X" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ApperIcon name="Info" size={12} />
          <span>Use @ to mention team members</span>
        </div>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                Posting...
              </>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </div>
    </motion.form>
  );
};

export default CommentInput;