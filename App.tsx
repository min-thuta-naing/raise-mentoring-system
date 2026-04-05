import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DataProvider, useData } from './services/DataContext';
import { MentorDashboard } from './components/MentorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentView } from './components/StudentView';
import { Role } from './types';

/**
 * Syncs the current user role with the URL path.
 * This ensures that if a user manually navigates to /admin, /mentor, or /student,
 * the application context (mock database) updates correctly.
 */
const RoleSync: React.FC = () => {
  const { currentUser, switchRole } = useData();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.split('/')[1];
    if (path === 'admin' && currentUser.role !== Role.ADMIN) {
      switchRole(Role.ADMIN);
    } else if (path === 'mentor' && currentUser.role !== Role.MENTOR) {
      switchRole(Role.MENTOR);
    } else if (path === 'student' && currentUser.role !== Role.STUDENT) {
      switchRole(Role.STUDENT);
    }
  }, [location.pathname, currentUser.role, switchRole]);

  return null;
};

const AppContent: React.FC = () => {
  const { currentUser } = useData();

  return (
    <BrowserRouter>
      <RoleSync />
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/mentor/*" element={<MentorDashboard />} />
        <Route path="/student/*" element={<StudentView />} />
        {/* Default redirect to the current user's role path */}
        <Route path="/" element={<Navigate to={`/${currentUser.role.toLowerCase()}`} replace />} />
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