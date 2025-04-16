import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import logo from '../../assets/logo.png';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="h-screen w-64 bg-[#F7EFE5] flex flex-col">
      {/* Logo */}
      <div className="p-4">
        <Link to="/dash">
          <img src={logo} alt="BrainWave" className="w-32 h-32" />
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
      <div className="p-4 bg-gray-200 mt-auto relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
              {user?.user_metadata?.full_name?.[0] || 'U'}
            </div>
            <span className="ml-3 text-gray-700">
              {user?.user_metadata?.full_name || 'Username'}
            </span>
          </div>
          <button 
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute bottom-full left-0 w-full p-2 bg-white rounded-t-lg shadow-lg border border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 