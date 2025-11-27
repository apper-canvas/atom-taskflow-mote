import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProjectCreateModal from '@/components/molecules/ProjectCreateModal';
import { projectService } from '@/services/api/projectService';
import toast from '@/utils/toast';

function ProjectCreate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      const templateId = location.state?.templateId;
      if (templateId) {
        try {
          const templateData = await projectService.getTemplateById(templateId);
          setTemplate(templateData);
        } catch (error) {
          console.error('Failed to fetch template:', error);
          toast.error('Failed to load template data');
        }
      }
    };

    fetchTemplate();
  }, [location.state]);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      await projectService.create(formData);
      toast.success('Project created successfully! 🎉');
      navigate('/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/templates');
  };

  return (
    <ProjectCreateModal
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      template={template}
    />
  );
}

export default ProjectCreate;