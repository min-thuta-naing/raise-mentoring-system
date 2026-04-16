import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { LayoutGrid, Calendar, CheckSquare, Settings, PenTool, UserPlus, Layers } from 'lucide-react';

// Shared Components
import { Layout } from './Layout';
import { MentorLogForm } from './MentorLogForm';
import { AdminProfile } from './profile/AdminProfile';

// Admin Sub-components
import { OverviewTab } from './admin/OverviewTab';
import { PlanningTab } from './admin/PlanningTab';
import { ApprovalsTab } from './admin/ApprovalsTab';
import { SetupTab } from './admin/SetupTab';
import { UserRegistrationTab } from './admin/UserRegistrationTab';
import { BatchManagementTab } from './admin/BatchManagementTab';

/**
 * Main Admin Dashboard Entry Point
 * Handles routing and high-level layout for the Admin portal.
 */
export const AdminDashboard: React.FC = () => {
    const { 
        logs, users, batches, modules, groups, lessonPlans,
        updateLogStatus, addUser, approveUser, rejectUser, addBatch, updateBatch, addModule, updateModule, deleteModule, addGroup, updateGroup, addLessonPlan
    } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutGrid size={18} />, path: '/admin/overview' },
        { id: 'planning', label: 'Planning', icon: <Calendar size={18} />, path: '/admin/planning' },
        { id: 'approvals', label: 'Verification', icon: <CheckSquare size={18} />, path: '/admin/approvals' },
        { id: 'registration', label: 'User Registration', icon: <UserPlus size={18} />, path: '/admin/registration' },
        { id: 'batches', label: 'Batch Management', icon: <Layers size={18} />, path: '/admin/batches' },
        { id: 'entry', label: 'New Entry', icon: <PenTool size={18} />, path: '/admin/entry' },
        { id: 'setup', label: 'Configuration', icon: <Settings size={18} />, path: '/admin/setup' },
    ];

    // Page Title Mapping
    const getPageContent = () => {
        switch (location.pathname) {
            case '/admin/overview':
                return { title: 'System Overview', subtitle: 'Monitor mentor performance, student metrics, and audit logs.' };
            case '/admin/planning':
                return { title: 'Curriculum Planning', subtitle: 'Design modules, schedule lesson plans, and manage learning tracks.' };
            case '/admin/approvals':
                return { title: 'Log Verification', subtitle: 'Review and approve mentoring logs for accuracy and compliance.' };
            case '/admin/registration':
                return { title: 'User Registration', subtitle: 'Add new students and mentors to the mentoring ecosystem.' };
            case '/admin/batches':
                return { title: 'Batch Management', subtitle: 'Create and organize student cohorts and academic periods.' };
            case '/admin/entry':
                return { title: 'Manual Entry', subtitle: 'Add new mentoring sessions or historical data to the system.' };
            case '/admin/setup':
                return { title: 'System Settings', subtitle: 'Configure batches, manage user roles, and update global parameters.' };
            case '/admin/profile':
                return { title: 'Admin Profile', subtitle: 'Manage your personal account settings and preferences.' };
            default:
                return { title: 'Admin Dashboard', subtitle: 'Manage sessions, verify logs, and configure system.' };
        }
    };

    const { title, subtitle } = getPageContent();

    return (
        <Layout navItems={tabs}>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="animate-fade-in">
                        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                        <p className="text-gray-500 text-sm">{subtitle}</p>
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
                                batches={batches}
                                users={users}
                                lessonPlans={lessonPlans}
                                onAddPlan={addLessonPlan}
                                onAddModule={addModule}
                                onUpdateModule={updateModule}
                                onDeleteModule={deleteModule}
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
                        <Route path="registration" element={
                            <UserRegistrationTab 
                                users={users}
                                batches={batches}
                                onApproveUser={approveUser}
                                onRejectUser={rejectUser}
                            />
                        } />
                        <Route path="batches" element={
                            <BatchManagementTab 
                                batches={batches}
                                onAddBatch={addBatch}
                                onUpdateBatch={updateBatch}
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