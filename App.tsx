import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './services/DataContext';
import { MentorDashboard } from './components/MentorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentView } from './components/StudentView';
import { Role } from './types';
import { StudentLogin } from './components/auth/student/StudentLogin';
import { StudentSignup } from './components/auth/student/StudentSignup';
import { MentorLogin } from './components/auth/mentor/MentorLogin';
import { MentorSignup } from './components/auth/mentor/MentorSignup';
import { AdminLogin } from './components/auth/admin/AdminLogin';
import { AdminSignup } from './components/auth/admin/AdminSignup';
import { StudentWelcome } from './components/auth/student/StudentWelcome';
import { MentorWelcome } from './components/auth/mentor/MentorWelcome';
import { AdminWelcome } from './components/auth/admin/AdminWelcome';

/**
 * Syncs the current user role with the URL path.
 * This ensures that if a user manually navigates to /admin, /mentor, or /student,
 * the application context (mock database) updates correctly.
 */
const RoleSync: React.FC = () => {
  const { currentUser, switchRole, isAuthenticated } = useData();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const path = location.pathname.split('/')[1];
    if (path === 'admin' && currentUser.role !== Role.ADMIN) {
      switchRole(Role.ADMIN);
    } else if (path === 'mentor' && currentUser.role !== Role.MENTOR) {
      switchRole(Role.MENTOR);
    } else if (path === 'student' && currentUser.role !== Role.STUDENT) {
      switchRole(Role.STUDENT);
    }
  }, [location.pathname, currentUser?.role, switchRole, isAuthenticated]);

  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: Role }> = ({ children, allowedRole }) => {
  const { currentUser, isAuthenticated } = useData();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    const path = location.pathname;
    let redirectPath = '/welcome/students';
    
    if (path.startsWith('/admin')) {
      redirectPath = '/auth/portal-secure-v8821-admin';
    } else if (path.startsWith('/mentor')) {
      redirectPath = '/welcome/mentor';
    } else if (path.startsWith('/student')) {
      redirectPath = '/welcome/students';
    }

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={`/${currentUser.role.toLowerCase()}`} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading } = useData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center font-outfit">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-b-emerald-500 rounded-full animate-spin-reverse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <RoleSync />}
      <Routes>
        {/* Isolated Auth Paths */}
        {/* Students */}
        <Route path="/welcome/students" element={!isAuthenticated ? <StudentWelcome /> : <Navigate to="/" replace />} />
        <Route path="/welcome/students/login" element={!isAuthenticated ? <StudentLogin /> : <Navigate to="/" replace />} />
        <Route path="/welcome/students/signup" element={!isAuthenticated ? <StudentSignup /> : <Navigate to="/" replace />} />
        
        {/* Mentors */}
        <Route path="/welcome/mentor" element={!isAuthenticated ? <MentorWelcome /> : <Navigate to="/" replace />} />
        <Route path="/welcome/mentor/login" element={!isAuthenticated ? <MentorLogin /> : <Navigate to="/" replace />} />
        <Route path="/welcome/mentor/signup" element={!isAuthenticated ? <MentorSignup /> : <Navigate to="/" replace />} />

        {/* Admins (Complex Path) */}
        <Route path="/auth/portal-secure-v8821-admin" element={!isAuthenticated ? <AdminWelcome /> : <Navigate to="/" replace />} />
        <Route path="/auth/portal-secure-v8821-admin/login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to="/" replace />} />
        <Route path="/auth/portal-secure-v8821-admin/enroll" element={!isAuthenticated ? <AdminSignup /> : <Navigate to="/" replace />} />
        
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRole={Role.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mentor/*" 
          element={
            <ProtectedRoute allowedRole={Role.MENTOR}>
              <MentorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/*" 
          element={
            <ProtectedRoute allowedRole={Role.STUDENT}>
              <StudentView />
            </ProtectedRoute>
          } 
        />

        {/* Default redirect based on auth status */}
        <Route 
          path="/" 
          element={
            isAuthenticated && currentUser
              ? <Navigate to={`/${currentUser.role.toLowerCase()}`} replace />
              : <Navigate to="/welcome/students" replace />
          } 
        />
        
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;