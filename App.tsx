import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './services/DataContext';
import { MentorDashboard } from './components/MentorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentView } from './components/StudentView';
import { Role } from './types';
import { StudentLogin } from './components/auth/student/StudentLogin';
import { StudentSignup } from './components/auth/student/StudentSignup';
import { StudentApprovalRequest } from './components/auth/student/StudentApprovalRequest';
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
  const { currentUser, isAuthenticated, isLoading } = useData();
  const location = useLocation();

  // On first load, wait for auth to resolve before making redirect decisions
  if (isLoading) {
    return null;
  }

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

  return (
    <>
      <BrowserRouter>
        {isAuthenticated && <RoleSync />}
        <Routes>
          {/* Isolated Auth Paths */}
          {/* Students */}
          <Route path="/welcome/students" element={!isAuthenticated ? <StudentWelcome /> : <Navigate to="/" replace />} />
          <Route path="/welcome/students/login" element={!isAuthenticated ? <StudentLogin /> : <Navigate to="/" replace />} />
          <Route path="/welcome/students/signup" element={!isAuthenticated ? <StudentSignup /> : <Navigate to="/" replace />} />
          <Route path="/welcome/students/signup/approval_request" element={<StudentApprovalRequest />} />
          
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

      {/* Loading Overlay - Beautiful Running Pastel Gradient */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden animate-fade-in pastel-mesh shadow-2xl">
          {/* Central Spinner */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="dot-spinner" style={{ '--uib-color': '#1E293B' } as any}>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
              <div className="dot-spinner__dot"></div>
            </div>
            
            <span className="text-[12px] font-black text-slate-800 tracking-[0.4em] uppercase opacity-75 animate-pulse">
              Loading
            </span>
          </div>

          {/* Minimal Glass Element for Depth */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
        </div>
      )}
    </>
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