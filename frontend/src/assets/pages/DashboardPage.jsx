import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { StudyGroupCard } from '../../components/dashboard/StudyGroupCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
    max_participants: 10,
    is_private: false,
    meeting_link: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .limit(6);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .insert([
          {
            ...newGroup,
            owner_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setGroups([...groups, data]);
      setShowCreateForm(false);
      setNewGroup({
        name: '',
        description: '',
        subject: '',
        max_participants: 10,
        is_private: false,
        meeting_link: ''
      });
    } catch (error) {
      console.error('Error creating study group:', error.message);
      alert('Failed to create study group. Please try again.');
    }
  };

  const handleDeleteGroup = (groupId) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a Course"
                className="pl-10 pr-4 py-2 rounded-full bg-purple-50 border-none w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Create Study Group
            </button>
          </div>
        </div>

        {/* Study Groups Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Study Groups</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <StudyGroupCard 
                  key={group.id} 
                  group={group} 
                  onDelete={handleDeleteGroup}
                />
              ))}
            </div>
          )}
        </section>

        {/* Create Study Group Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Create Study Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={newGroup.subject}
                    onChange={(e) => setNewGroup({...newGroup, subject: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Participants</label>
                  <input
                    type="number"
                    value={newGroup.max_participants}
                    onChange={(e) => setNewGroup({...newGroup, max_participants: parseInt(e.target.value)})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    min="2"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                  <input
                    type="url"
                    value={newGroup.meeting_link}
                    onChange={(e) => setNewGroup({...newGroup, meeting_link: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_private"
                    checked={newGroup.is_private}
                    onChange={(e) => setNewGroup({...newGroup, is_private: e.target.checked})}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_private" className="ml-2 block text-sm text-gray-700">
                    Private Group
                  </label>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;