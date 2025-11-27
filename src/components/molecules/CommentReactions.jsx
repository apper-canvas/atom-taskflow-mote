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
<div className="flex items-center gap-3">
      {/* Enhanced Existing Reactions */}
      <div className="flex items-center gap-2">
        {Object.entries(groupedReactions).map(([emoji, reactionsList]) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleEmojiSelect(emoji)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            title={reactionsList.map(r => r.userName).join(', ')}
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-slate-700 font-medium">{reactionsList.length}</span>
          </motion.button>
        ))}
      </div>

      {/* Add Reaction Button */}
{/* Enhanced Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all duration-200"
          title="Add reaction"
        >
          <ApperIcon name="Plus" size={16} />
        </button>

        {/* Enhanced Emoji Picker */}
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
                className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30 min-w-48"
              >
                <div className="mb-2">
                  <span className="text-xs font-medium text-slate-600">Quick reactions</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {REACTION_EMOJIS.map(({ emoji, name }) => (
                    <button
                      key={name}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-xl transition-all duration-200 hover:scale-110"
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