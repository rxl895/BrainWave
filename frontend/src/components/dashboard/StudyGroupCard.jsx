import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock, Unlock } from 'lucide-react';

export const StudyGroupCard = ({ group }) => {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          {group.name}
          {group.is_private ? (
            <Lock className="w-4 h-4 text-gray-500" />
          ) : (
            <Unlock className="w-4 h-4 text-gray-500" />
          )}
        </h3>
      </div>
      
      {group.subject && (
        <div className="inline-block px-3 py-1 mb-3 text-sm bg-purple-100 text-purple-800 rounded-full">
          {group.subject}
        </div>
      )}
      
      <p className="text-gray-600 mb-4 line-clamp-2">
        {group.description || "No description provided"}
      </p>
      
      <div className="flex items-center text-gray-500 text-sm">
        <Users className="w-4 h-4 mr-1" />
        <span>{group.max_participants} max participants</span>
      </div>
    </Link>
  );
};