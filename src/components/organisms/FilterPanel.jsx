import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import Modal from '@/components/atoms/Modal'
import { filterService } from '@/services/api/filterService'
import { projectService } from '@/services/api/projectService'
import tagService from '@/services/api/tagService'
import { cn } from '@/utils/cn'
import { showToast } from '@/utils/toast'

const FilterPanel = ({ 
  isCollapsed, 
  onToggleCollapse, 
  filters, 
  onFiltersChange,
  onApplySmartView,
  activeSmartView 
}) => {
  const [savedFilters, setSavedFilters] = useState([])
  const [projects, setProjects] = useState([])
  const [tags, setTags] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [filtersData, projectsData, tagsData] = await Promise.all([
        filterService.getSavedFilters(),
        projectService.getAll(),
        tagService.getAll()
      ])
      setSavedFilters(filtersData)
      setProjects(projectsData)
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load filter panel data:', error)
    }
  }

  const smartViews = filterService.getSmartViews()

  const handleSmartViewClick = (viewId) => {
    const view = smartViews[viewId]
    if (view) {
      onApplySmartView(viewId, view.filters)
      filterService.trackFilterUsage(`smart_${viewId}`)
    }
  }

  const handleSavedFilterClick = async (filter) => {
    onFiltersChange(filter.filters)
    await filterService.trackFilterUsage(filter.Id)
    showToast(`Applied filter: ${filter.name}`, 'info')
    await loadData() // Refresh to update usage counts
  }

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) {
      showToast('Please enter a filter name', 'error')
      return
    }

    try {
      setLoading(true)
      await filterService.saveFilter({
        name: saveFilterName,
        filters: filters
      })
      setSaveFilterName('')
      setShowSaveModal(false)
      showToast('Filter saved successfully!', 'success')
      await loadData()
    } catch (error) {
      showToast('Failed to save filter', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFilter = async (filterId, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this filter?')) {
      try {
        await filterService.deleteFilter(filterId)
        showToast('Filter deleted successfully', 'success')
        await loadData()
      } catch (error) {
        showToast('Failed to delete filter', 'error')
      }
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onApplySmartView('all', {})
    showToast('All filters cleared', 'info')
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 'auto' }}
        className="flex-shrink-0"
      >
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="sm"
          className="h-full rounded-none border-r border-gray-200 px-3"
        >
          <ApperIcon name="SlidersHorizontal" size={20} />
        </Button>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 320 }}
        exit={{ width: 0 }}
        className="flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden"
      >
        <div className="p-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ApperIcon name="SlidersHorizontal" size={20} className="text-blue-600" />
              <h2 className="font-semibold text-gray-900">Filters & Views</h2>
            </div>
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="sm"
            >
              <ApperIcon name="X" size={16} />
            </Button>
          </div>

          {/* Smart Views */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Smart Views</h3>
            <div className="space-y-1">
              {Object.entries(smartViews).map(([id, view]) => (
                <motion.button
                  key={id}
                  onClick={() => handleSmartViewClick(id)}
                  whileHover={{ x: 4 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors",
                    activeSmartView === id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <ApperIcon 
                    name={view.icon} 
                    size={16} 
                    className={activeSmartView === id ? "text-blue-600" : "text-gray-500"} 
                  />
                  <span className="text-sm font-medium">{view.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Saved Filters</h3>
                <span className="text-xs text-gray-500">{savedFilters.length}</span>
              </div>
              <div className="space-y-1">
                {savedFilters.slice(0, 5).map((filter) => (
                  <motion.div
                    key={filter.Id}
                    whileHover={{ x: 4 }}
                    className="flex items-center group"
                  >
                    <button
                      onClick={() => handleSavedFilterClick(filter)}
                      className="flex-1 flex items-center gap-3 px-3 py-2 text-left rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ApperIcon name="Filter" size={14} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{filter.name}</div>
                        {filter.usageCount > 0 && (
                          <div className="text-xs text-gray-500">Used {filter.usageCount} times</div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleDeleteFilter(filter.Id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                    >
                      <ApperIcon name="Trash2" size={14} className="text-red-500" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowSaveModal(true)}
              disabled={!hasActiveFilters}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <ApperIcon name="Save" size={16} />
              Save Current Filters
            </Button>

            {hasActiveFilters && (
              <Button
                onClick={clearAllFilters}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                size="sm"
              >
                <ApperIcon name="X" size={16} />
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters</h3>
              <div className="space-y-1">
                {Object.entries(filters).map(([key, value]) => (
                  <div key={key} className="text-xs text-gray-600">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Save Filter Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Name
              </label>
              <Input
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Enter filter name..."
                className="w-full"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveFilter}
                disabled={loading || !saveFilterName.trim()}
                className="flex-1"
              >
                {loading ? 'Saving...' : 'Save Filter'}
              </Button>
              <Button
                onClick={() => setShowSaveModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default FilterPanel