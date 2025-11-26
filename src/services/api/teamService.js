import teamsData from '@/services/mockData/teams.json';

// Mock delay for realistic API simulation
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

let teams = [...teamsData];
let nextId = Math.max(...teams.map(t => t.Id)) + 1;

export const teamService = {
  async getAll() {
    await delay(600);
    return teams.map(team => ({ ...team }));
  },

  async getById(id) {
    await delay(400);
    const team = teams.find(t => t.Id === parseInt(id));
    if (!team) {
      throw new Error('Team not found');
    }
    return { ...team };
  },

  async create(teamData) {
    await delay(800);
    
    const newTeam = {
      Id: nextId++,
      name: teamData.name,
      description: teamData.description || '',
      icon: teamData.icon || '👥',
      color: teamData.color || '#3b82f6',
      type: teamData.type || 'Project',
      privacy: teamData.privacy || 'Private',
      ownerId: teamData.ownerId || 1,
      members: teamData.members || [
        {
          Id: 1,
          name: "You",
          email: "you@example.com",
          role: "Owner",
          avatar: null,
          joinedAt: new Date().toISOString(),
          status: "Active"
        }
      ],
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        activeTasks: 0,
        overdueTasks: 0,
        totalMembers: teamData.members?.length || 1,
        activeMembers: teamData.members?.filter(m => m.status === 'Active').length || 1
      },
      settings: {
        allowMemberInvites: true,
        requireApprovalForTasks: false,
        defaultTaskPriority: 'Medium',
        notificationsEnabled: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
      isFavorite: false
    };

    teams.push(newTeam);
    return { ...newTeam };
  },

  async update(id, updates) {
    await delay(600);
    
    const teamIndex = teams.findIndex(t => t.Id === parseInt(id));
    if (teamIndex === -1) {
      throw new Error('Team not found');
    }

    teams[teamIndex] = {
      ...teams[teamIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return { ...teams[teamIndex] };
  },

  async delete(id) {
    await delay(500);
    
    const teamIndex = teams.findIndex(t => t.Id === parseInt(id));
    if (teamIndex === -1) {
      throw new Error('Team not found');
    }

    teams.splice(teamIndex, 1);
    return { success: true };
  },

  async addMember(teamId, memberData) {
    await delay(700);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if member already exists
    const existingMember = team.members.find(m => m.email === memberData.email);
    if (existingMember) {
      throw new Error('Member already exists in this team');
    }

    const newMember = {
      Id: Math.max(...team.members.map(m => m.Id), 0) + 1,
      name: memberData.name,
      email: memberData.email,
      role: memberData.role || 'Member',
      avatar: memberData.avatar || null,
      joinedAt: new Date().toISOString(),
      status: 'Pending',
      invitedBy: memberData.invitedBy || 1
    };

    team.members.push(newMember);
    team.stats.totalMembers = team.members.length;
    team.updatedAt = new Date().toISOString();

    return { ...newMember };
  },

  async removeMember(teamId, memberId) {
    await delay(500);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    const memberIndex = team.members.findIndex(m => m.Id === parseInt(memberId));
    if (memberIndex === -1) {
      throw new Error('Member not found');
    }

    // Prevent removing the owner
    if (team.members[memberIndex].role === 'Owner') {
      throw new Error('Cannot remove team owner');
    }

    team.members.splice(memberIndex, 1);
    team.stats.totalMembers = team.members.length;
    team.stats.activeMembers = team.members.filter(m => m.status === 'Active').length;
    team.updatedAt = new Date().toISOString();

    return { success: true };
  },

  async updateMemberRole(teamId, memberId, newRole) {
    await delay(600);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => m.Id === parseInt(memberId));
    if (!member) {
      throw new Error('Member not found');
    }

    // Prevent changing owner role
    if (member.role === 'Owner' && newRole !== 'Owner') {
      throw new Error('Cannot change owner role');
    }

    member.role = newRole;
    team.updatedAt = new Date().toISOString();

    return { ...member };
  },

  async getTeamMembers(teamId) {
    await delay(400);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    return team.members.map(member => ({ ...member }));
  },

  async getTeamActivity(teamId, limit = 20) {
    await delay(500);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    // Mock activity data - in real app this would come from an activity log
    const activities = [
      {
        Id: 1,
        type: 'task_created',
        message: 'created a new task "Design Homepage"',
        user: { name: 'Sarah Johnson', avatar: null },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { taskId: 101, taskTitle: 'Design Homepage' }
      },
      {
        Id: 2,
        type: 'member_joined',
        message: 'joined the team',
        user: { name: 'Mike Chen', avatar: null },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      },
      {
        Id: 3,
        type: 'task_completed',
        message: 'completed task "Setup Development Environment"',
        user: { name: 'John Smith', avatar: null },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        metadata: { taskId: 98, taskTitle: 'Setup Development Environment' }
      },
      {
        Id: 4,
        type: 'comment_added',
        message: 'commented on "API Integration"',
        user: { name: 'Lisa Wong', avatar: null },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        metadata: { taskId: 105, taskTitle: 'API Integration', comment: 'Looking good so far!' }
      },
      {
        Id: 5,
        type: 'task_assigned',
        message: 'assigned "Database Migration" to Mike Chen',
        user: { name: 'Sarah Johnson', avatar: null },
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        metadata: { taskId: 107, taskTitle: 'Database Migration', assignedTo: 'Mike Chen' }
      }
    ];

    return activities.slice(0, limit);
  },

  async updateTeamSettings(teamId, settings) {
    await delay(600);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    team.settings = { ...team.settings, ...settings };
    team.updatedAt = new Date().toISOString();

    return { ...team.settings };
  },

  async toggleFavorite(teamId) {
    await delay(300);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    team.isFavorite = !team.isFavorite;
    team.updatedAt = new Date().toISOString();

    return { isFavorite: team.isFavorite };
  },

  async archiveTeam(teamId) {
    await delay(500);
    
    const team = teams.find(t => t.Id === parseInt(teamId));
    if (!team) {
      throw new Error('Team not found');
    }

    team.isArchived = true;
    team.updatedAt = new Date().toISOString();

    return { ...team };
  }
};

export default teamService;