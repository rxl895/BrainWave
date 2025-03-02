import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { StudyGroupCard } from '../../components/dashboard/StudyGroupCard';
import { supabase } from '../../lib/supabase';

const DashboardPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a Course"
              className="pl-10 pr-4 py-2 rounded-full bg-purple-50 border-none w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
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
                <StudyGroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;