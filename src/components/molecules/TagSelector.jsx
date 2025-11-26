import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Badge from '@/components/atoms/Badge'
import tagService from '@/services/api/tagService'
import { cn } from '@/utils/cn'

const TagSelector = ({ selectedTags = [], onChange, placeholder = "Add tags...", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Load available tags
  useEffect(() => {
    loadTags()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const tags = await tagService.getAll()
      setAvailableTags(tags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter available tags based on search and exclude selected ones
  const filteredTags = availableTags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    const notSelected = !selectedTags.some(selected => selected.Id === tag.Id)
    return matchesSearch && notSelected
  })

  const handleTagSelect = (tag) => {
    const newSelectedTags = [...selectedTags, tag]
    onChange(newSelectedTags)
    setSearchTerm('')
    setIsOpen(false)
    
    // Focus back to input after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleTagRemove = (tagToRemove) => {
    const newSelectedTags = selectedTags.filter(tag => tag.Id !== tagToRemove.Id)
    onChange(newSelectedTags)
  }

  const handleInputFocus = () => {
    setInputFocused(true)
    setIsOpen(true)
  }

  const handleInputBlur = () => {
    setInputFocused(false)
    // Delay closing to allow for tag selection
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }, 200)
  }

  const handleKeyDown = (e) => {
    // Handle backspace to remove last tag
    if (e.key === 'Backspace' && !searchTerm && selectedTags.length > 0) {
      handleTagRemove(selectedTags[selectedTags.length - 1])
    }
    
    // Handle escape to close dropdown
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input Container */}
      <div 
        className={cn(
          "min-h-[42px] p-2 border rounded-lg bg-white cursor-text transition-colors",
          inputFocused || isOpen 
            ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20" 
            : "border-gray-300 hover:border-gray-400",
          disabled && "bg-gray-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {/* Selected Tags */}
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <motion.div
                key={tag.Id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex"
              >
                <Badge
                  style={{ 
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color
                  }}
                  className="border text-xs px-2 py-1 flex items-center gap-1 pr-1"
                >
                  <ApperIcon name={tag.icon} size={10} />
                  {tag.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTagRemove(tag)
                      }}
                      className="ml-1 p-0.5 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
                    >
                      <ApperIcon name="X" size={10} />
                    </button>
                  )}
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Input Field */}
          {!disabled && (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setIsOpen(true)
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={selectedTags.length === 0 ? placeholder : ''}
              className="flex-1 min-w-0 border-none outline-none bg-transparent text-sm placeholder-gray-400"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin mx-auto mb-2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-sm text-gray-500">Loading tags...</p>
              </div>
            ) : filteredTags.length > 0 ? (
              <div className="py-2">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.Id}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <ApperIcon name={tag.icon} size={14} className="text-gray-600" />
                    <span className="text-sm font-medium">{tag.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <ApperIcon name="Search" size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">
                  {searchTerm ? `No tags found for "${searchTerm}"` : 'No more tags available'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TagSelector