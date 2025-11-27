import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TaskEditModal from '@/components/molecules/TaskEditModal';
import { taskService } from '@/services/api/taskService';
import toast from '@/utils/toast';

function TaskCreate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      const templateId = location.state?.templateId;
      if (templateId) {
        try {
          const templateData = await taskService.getTemplateById(templateId);
          setTemplate(templateData);
        } catch (error) {
          console.error('Failed to fetch template:', error);
          toast.error('Failed to load template data');
        }
      }
    };

    fetchTemplate();
  }, [location.state]);

  const handleSave = async (formData) => {
    try {
      setIsLoading(true);
      await taskService.create(formData);
      toast.success('Task created successfully! 🎉');
      navigate('/');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/templates');
  };

  return (
    <TaskEditModal
      isOpen={true}
      onClose={handleClose}
      task={null}
      template={template}
      onSave={handleSave}
      isLoading={isLoading}
    />
  );
}

export default TaskCreate;