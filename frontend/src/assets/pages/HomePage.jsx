import React from 'react';
import { BookOpen, Users, Video, Calendar, Award, Brain } from 'lucide-react';
import { LoginButton } from '../../components/auth/LoginButton';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const HomePage = () => {
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  if (user) {
    return <Navigate to="/dash" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Welcome to BrainWave
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Your collaborative learning platform for better study experiences
        </p>
        <div className="flex justify-center gap-4">
          <button className="rounded-lg border border-purple-600 px-6 py-3 text-purple-600 hover:bg-purple-50">
            Learn More
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
          Key Features
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-8 w-8 text-purple-600" />}
            title="Study Group Management"
            description="Create and join public or private study groups with role-based access control"
          />
          <FeatureCard
            icon={<Video className="h-8 w-8 text-purple-600" />}
            title="Real-Time Collaboration"
            description="Connect with peers through video calls, chat, and interactive whiteboards"
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-purple-600" />}
            title="Smart Scheduling"
            description="Organize study sessions and receive automated reminders"
          />
          <FeatureCard
            icon={<BookOpen className="h-8 w-8 text-purple-600" />}
            title="Resource Sharing"
            description="Share and organize study materials with easy tagging and search"
          />
          <FeatureCard
            icon={<Award className="h-8 w-8 text-purple-600" />}
            title="Gamification"
            description="Track progress and earn badges for consistent engagement"
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8 text-purple-600" />}
            title="AI Recommendations"
            description="Get personalized study material suggestions and practice questions"
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-purple-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to Transform Your Study Experience?
          </h2>
          <p className="mb-8 text-lg text-purple-100">
            Join thousands of students already using BrainWave to achieve their academic goals
          </p>
          <LoginButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© 2025 BrainWave. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <a href="#" className="hover:text-purple-600">Terms</a>
            <a href="#" className="hover:text-purple-600">Privacy</a>
            <a href="#" className="hover:text-purple-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg transition-transform hover:scale-105">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default HomePage;