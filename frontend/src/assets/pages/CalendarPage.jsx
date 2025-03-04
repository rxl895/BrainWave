import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const CalendarPage = () => {
  const { user } = useAuth();
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // Get the Google access token from Supabase
    const getAccessToken = async () => {
      const { data: { provider_token }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      setAccessToken(provider_token);
    };

    getAccessToken();

    // Load the Google Calendar API
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', initClient);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  const initClient = () => {
    window.gapi.client.init({
    }).then(() => {
      // Set the access token from Supabase
      window.gapi.client.setToken({
        access_token: accessToken
      });
      setCalendarLoaded(true);
    }).catch(error => {
      console.error('Error initializing Google Calendar:', error);
    });
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-2">Manage your study sessions and events</p>
        </div>

        {/* Calendar Container */}
        <div className="bg-white rounded-lg shadow-lg p-6 min-h-[600px]">
          {calendarLoaded ? (
            <iframe
              src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(user?.email)}&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&showTz=1&height=600`}
              style={{ border: 0 }}
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CalendarPage; 