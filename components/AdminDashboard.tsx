import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { LayoutGrid, Calendar, CheckSquare, Settings, PenTool } from 'lucide-react';

// Shared Components
import { Layout } from './Layout';
import { MentorLogForm } from './MentorLogForm';
import { AdminProfile } from './profile/AdminProfile';

// Admin Sub-components
import { OverviewTab } from './admin/OverviewTab';
import { PlanningTab } from './admin/PlanningTab';
import { ApprovalsTab } from './admin/ApprovalsTab';
import { SetupTab } from './admin/SetupTab';

/**
 * Main Admin Dashboard Entry Point
 * Handles routing and high-level layout for the Admin portal.
 */
export const AdminDashboard: React.FC = () => {
    const { 
        logs, users, batches, modules, groups, lessonPlans,
        updateLogStatus, addUser, addBatch, addModule, updateModule, deleteModule, addGroup, updateGroup, addLessonPlan
    } = useData();
    const navigate = useNavigate();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutGrid size={18} />, path: '/admin/overview' },
        { id: 'planning', label: 'Planning', icon: <Calendar size={18} />, path: '/admin/planning' },
        { id: 'approvals', label: 'Verification', icon: <CheckSquare size={18} />, path: '/admin/approvals' },
        { id: 'entry', label: 'New Entry', icon: <PenTool size={18} />, path: '/admin/entry' },
        { id: 'setup', label: 'Configuration', icon: <Settings size={18} />, path: '/admin/setup' },
    ];

    return (
        <Layout navItems={tabs}>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage sessions, verify logs, and configure system.</p>
                    </div>
                </header>

                <main>
                    <Routes>
                        <Route path="overview" element={
                            <OverviewTab 
                                logs={logs} 
                                users={users} 
                                onNavigateToRedFlags={() => navigate('/admin/approvals')} 
                            />
                        } />
                        <Route path="planning" element={
                            <PlanningTab 
                                modules={modules}
                                users={users}
                                lessonPlans={lessonPlans}
                                onAddPlan={addLessonPlan}
                            />
                        } />
                        <Route path="approvals" element={
                            <ApprovalsTab 
                                logs={logs} 
                                users={users} 
                                modules={modules}
                                onUpdateStatus={updateLogStatus} 
                            />
                        } />
                        <Route path="entry" element={<MentorLogForm />} />
                        <Route path="setup" element={
                            <SetupTab 
                                batches={batches}
                                modules={modules}
                                groups={groups}
                                users={users}
                                onAddBatch={addBatch}
                                onAddModule={addModule}
                                onUpdateModule={updateModule}
                                onDeleteModule={deleteModule}
                                onAddUser={addUser}
                                onAddGroup={addGroup}
                                onUpdateGroup={updateGroup}
                            />
                        } />
                        <Route path="profile" element={<AdminProfile />} />
                        <Route path="/" element={<Navigate to="overview" replace />} />
                    </Routes>
                </main>
            </div>
        </Layout>
    );
};