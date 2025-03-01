import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DashboardPage from './assets/pages/DashboardPage.jsx';
import HomePage from './assets/pages/HomePage.jsx';
import './App.css'


const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dash" element={<DashboardPage />} />
      </Routes>
    </div>
  );
};

export default App;