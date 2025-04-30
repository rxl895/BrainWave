# BrainWave

## 📌 Overview
The **Virtual Study Group Platform** is a web-based application designed to facilitate collaborative learning among students. It provides tools for managing study groups, real-time communication, scheduling, and resource sharing to enhance peer-to-peer learning experiences.

## 🛠️ Development Journey
Our project underwent a significant architectural transformation during development. Initially, we built our backend using Python with Flask, managing authentication and data storage through traditional SQL databases. However, as our needs for real-time features and scalable authentication grew, we made the strategic decision to migrate to Supabase.

This transition from Python to Supabase presented both challenges and opportunities:
- **Language Shift**: Moving from Python to TypeScript/JavaScript required our team to adapt and expand our skillset
- **Architecture Evolution**: Switching to Supabase's backend-as-a-service model streamlined our development process and improved our real-time capabilities
- **Learning Experience**: The migration process taught us valuable lessons about:
  - Database schema design and migration strategies
  - The importance of flexible, maintainable architecture
  - Modern authentication and authorization practices
  - Real-time data synchronization patterns

This pivot, while challenging, ultimately strengthened our application's foundation and provided our team with invaluable experience in adapting to evolving project requirements.

## 🚀 Features
- **Study Group Management**: Create and manage public or private study groups with role-based access.
- **Real-time Communication**: Integrated chat, file sharing, and video conferencing using WebRTC.
- **Scheduling & Notifications**: Shared calendar, event reminders, and study session scheduling.
- **Resource Sharing**: Upload and organize study materials with tagging and search functionality.
- **Interactive Tools**: Virtual whiteboard and quizzes for engaging discussions.


## 🛠️ Technology Stack
- **Frontend**: React.js with Vite, TailwindCSS
- **Backend**: Supabase
- **Database**: MongoDB (NoSQL) / PostgreSQL (Relational)
- **Testing**: Vitest, Manual Testing for frontend features
- **Other Technologies**: WebRTC (Real-time communication), OAuth 2.0 (Authentication), AWS/Heroku (Cloud Deployment)

## 📂 Project Structure

Key Directories and Files:

### Frontend
- `src/components/`: Contains all React components
- `src/contexts/`: React Context providers for state management
- `src/services/`: API integration and external service handlers
- `src/lib/`: Utility functions and helper methods
- `src/types/`: TypeScript type definitions
- `src/__tests__/`: Test suites and test utilities
- `src/assets/`: Static assets like images and fonts

### Database Schema
Our SQL schema files define the database structure that was migrated to Supabase:
- `file_storage.sql`: Defines tables and relations for file management system
- `messages.sql`: Schema for the messaging and communication features
- `auto_add_creator.sql`: Handles user creation and role assignment logic

These SQL files serve as valuable documentation of our data structure, which we've implemented in Supabase. They outline our:
- Table relationships
- Data types and constraints
- Access control policies
- Trigger functions for automated actions

## ⚡ Installation & Setup
1. **Clone the Repository**  
   ```bash
   git clone https://github.com/rxl895/BrainWave
   cd BrainWave
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev    # Start development server
   ```

**Supabase Setup**
   - Create a new project on [Supabase](https://supabase.com)
   - Run the SQL scripts provided in the repository to set up your database schema
   - Set up authentication providers in your Supabase dashboard
   - Configure storage buckets for file uploads

## 🔧 Configuration
Create a `.env` file in the frontend directory with the following variables:
```env
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:5173    # Your frontend URL
```

Required Supabase Configuration:
1. **Authentication Settings**
   - Enable the authentication providers you want to use (Email, Google, etc.)
   - Configure password policies and email templates

2. **Database Settings**
   - Set up Row Level Security (RLS) policies
   - Configure real-time subscription settings

3. **Storage Settings**
   - Create storage buckets for user uploads
   - Configure CORS policies

## 🧪 Testing
```bash
# Run frontend tests
cd frontend
npm vitest
```

Our testing focuses on:
- React component functionality
- Supabase integration
- State management
- User interactions
- Real-time feature behavior

Backend testing is handled by Supabase's infrastructure, which includes:
- Database integrity
- Authentication flows
- API endpoint reliability
- Real-time subscription stability
- Storage operations

## 🚀 Future Deployment Plans

### Frontend Deployment Options
Our React frontend can be deployed through several potential platforms:

1. **Vercel (Recommended)**
   - Optimal for React applications
   - Built-in CI/CD pipeline
   - Automatic HTTPS
   - Easy environment variable management
   - Free tier available for small projects

2. **Netlify**
   - Simple deployment process
   - Automatic builds from Git
   - Free SSL certificates
   - Good developer experience
   - Competitive free tier

3. **GitHub Pages**
   - Free hosting
   - Direct integration with our repository
   - Simple static file hosting
   - Requires minimal configuration

When we're ready to deploy, we'll need to:
1. Choose a hosting platform
2. Configure environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=your_production_url
   ```
3. Configure custom domain (optional)

### Backend Infrastructure
Our backend is already deployed and managed by Supabase, providing:
- Scalable database
- Authentication services
- Real-time subscriptions
- File storage
- Automatic backups




