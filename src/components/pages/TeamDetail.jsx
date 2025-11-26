import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { teamService } from '@/services/api/teamService';
import { taskService } from '@/services/api/taskService';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import MemberCard from '@/components/molecules/MemberCard';
import TaskList from '@/components/organisms/TaskList';
import TaskEditModal from '@/components/molecules/TaskEditModal';
import TeamMemberModal from '@/components/molecules/TeamMemberModal';
import ActivityFeed from '@/components/molecules/ActivityFeed';
import TeamStats from '@/components/molecules/TeamStats';
import toast from '@/utils/toast';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [teamTasks, setTeamTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // View state
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadTeamData();
    }
  }, [id]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [teamData, tasksData, activitiesData] = await Promise.all([
        teamService.getById(id),
        taskService.getByTeam(id), // This would be a new method in taskService
        teamService.getTeamActivity(id)
      ]);
      
      setTeam(teamData);
      setTeamTasks(tasksData || []);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await teamService.toggleFavorite(id);
      setTeam(prev => ({ ...prev, isFavorite: result.isFavorite }));
      toast.success(result.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      toast.error(err.message || 'Failed to update favorite');
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await teamService.removeMember(id, memberId);
      await loadTeamData(); // Reload to update stats
      toast.success('Member removed successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleMemberModalSuccess = async () => {
    await loadTeamData();
    setIsMemberModalOpen(false);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskId, taskData) => {
    try {
      if (taskId) {
        await taskService.update(taskId, { ...taskData, teamId: parseInt(id) });
      } else {
        await taskService.create({ ...taskData, teamId: parseInt(id) });
      }
      await loadTeamData();
      setIsTaskModalOpen(false);
      toast.success(taskId ? 'Task updated successfully' : 'Task created successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.delete(taskId);
      await loadTeamData();
      setIsTaskModalOpen(false);
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete task');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadTeamData} />;
  if (!team) return <ErrorView message="Team not found" onRetry={() => navigate('/teams')} />;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'Home' },
    { id: 'tasks', name: 'Tasks', icon: 'CheckSquare' },
    { id: 'members', name: 'Members', icon: 'Users' },
    { id: 'activity', name: 'Activity', icon: 'Activity' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/teams')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ApperIcon name="ArrowLeft" size={20} />
            </button>
            
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
              style={{ backgroundColor: team.color + '20', color: team.color }}
            >
              {team.icon}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1 rounded ${team.isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                >
                  <ApperIcon name="Star" size={20} />
                </button>
                <Badge variant={team.privacy === 'Private' ? 'secondary' : 'primary'}>
                  {team.privacy}
                </Badge>
              </div>
              <p className="text-gray-600 mt-1">{team.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>Created {format(new Date(team.createdAt), 'MMM d, yyyy')}</span>
                <span>•</span>
                <span>{team.type} Team</span>
                <span>•</span>
                <span>{team.stats.totalMembers} members</span>
              </div>
            </div>

            <Button
              onClick={handleAddMember}
              className="flex items-center gap-2"
            >
              <ApperIcon name="UserPlus" size={16} />
              Add Member
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ApperIcon name={tab.icon} size={16} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <TeamStats team={team} tasks={teamTasks} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <ActivityFeed activities={activities.slice(0, 5)} />
                  {activities.length > 5 && (
                    <button
                      onClick={() => setActiveTab('activity')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
                    >
                      View all activity →
                    </button>
                  )}
                </div>

                {/* Team Members Preview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                    <button
                      onClick={() => setActiveTab('members')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {team.members.slice(0, 4).map(member => (
                      <div key={member.Id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <Badge 
                          variant={member.status === 'Active' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {member.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Team Tasks</h2>
                <Button onClick={handleCreateTask}>
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  New Task
                </Button>
              </div>
              
              <TaskList
                tasks={teamTasks}
                onEdit={handleEditTask}
                onToggleComplete={(taskId, completed) => {
                  // Handle task completion
                  taskService.update(taskId, { status: completed ? 'Completed' : 'In Progress' })
                    .then(() => loadTeamData())
                    .catch(err => toast.error(err.message));
                }}
              />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
                <Button onClick={handleAddMember}>
                  <ApperIcon name="UserPlus" size={16} className="mr-2" />
                  Add Member
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.members.map(member => (
                  <MemberCard
                    key={member.Id}
                    member={member}
                    onEdit={handleEditMember}
                    onRemove={handleRemoveMember}
                    canEdit={true} // This would be based on current user permissions
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Team Activity</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <ActivityFeed activities={activities} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Modals */}
        <TaskEditModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={editingTask}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          teams={[team]}
          selectedTeam={team.Id}
        />

        <TeamMemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onSuccess={handleMemberModalSuccess}
          teamId={id}
          editingMember={editingMember}
        />
      </div>
    </div>
  );
};

export default TeamDetail;