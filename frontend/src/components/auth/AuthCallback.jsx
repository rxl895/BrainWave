import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dash', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    });

    // Check if we have a pending calendar event
    const pendingEvent = localStorage.getItem('pendingCalendarEvent');
    if (pendingEvent) {
      localStorage.removeItem('pendingCalendarEvent');
      navigate('/calendar'); // Redirect back to calendar page
    }
  }, [navigate]);

  return null;
}; 