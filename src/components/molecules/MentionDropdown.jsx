import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import commentService from '@/services/api/commentService';

const MentionDropdown = ({ query, onSelect, onClose }) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    // Filter members based on query
    if (!query.trim()) {
      setFilteredMembers(members.slice(0, 5)); // Show first 5 if no query
    } else {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setFilteredMembers(filtered);
    }
  }, [query, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const teamMembers = await commentService.getTeamMembers();
      // Ensure all members have proper names
      const validMembers = teamMembers.map(member => ({
        ...member,
        name: member.name || `User ${member.Id}`,
        email: member.email || `user${member.Id}@example.com`
      }));
      setMembers(validMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
      // Fallback to empty array
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name || name.trim() === '') return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    const index = (name || '').charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64"
      >
        <div className="flex items-center justify-center py-2">
          <div className="w-4 h-4 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500">Loading members...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-72 max-h-80 overflow-y-auto"
      >
        {filteredMembers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ApperIcon name="Users" size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              {query ? `No members found for "${query}"` : 'No team members available'}
            </p>
            <p className="text-xs text-slate-500">Try a different search term</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredMembers.map(member => (
              <button
                key={member.Id}
                onClick={() => onSelect(member)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(member.name)} shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm text-ensure-visible">
                    {member.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate text-ensure-visible-light">
                    {member.email}
                  </div>
                </div>
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                  <ApperIcon name="AtSign" size={14} className="text-slate-500" />
                </div>
              </button>
            ))}
          </div>
        )}
        
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ApperIcon name="Info" size={12} />
            <span>Press <kbd className="px-1 py-0.5 bg-white rounded text-xs">Enter</kbd> to mention • <kbd className="px-1 py-0.5 bg-white rounded text-xs">Esc</kbd> to cancel</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MentionDropdown;