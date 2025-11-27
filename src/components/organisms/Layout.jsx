import { NavLink, Outlet, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { projectService } from "@/services/api/projectService";
import App from "@/App";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Dashboard from "@/components/pages/Dashboard";
import Templates from "@/components/pages/Templates";
const Layout = () => {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    try {
      const projects = await projectService.getAll();
      // Get the 3 most recent projects (assuming they're sorted by creation date)
      const recent = projects.slice(0, 3);
      setRecentProjects(recent);
    } catch (error) {
      console.error('Error loading recent projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'planning':
      case 'pending':
        return 'bg-orange-500';
      case 'on hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
              <p className="text-xs text-gray-500">Organize your life</p>
            </div>
          </div>
          
          <nav className="space-y-4">
            {/* Main Navigation */}
            <div className="space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <ApperIcon name="Home" size={20} />
                <span className="font-medium">Dashboard</span>
              </NavLink>
              
<NavLink
                to="/projects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <ApperIcon name="FolderOpen" size={20} />
                <span className="font-medium">Projects</span>
              </NavLink>
              
              <NavLink
                to="/templates"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <ApperIcon name="Layout" size={20} />
                <span className="font-medium">Templates</span>
              </NavLink>
              
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <ApperIcon name="Bell" size={20} />
                <span className="font-medium">Notifications</span>
              </NavLink>
            </div>

            {/* Projects Quick Access */}
            <div className="pt-4 border-t border-gray-200">
<div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Recent Projects
              </div>
              <div className="space-y-1">
                {loading ? (
                  <div className="px-3 py-1.5 text-sm text-gray-500">
                    Loading...
                  </div>
                ) : recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div 
                      key={project.Id}
                      onClick={() => handleProjectClick(project.Id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></div>
                      <span className="truncate">{project.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-1.5 text-sm text-gray-500">
                    No recent projects
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;