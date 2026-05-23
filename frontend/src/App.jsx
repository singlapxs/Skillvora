import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoutes';

// Pages Import
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Courses } from './pages/Courses';
import { CourseDetails } from './pages/CourseDetails';
import { WatchCourse } from './pages/WatchCourse';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          
          {/* Global Header Navigation */}
          <Navbar />
          
          {/* Main Routing Viewports */}
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />

              {/* Private Student Routes (Approved Users Only) */}
              <Route element={<ProtectedRoute adminOnly={false} />}>
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/watch/:id" element={<WatchCourse />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Private Admin-Only Routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              {/* Catch All Redirect */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>

        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
