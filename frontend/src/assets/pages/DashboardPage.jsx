import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Video, BookOpen, Calendar, Trophy, TrendingUp, Clock } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  // Mock data - would come from API in real implementation
  // const { data: sessions } = useQuery('upcomingSessions', fetchSessions);
  const upcomingSessions = [
    {
      id: 1,
      title: 'Calculus Study Session',
      date: '2025-02-15T14:00:00',
      groupName: 'Advanced Mathematics',
      participants: 5
    },
    {
      id: 2,
      title: 'Physics Lab Prep',
      date: '2025-02-16T15:30:00',
      groupName: 'Physics 101',
      participants: 3
    }
  ];

  const myGroups = [
    {
      id: 1,
      name: 'Advanced Mathematics',
      members: 12,
      nextSession: '2025-02-15T14:00:00'
    },
    {
      id: 2,
      name: 'Physics 101',
      members: 8,
      nextSession: '2025-02-16T15:30:00'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'note',
      description: 'New study materials uploaded to Physics 101',
      timestamp: '2025-02-14T10:30:00'
    },
    {
      id: 2,
      type: 'session',
      description: 'Completed 2-hour study session with Advanced Mathematics',
      timestamp: '2025-02-13T16:00:00'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Student!</h1>
        <p className="text-gray-600">Here's what's happening in your study groups</p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Users className="h-6 w-6 text-purple-600" />}
          title="Active Groups"
          value="2"
          description="Currently participating"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-purple-600" />}
          title="Study Hours"
          value="24"
          description="This month"
        />
        <StatCard
          icon={<Trophy className="h-6 w-6 text-purple-600" />}
          title="Achievement Points"
          value="450"
          description="Level 3 Scholar"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
            <button className="text-sm text-purple-600 hover:text-purple-700">View All</button>
          </div>
          <div className="space-y-4">
            {upcomingSessions.map(session => (
              <div key={session.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-gray-600">{session.groupName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.date).toLocaleString()}
                  </p>
                </div>
                <button className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Study Groups */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">My Study Groups</h2>
            <button className="text-sm text-purple-600 hover:text-purple-700">View All</button>
          </div>
          <div className="space-y-4">
            {myGroups.map(group => (
              <div key={group.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <span className="text-sm text-gray-500">{group.members} members</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Next session: {new Date(group.nextSession).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-white p-6 shadow-lg lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-sm text-purple-600 hover:text-purple-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-center space-x-4 rounded-lg border p-4">
                <div className="rounded-full bg-purple-100 p-2">
                  {activity.type === 'note' ? (
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Video className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button 
            onClick={() => navigate('/')}
            className="rounded-lg bg-white px-8 py-3 text-purple-600 hover:bg-purple-50"
          >
            Home
        </button>
    </div>
  );
};

const StatCard = ({ icon, title, value, description }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-purple-100 p-3">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;