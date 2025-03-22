import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './assets/pages/HomePage';
import DashboardPage from './assets/pages/DashboardPage';
import CalendarPage from './assets/pages/CalendarPage';
import StudyGroupPage from './assets/pages/StudyGroupPage';
import { AuthCallback } from './components/auth/AuthCallback';
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dash" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/groups/:id" element={<StudyGroupPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;