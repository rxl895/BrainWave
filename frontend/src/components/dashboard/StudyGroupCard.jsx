import React from 'react';
import { Link } from 'react-router-dom';

export const StudyGroupCard = ({ group }) => {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {group.name || 'Title'}
      </h3>
      <p className="text-gray-600">
        {group.description ||
          "Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."}
      </p>
    </Link>
  );
};