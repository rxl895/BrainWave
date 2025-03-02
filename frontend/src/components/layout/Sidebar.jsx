import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Settings } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen w-64 bg-[#F7EFE5] flex flex-col">
      {/* Logo */}
      <div className="p-4">
        <Link to="/dash">
          <img src="/Users/andrewxue/Documents/BrainWaveAI/frontend/logo.png" alt="BrainWave" className="w-16 h-16" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/dash"
              className={`block px-4 py-2 rounded-lg ${
                isActive('/dash')
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/calendar"
              className={`block px-4 py-2 rounded-lg ${
                isActive('/calendar')
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              Calendar
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 bg-gray-200 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
              {user?.user_metadata?.full_name?.[0] || 'U'}
            </div>
            <span className="ml-3 text-gray-700">
              {user?.user_metadata?.full_name || 'Username'}
            </span>
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}; 