import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { LogStatus, MentoringLog, LessonPlan, User, Group, Module, PlanStatus, AttendanceStatus } from '../types';
import { 
  Calendar, History, LayoutDashboard, Users, FolderOpen
} from 'lucide-react';
import { MentorProfile } from './profile/MentorProfile';
import { Layout } from './Layout';
import { MentorLogForm } from './mentor/MentorLogForm';
import { MentorLogEdit } from './mentor/MentorLogEdit';

import { StudentProfileDrawer } from './mentor/StudentProfileDrawer';
import { StudentDirectory } from './mentor/StudentDirectory';
import { DashboardHome } from './mentor/DashboardHome';
import { ScheduleView } from './mentor/ScheduleView';
import { MaterialsView } from './mentor/MaterialsView';
import { HistoryView } from './mentor/HistoryView';

export const MentorDashboard: React.FC = () => {
    const { currentUser, lessonPlans, logs, modules, users, groups } = useData();
    const navigate = useNavigate();
    
    // Selection States
    const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
    const [selectedLogToEdit, setSelectedLogToEdit] = useState<MentoringLog | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [historyFilter, setHistoryFilter] = useState<'ALL' | LogStatus>('ALL');

    if (!currentUser) return null;

    // --- Derived Data ---
    const today = new Date().toISOString().split('T')[0];
    const myLogs = useMemo(() => logs.filter(l => l.mentorId === currentUser.id), [logs, currentUser.id]);
    const pendingLogs = useMemo(() => myLogs.filter(l => l.status === LogStatus.PENDING), [myLogs]);
    const approvedLogs = useMemo(() => myLogs.filter(l => l.status === LogStatus.APPROVED), [myLogs]);
    const myGroups = useMemo(() => groups.filter(g => g.mentorIds.includes(currentUser.id)), [groups, currentUser.id]);
    
    const todaysClasses = useMemo(() => 
        lessonPlans.filter(p => p.mentorId === currentUser.id && p.date === today && p.status === PlanStatus.PUBLISHED),
        [lessonPlans, currentUser.id, today]
    );
    const nextClass = useMemo(() => 
        [...todaysClasses].sort((a,b) => a.startTime.localeCompare(b.startTime))[0],
        [todaysClasses]
    );
    
    const { totalHours, lectureHours, practiceHours } = useMemo(() => {
        const totalMinutes = approvedLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
        const hours = totalMinutes / 60;
        return {
            totalHours: hours,
            lectureHours: (hours * 0.4).toFixed(1),
            practiceHours: (hours * 0.6).toFixed(1)
        };
    }, [approvedLogs]);

    // Red Flag Calculation
    const redFlagStudents = useMemo(() => {
        const myStudentIds = myGroups.flatMap(g => g.studentIds);
        const myStudents = users.filter(u => myStudentIds.includes(u.id));
        
        return myStudents.map(s => {
            const sLogs = myLogs.filter(l => l.scores.some(sc => sc.studentId === s.id));
            if (sLogs.length === 0) return null;
            
            const scores = sLogs.flatMap(l => {
                const sc = l.scores.find(x => x.studentId === s.id);
                return sc?.attendance !== AttendanceStatus.ABSENT ? Object.values(sc?.metrics || {}) : [];
            }) as number[];
            
            const avg = scores.length ? scores.reduce((a,b) => a+b, 0) / scores.length : 0;
            return { user: s, avg };
        }).filter((item): item is { user: User, avg: number } => item !== null && item.avg < 2.5);
    }, [myGroups, users, myLogs]);

    // Aggregate Radar Data
    const radarData = useMemo(() => {
        const metricTotals: Record<string, { sum: number, count: number }> = {};
        myLogs.forEach(log => {
            log.scores.forEach(score => {
                 if (score.attendance !== AttendanceStatus.ABSENT) {
                    Object.entries(score.metrics).forEach(([key, value]) => {
                        if (!metricTotals[key]) metricTotals[key] = { sum: 0, count: 0 };
                        metricTotals[key].sum += (value as number);
                        metricTotals[key].count += 1;
                    });
                 }
            });
        });
        return Object.keys(metricTotals).map(key => ({
            subject: key,
            A: metricTotals[key].count > 0 ? (metricTotals[key].sum / metricTotals[key].count) : 0,
            fullMark: 5
        }));
    }, [myLogs]);

    // Handlers
    const handleStartLog = (plan?: LessonPlan) => {
        setSelectedPlan(plan || null);
        setSelectedLogToEdit(null);
        navigate('/mentor/entry');
    };

    const handleEditLog = (log: MentoringLog) => {
        setSelectedLogToEdit(log);
        setSelectedPlan(null);
        navigate(`/mentor/entry/edit/${log.id}`);
    };

    const handleLogSuccess = () => {
        navigate('/mentor/logs');
        setSelectedPlan(null);
        setSelectedLogToEdit(null);
    };

    // --- Main Render ---

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/mentor/dashboard' },
        { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} />, path: '/mentor/schedule' },
        { id: 'logs', label: 'History', icon: <History size={18} />, path: '/mentor/logs' },
        { id: 'students', label: 'Students', icon: <Users size={18} />, path: '/mentor/students' },
        { id: 'materials', label: 'Materials', icon: <FolderOpen size={18} />, path: '/mentor/materials' },
    ];

    return (
        <Layout navItems={navItems}>
            <Routes>
                <Route path="entry" element={
                    <MentorLogForm 
                        initialData={selectedPlan ? {
                            moduleId: selectedPlan.moduleId,
                            date: selectedPlan.date,
                            startTime: selectedPlan.startTime,
                            endTime: selectedPlan.endTime,
                            summaryNote: selectedPlan.topic,
                        } : undefined} 
                        onSuccess={handleLogSuccess}
                        onCancel={() => navigate(-1)}
                    />
                } />
                <Route path="entry/edit/:logId" element={
                    <MentorLogEdit 
                        onSuccess={handleLogSuccess}
                    />
                } />
                <Route path="*" element={
                    <div className="space-y-6">
                        {/* 2. Main Content Area */}
                        <div className="min-h-[500px]">
                            <Routes>
                                <Route path="dashboard" element={
                                    <DashboardHome 
                                        totalHours={totalHours}
                                        lectureHours={lectureHours}
                                        practiceHours={practiceHours}
                                        pendingLogs={pendingLogs}
                                        myGroups={myGroups}
                                        nextClass={nextClass}
                                        modules={modules}
                                        radarData={radarData}
                                        redFlagStudents={redFlagStudents}
                                        myLogs={myLogs}
                                        onStartLog={handleStartLog}
                                        onEditLog={handleEditLog}
                                        onNavigateToLogs={() => navigate('/mentor/logs')}
                                        onNavigateToStudents={(s) => { navigate('/mentor/students'); setSelectedStudent(s); }}
                                    />
                                } />
                                <Route path="schedule" element={
                                    <ScheduleView 
                                        lessonPlans={lessonPlans}
                                        currentUser={currentUser}
                                        myLogs={myLogs}
                                        modules={modules}
                                        today={today}
                                        onStartLog={handleStartLog}
                                    />
                                } />
                                <Route path="logs" element={
                                    <HistoryView 
                                        myLogs={myLogs}
                                        historyFilter={historyFilter}
                                        setHistoryFilter={setHistoryFilter}
                                        modules={modules}
                                        onEditLog={handleEditLog}
                                    />
                                } />
                                <Route path="materials" element={<MaterialsView myLogs={myLogs} />} />
                                <Route path="profile" element={<MentorProfile />} />
                                <Route path="students" element={
                                    <StudentDirectory 
                                        users={users} 
                                        groups={groups} 
                                        modules={modules}
                                        currentUserId={currentUser.id} 
                                        logs={logs}
                                        onSelectStudent={setSelectedStudent} 
                                    />
                                } />
                                <Route path="/" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </div>

                        {/* Global Drawer */}
                        {selectedStudent && (
                            <StudentProfileDrawer 
                                student={selectedStudent} 
                                logs={logs}
                                allLogs={logs}
                                modules={modules}
                                onClose={() => setSelectedStudent(null)} 
                            />
                        )}
                    </div>
                } />
            </Routes>
        </Layout>
    );
};