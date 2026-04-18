import React, { useState, useMemo } from 'react';
import { StudentProfile } from './profile/StudentProfile';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { Trophy, FileText, Map, Users } from 'lucide-react';
import { LogStatus, AttendanceStatus } from '../types';

import { Layout } from './Layout';
import { CurriculumRoadmap } from './CurriculumRoadmap';
import { DashboardHome } from './student/DashboardHome';
import { StudentLogsView } from './student/StudentLogsView';
import { SubmissionModal } from './student/SubmissionModal';
import { MyGroupView } from './student/MyGroupView';

export const StudentView: React.FC = () => {
  const { currentUser, logs, modules, users, updateStudentSubmission, totalUnreadCount } = useData();
  
  // State for Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [artifactUrl, setArtifactUrl] = useState('');
  const [reflection, setReflection] = useState('');

  const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <Trophy size={18} />, path: '/student/dashboard' },
      { id: 'roadmap', label: 'Curriculum Roadmap', icon: <Map size={18} />, path: '/student/roadmap' },
      { id: 'group', label: 'My Group', icon: <Users size={18} />, path: '/student/group', badge: totalUnreadCount },
      { id: 'logs', label: 'My Logs', icon: <FileText size={18} />, path: '/student/logs' }
  ];

  // Filter logs where this student was scored and the log is APPROVED or DRAFT
  const studentLogs = useMemo(() => logs.filter(log => 
    (log.status === LogStatus.APPROVED || log.status === LogStatus.DRAFT) && 
    log.scores.some(s => s.studentId === currentUser.id)
  ), [logs, currentUser.id]);

  const myScores = useMemo(() => studentLogs.map(log => {
      const score = log.scores.find(s => s.studentId === currentUser.id)!;
      return { ...score, date: log.date, logId: log.id, moduleId: log.moduleId, mentorId: log.mentorId, summaryNote: log.summaryNote, logStatus: log.status };
  }), [studentLogs, currentUser.id]);

  // Pending actions: Either not acknowledged (for APPROVED logs) or missing artifact/reflection (for DRAFT logs)
  const pendingActions = useMemo(() => myScores.filter(s => {
      if (s.logStatus === LogStatus.DRAFT) {
          return !s.studentArtifactUrl || !s.studentReflection;
      }
      return !s.isFeedbackAcknowledged;
  }), [myScores]);

  const completedSessions = useMemo(() => myScores.filter(s => s.logStatus === LogStatus.APPROVED && s.isFeedbackAcknowledged), [myScores]);

  const radarSessions = useMemo(() => myScores.filter(s => s.logStatus === LogStatus.APPROVED), [myScores]);
  const totalRadarSessions = radarSessions.length;

  // Dynamically calculate averages for all metrics found (for all approved sessions)
  const { radarData } = useMemo(() => {
    const metricTotals: Record<string, { sum: number, count: number }> = {};
    const latestScores: Record<string, number> = {};
    
    // Sort radarSessions by date descending to find the latest score easily
    const sortedSessions = [...radarSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedSessions.forEach(score => {
        if (score.attendance !== AttendanceStatus.ABSENT) {
            Object.entries(score.metrics).forEach(([key, value]) => {
                // Accumulate for average
                if (!metricTotals[key]) metricTotals[key] = { sum: 0, count: 0 };
                metricTotals[key].sum += (value as number);
                metricTotals[key].count += 1;
                
                // Record latest score (since it's sorted descending, the first one we see is the latest)
                if (latestScores[key] === undefined) {
                    latestScores[key] = value as number;
                }
            });
        }
    });

    const data = Object.keys(metricTotals).map(key => ({
        subject: key,
        Average: metricTotals[key].count > 0 ? (metricTotals[key].sum / metricTotals[key].count) : 0,
        Latest: latestScores[key] || 0,
        fullMark: 5
    }));

    return { radarData: data };
  }, [radarSessions]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLog) return;
      updateStudentSubmission(selectedLog.id, currentUser.id, artifactUrl, reflection);
      setSelectedLog(null);
      setArtifactUrl('');
      setReflection('');
  };

  const openModal = (logId: string) => {
      const log = studentLogs.find(l => l.id === logId);
      if (log) {
          setSelectedLog(log);
          const myScore = log.scores.find(s => s.studentId === currentUser.id);
          setArtifactUrl(myScore?.studentArtifactUrl || '');
          setReflection(myScore?.studentReflection || '');
      }
  };

  return (
    <Layout navItems={navItems}>
      <Routes>
        <Route path="dashboard" element={
            <DashboardHome 
                currentUser={currentUser}
                pendingActions={pendingActions}
                modules={modules}
                users={users}
                radarData={radarData}
                totalRadarSessions={totalRadarSessions}
                completedSessions={completedSessions}
                onOpenModal={openModal}
            />
        } />

        <Route path="roadmap" element={<CurriculumRoadmap />} />
        <Route path="group" element={<MyGroupView />} />

        <Route 
          path="logs" element={
            <StudentLogsView 
                studentLogs={studentLogs}
                modules={modules}
                users={users}
                currentUser={currentUser}
                onOpenModal={openModal}
            />
          } 
        />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="/" element={<Navigate to="dashboard" replace />} />
      </Routes>

      {/* Submission Modal */}
      {selectedLog && (
          <SubmissionModal 
            selectedLog={selectedLog}
            currentUser={currentUser}
            modules={modules}
            artifactUrl={artifactUrl}
            setArtifactUrl={setArtifactUrl}
            reflection={reflection}
            setReflection={setReflection}
            onSubmit={handleSubmit}
            onClose={() => setSelectedLog(null)}
          />
      )}
    </Layout>
  );
};