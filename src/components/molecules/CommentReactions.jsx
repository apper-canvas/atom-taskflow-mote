import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";

// Available emoji reactions
const REACTION_EMOJIS = [
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😂', name: 'laughing' },
  { emoji: '🎉', name: 'celebration' },
  { emoji: '😍', name: 'heart_eyes' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '💯', name: 'hundred' },
  { emoji: '✨', name: 'sparkles' },
  { emoji: '👏', name: 'clapping' },
  { emoji: '🚀', name: 'rocket' },
  { emoji: '💪', name: 'muscle' },
  { emoji: '🎯', name: 'target' }
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
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(groupedReactions).map(([emoji, reactionsList]) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleEmojiSelect(emoji)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-white to-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-full text-sm transition-all duration-200 shadow-sm hover:shadow-md group"
            title={reactionsList.map(r => r.userName).join(', ')}
          >
            <span className="text-lg group-hover:scale-110 transition-transform duration-200">{emoji}</span>
            <span className="text-slate-700 font-semibold group-hover:text-blue-700 transition-colors duration-200">{reactionsList.length}</span>
          </motion.button>
        ))}
      </div>

      {/* Enhanced Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
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
                className="absolute bottom-full left-0 mb-3 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-30 min-w-52"
              >
                <div className="mb-3">
                  <span className="text-sm font-semibold text-slate-700">Quick reactions</span>
                  <div className="w-full h-px bg-slate-200 mt-2"></div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {REACTION_EMOJIS.map(({ emoji, name }) => (
                    <button
                      key={name}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-2.5 hover:bg-blue-50 rounded-lg text-xl transition-all duration-200 hover:scale-125 hover:shadow-sm border border-transparent hover:border-blue-200"
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