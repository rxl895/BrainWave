import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import DashboardPage from './assets/pages/HomePage.jsx';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardPage />
    </div>
  );
};

export default App
