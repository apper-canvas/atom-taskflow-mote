import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";

const QuickAddTask = ({ onAddTask, onOpenSubtaskModal, isLoading = false }) => {
  const [title, setTitle] = useState("")
const [category, setCategory] = useState("Personal")
  const [priority, setPriority] = useState("Medium")
  const [status, setStatus] = useState("Not Started")
  const [isExpanded, setIsExpanded] = useState(false)

const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    await onAddTask({
title: title.trim(),
      category,
      priority,
      status,
      description: ""
    })

    // Reset all form fields to defaults
    setTitle("")
    setCategory("Personal")
    setPriority("Medium") 
    setStatus("Not Started")
    setIsExpanded(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    if (e.key === "Escape") {
      setIsExpanded(false)
      setTitle("")
    }
  }

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <ApperIcon name="Plus" size={18} className="text-white" />
            </div>
            
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="border-0 bg-transparent text-base focus:ring-0 px-0 placeholder:text-gray-500"
                disabled={isLoading}
              />
            </div>

{title.trim() && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="shadow-sm"
                >
                  {isLoading ? (
                    <ApperIcon name="Loader2" size={16} className="animate-spin" />
                  ) : (
                    <ApperIcon name="Plus" size={16} />
                  )}
                  Add
                </Button>
                
                {onOpenSubtaskModal && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // First create the main task, then open subtask modal
                      const handleCreateWithSubtask = async () => {
                        const taskData = {
                          title: title.trim(),
                          category,
                          priority,
                          status,
                          description: ""
                        };
                        const newTask = await onAddTask(taskData);
                        if (newTask && newTask.Id) {
                          onOpenSubtaskModal({ parentTaskId: newTask.Id });
                        }
                        // Reset form
                        setTitle("");
                        setCategory("Personal");
                        setPriority("Medium");
                        setStatus("Not Started");
                        setIsExpanded(false);
                      };
                      handleCreateWithSubtask();
                    }}
                    disabled={isLoading}
                    className="shadow-sm text-green-600 hover:text-green-800 border-green-200 hover:border-green-300 hover:bg-green-50"
                    title="Create task and add subtask"
                  >
                    <ApperIcon name="Plus" size={16} />
                    <ApperIcon name="ArrowRight" size={12} className="ml-1" />
                    Add subtask
                  </Button>
                )}
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="text-sm"
                    >
<option value="Personal">🏠 Personal</option>
                      <option value="Work">💼 Work</option>
                      <option value="Other">📂 Other</option>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="text-sm"
                    >
<option value="Urgent">🚨 Urgent</option>
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </Select>
                  </div>

                  <div>
                    <Select
                      label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
disabled={isLoading}
                    >
                      <option value="Not Started">⏸️ Not Started</option>
                      <option value="In Progress">🔄 In Progress</option>
                      <option value="Completed">✅ Completed</option>
                      <option value="On Hold">⏸️ On Hold</option>
                      <option value="Cancelled">❌ Cancelled</option>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  )
}

export default QuickAddTask