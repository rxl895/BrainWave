import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './assets/pages/HomePage';
import DashboardPage from './assets/pages/DashboardPage';
import { AuthCallback } from './components/auth/AuthCallback';
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dash" element={<DashboardPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;