import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import tagService from "@/services/api/tagService";
import ApperIcon from "@/components/ApperIcon";
import Input from "@/components/atoms/Input";
import { cn } from "@/utils/cn";

const FilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  selectedTag,
  onTagChange,
  selectedProject,
  onProjectChange,
  projects = [],
  viewMode,
  onViewModeChange 
}) => {
  const categories = [
    { value: "all", label: "All Tasks", icon: "List", count: 0 },
    { value: "Personal", label: "Personal", icon: "Home", count: 0 },
    { value: "Work", label: "Work", icon: "Briefcase", count: 0 },
{ value: "Other", label: "Other", icon: "Folder", count: 0 }
  ];

  const priorities = ["all", "High", "Medium", "Low"];
  const [availableTags, setAvailableTags] = useState([]);
  const statuses = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" }
  ]

  const projectOptions = [
    { value: "all", label: "All Projects" },
    { value: "unassigned", label: "No Project" },
    ...projects.map(project => ({
      value: project.Id.toString(),
      label: project.name,
      icon: project.icon,
      color: project.color
    }))
  ]

  // Load available tags for filtering
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagService = (await import('@/services/api/tagService')).default
        const tags = await tagService.getAll()
        setAvailableTags(tags)
      } catch (error) {
        console.error('Failed to load tags for filtering:', error)
      }
    }
    loadTags()
  }, [])

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4"
    >
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <ApperIcon name="Search" size={18} className="text-gray-400" />
        </div>
        <Input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <motion.button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              selectedCategory === category.value
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <ApperIcon name={category.icon} size={16} />
            {category.label}
          </motion.button>
        ))}
      </div>

{/* Additional Filters */}
<div className="flex flex-wrap items-center gap-4">
        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
          >
            {projectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon && option.value !== "all" && option.value !== "unassigned" ? `${option.icon} ` : ""}{option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority === "all" ? "All" : priority}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tag:</span>
          <select
            value={selectedTag}
            onChange={(e) => onTagChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag.Id} value={tag.Id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2",
                viewMode === "list"
                  ? "bg-white shadow-sm text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <ApperIcon name="List" size={16} />
              List
            </button>
            <button
              onClick={() => onViewModeChange("category")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2",
                viewMode === "category"
                  ? "bg-white shadow-sm text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <ApperIcon name="Grid3X3" size={16} />
              Groups
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FilterBar