import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { teamService } from '@/services/api/teamService';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import Empty from '@/components/ui/Empty';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import toast from '@/utils/toast';

const TeamList = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await teamService.getAll();
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams:', err);
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (teamId) => {
    try {
      const result = await teamService.toggleFavorite(teamId);
      setTeams(prev => prev.map(team => 
        team.Id === teamId 
          ? { ...team, isFavorite: result.isFavorite }
          : team
      ));
      toast.success(result.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      toast.error(err.message || 'Failed to update favorite');
    }
  };

  const handleArchiveTeam = async (teamId) => {
    if (!confirm('Are you sure you want to archive this team?')) return;
    
    try {
      await teamService.archiveTeam(teamId);
      setTeams(prev => prev.map(team => 
        team.Id === teamId 
          ? { ...team, isArchived: true }
          : team
      ));
      toast.success('Team archived successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to archive team');
    }
  };

  // Filter teams based on search and filters
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || team.type === selectedType;
    const matchesArchived = showArchived || !team.isArchived;
    
    return matchesSearch && matchesType && matchesArchived;
  });

  const teamTypes = [...new Set(teams.map(team => team.type))];

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadTeams} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-1">Collaborate and manage projects together</p>
            </div>
            <Button
              onClick={() => navigate('/teams/create')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <ApperIcon name="Plus" size={18} />
              Create Team
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              {teamTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-archived"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="show-archived" className="text-sm text-gray-700">
                Show archived teams
              </label>
            </div>
          </div>
        </motion.div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <Empty
            title="No teams found"
            description={searchTerm || selectedType !== 'all' ? 
              "Try adjusting your search or filters" : 
              "Create your first team to start collaborating"
            }
            action={
              <Button
                onClick={() => navigate('/teams/create')}
                className="mt-4"
              >
                <ApperIcon name="Plus" size={16} className="mr-2" />
                Create Team
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team, index) => (
              <TeamCard
                key={team.Id}
                team={team}
                index={index}
                onToggleFavorite={handleToggleFavorite}
                onArchive={handleArchiveTeam}
                onClick={() => navigate(`/teams/${team.Id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TeamCard = ({ team, index, onToggleFavorite, onArchive, onClick }) => {
  const activeMembers = team.members.filter(m => m.status === 'Active');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer ${
        team.isArchived ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: team.color + '20', color: team.color }}
          >
            {team.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
            <p className="text-sm text-gray-500">{team.type}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(team.Id);
            }}
            className={`p-1 rounded ${team.isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
          >
            <ApperIcon name={team.isFavorite ? "Star" : "Star"} size={16} />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {team.description || 'No description provided'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {team.stats.activeTasks}
          </div>
          <div className="text-xs text-gray-500">Active Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {team.stats.activeMembers}
          </div>
          <div className="text-xs text-gray-500">Members</div>
        </div>
      </div>

      {/* Members Preview */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {activeMembers.slice(0, 4).map((member, idx) => (
            <div
              key={member.Id}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              title={member.name}
            >
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
          ))}
          {activeMembers.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
              +{activeMembers.length - 4}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={team.privacy === 'Private' ? 'secondary' : 'primary'} size="sm">
            {team.privacy}
          </Badge>
          {team.isArchived && (
            <Badge variant="warning" size="sm">Archived</Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TeamList;