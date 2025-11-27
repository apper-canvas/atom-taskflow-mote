import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { projectService } from "@/services/api/projectService";
import { taskService } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Badge from "@/components/atoms/Badge";
import TemplateCreateModal from "@/components/molecules/TemplateCreateModal";
import TemplateLibrary from "@/components/molecules/TemplateLibrary";
import toast from "@/utils/toast";

const Templates = () => {
  const [taskTemplates, setTaskTemplates] = useState([])
  const [projectTemplates, setProjectTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("tasks")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [categories, setCategories] = useState([])
  const [projectCategories, setProjectCategories] = useState([])

  useEffect(() => {
    loadTemplates()
  }, [])

const loadTemplates = async () => {
    try {
      setError("")
      const [taskTemplateData, projectTemplateData, taskCategoryData, projectCategoryData] = await Promise.all([
        taskService.getTemplates(),
        projectService.getTemplates(),
        taskService.getTemplateCategories(),
        projectService.getTemplateCategories()
      ])
      
      setTaskTemplates(taskTemplateData)
      setProjectTemplates(projectTemplateData)
      setCategories(taskCategoryData)
      setProjectCategories(projectCategoryData)
    } catch (err) {
      console.error("Failed to load templates:", err)
      setError(err.message || "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (templateData) => {
    try {
      if (activeTab === "tasks") {
        const newTemplate = await taskService.createTemplate(templateData)
        setTaskTemplates(prev => [newTemplate, ...prev])
toast.success("Task template created successfully! 🎉")
      } else {
        const newTemplate = await projectService.createTemplate(templateData)
        setProjectTemplates(prev => [newTemplate, ...prev])
toast.success("Project template created successfully! 🎉")
      }
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error("Failed to create template:", err)
toast.error("Failed to create template. Please try again.")
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      if (activeTab === "tasks") {
        await taskService.deleteTemplate(templateId)
        setTaskTemplates(prev => prev.filter(t => t.Id !== templateId))
toast.success("Template deleted successfully")
      } else {
        await projectService.deleteTemplate(templateId)
        setProjectTemplates(prev => prev.filter(t => t.Id !== templateId))
toast.success("Template deleted successfully")
      }
    } catch (err) {
      console.error("Failed to delete template:", err)
toast.error("Failed to delete template. Please try again.")
    }
  }

  const handleExportTemplates = async () => {
    try {
      const exportData = activeTab === "tasks" 
        ? await taskService.exportTemplates()
        : await projectService.exportTemplates()
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${activeTab}-templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
toast.success("Templates exported successfully! 📄")
    } catch (err) {
      console.error("Failed to export templates:", err)
toast.error("Failed to export templates. Please try again.")
    }
  }

  const handleImportTemplates = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      const imported = activeTab === "tasks"
        ? await taskService.importTemplates(importData)
        : await projectService.importTemplates(importData)
      
      if (activeTab === "tasks") {
        setTaskTemplates(prev => [...imported, ...prev])
      } else {
        setProjectTemplates(prev => [...imported, ...prev])
      }
      
toast.success(`Imported ${imported.length} templates successfully! 🎉`)
    } catch (err) {
      console.error("Failed to import templates:", err)
toast.error("Failed to import templates. Please check file format.")
    }
    
    event.target.value = '' // Reset file input
  }

  const currentTemplates = activeTab === "tasks" ? taskTemplates : projectTemplates
  const filteredTemplates = currentTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) return <Loading />
  if (error) return <ErrorView message={error} onRetry={loadTemplates} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
            <p className="text-gray-600">Create and manage reusable templates for tasks and projects</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowLibrary(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ApperIcon name="Library" size={16} />
              Browse Library
            </Button>
            
            <input
              type="file"
              accept=".json"
              onChange={handleImportTemplates}
              className="hidden"
              id="import-templates"
            />
            <Button
              onClick={() => document.getElementById('import-templates').click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ApperIcon name="Download" size={16} />
              Import
            </Button>
            
            <Button
              onClick={handleExportTemplates}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ApperIcon name="Upload" size={16} />
              Export
            </Button>
            
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <ApperIcon name="Plus" size={18} />
              New Template
            </Button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-200 w-fit"
        >
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "tasks"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <ApperIcon name="CheckSquare" size={16} className="mr-2" />
            Task Templates
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "projects"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <ApperIcon name="Folder" size={16} className="mr-2" />
            Project Templates
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={`Search ${activeTab} templates...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
<Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-48"
            >
              <option value="all">All Categories</option>
              {(activeTab === 'tasks' ? categories : projectCategories).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </div>
        </motion.div>

        {/* Template Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredTemplates.length === 0 ? (
            <Empty 
              message={searchTerm || selectedCategory !== "all" 
                ? "No templates match your filters" 
                : `No ${activeTab} templates yet`}
              actionText="Create Template"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredTemplates.map((template) => (
<TemplateCard
                    key={template.Id}
                    template={template}
                    type={activeTab}
                    onDelete={handleDeleteTemplate}
                    onUse={(templateId) => {
                      if (activeTab === "tasks") {
                        navigate('/tasks/create', { state: { templateId } });
                      } else {
                        navigate('/projects/create', { state: { templateId } });
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Template Modal */}
      <TemplateCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
        type={activeTab}
      />

      {/* Template Library */}
      <TemplateLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        type={activeTab}
      />
    </div>
  )
}

// Template Card Component
const TemplateCard = ({ template, type, onDelete, onUse }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleUse = async () => {
    try {
      setIsLoading(true)
      onUse(template.Id)
      toast.success(`Opening ${type === 'tasks' ? 'task' : 'project'} form with template data! 🎉`)
    } catch (err) {
      console.error("Failed to use template:", err)
      toast.error("Failed to use template. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{template.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
              <Badge variant="secondary" size="sm">{template.category}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleUse}
              disabled={isLoading}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Use Template"
            >
              <ApperIcon name="Play" size={14} />
            </button>
            <button
              onClick={() => onDelete(template.Id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="Delete Template"
            >
              <ApperIcon name="Trash2" size={14} />
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description || "No description provided"}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Used {template.usageCount || 0} times</span>
          {template.subtasks?.length > 0 && (
            <span>{template.subtasks.length} subtasks</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Templates