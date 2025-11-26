import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';

const REACTION_EMOJIS = [
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😡', name: 'angry' },
  { emoji: '🎉', name: 'celebration' },
  { emoji: '🚀', name: 'rocket' }
];

const CommentReactions = ({ reactions = [], onAddReaction }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  const handleEmojiSelect = (emoji) => {
    onAddReaction(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Existing Reactions */}
      <div className="flex items-center gap-1">
        {Object.entries(groupedReactions).map(([emoji, reactionsList]) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleEmojiSelect(emoji)}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
            title={reactionsList.map(r => r.userName).join(', ')}
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{reactionsList.length}</span>
          </motion.button>
        ))}
      </div>

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          title="Add reaction"
        >
          <ApperIcon name="Smile" size={14} />
        </button>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowEmojiPicker(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-30"
              >
                <div className="grid grid-cols-4 gap-1">
                  {REACTION_EMOJIS.map(({ emoji, name }) => (
                    <button
                      key={name}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                      title={name.replace('_', ' ')}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentReactions;