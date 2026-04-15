import React from 'react';
import { Clock, CheckCircle, Briefcase, AlertOctagon, Shield } from 'lucide-react';
import { MentoringLog, User, Role, LogStatus, MentorType, AttendanceStatus } from '../../types';

interface OverviewTabProps {
  logs: MentoringLog[];
  users: User[];
  onNavigateToRedFlags: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ logs, users, onNavigateToRedFlags }) => {
  const pendingCount = logs.filter(l => l.status === LogStatus.PENDING).length;
  const approvedCount = logs.filter(l => l.status === LogStatus.APPROVED).length;

  // Valid Hours Breakdown
  const validLogs = logs.filter(l => l.status === LogStatus.APPROVED && l.isValidSession);
  const internalHours = validLogs.filter(l => users.find(u => u.id === l.mentorId)?.mentorType === MentorType.INTERNAL).length;
  const externalHours = validLogs.filter(l => users.find(u => u.id === l.mentorId)?.mentorType === MentorType.EXTERNAL).length;

  // Early Warning Calculation
  const atRiskStudents = users.filter(u => u.role === Role.STUDENT).map(student => {
    const studentScores = logs.flatMap(l => l.scores.filter(s => s.studentId === student.id));
    const totalSessions = studentScores.length;
    const absentCount = studentScores.filter(s => s.attendance === AttendanceStatus.ABSENT).length;

    let totalAvg = 0;
    if (totalSessions > 0) {
      const sumScores = studentScores.reduce((acc, s) => {
        const vals = Object.values(s.metrics) as number[];
        const sessionAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return acc + sessionAvg;
      }, 0);
      totalAvg = sumScores / totalSessions;
    }

    return { ...student, totalAvg, absentCount };
  }).filter(s => s.totalAvg < 2.5 || s.absentCount > 2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Early Warning Widget */}
      {atRiskStudents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between z-10 relative">
            <div>
              <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">
                <AlertOctagon size={24} /> Early Warning System
              </h3>
              <p className="text-red-600 text-sm mt-1">Students requiring immediate attention (Avg &lt; 2.5 or Low Attendance)</p>
            </div>
            <button onClick={onNavigateToRedFlags} className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-50 border border-red-100">
              View Details
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
            {atRiskStudents.map(s => (
              <div key={s.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-3 border border-red-100">
                <img src={s.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{s.fullName}</p>
                  <p className="text-xs text-red-500 font-semibold">Avg: {s.totalAvg.toFixed(1)} | Abs: {s.absentCount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Clock size={24} /></div>
            <span className="text-2xl font-bold text-gray-900">{pendingCount}</span>
          </div>
          <h3 className="text-gray-500 font-medium text-sm">Pending Verification</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-green-600"><CheckCircle size={24} /></div>
            <span className="text-2xl font-bold text-gray-900">{approvedCount}</span>
          </div>
          <h3 className="text-gray-500 font-medium text-sm">Total Sessions</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Briefcase size={24} /></div>
            <span className="text-2xl font-bold text-gray-900">{internalHours} hrs</span>
          </div>
          <h3 className="text-gray-500 font-medium text-sm">Internal Hrs (Staff)</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-lg text-orange-600"><Briefcase size={24} /></div>
            <span className="text-2xl font-bold text-gray-900">{externalHours} hrs</span>
          </div>
          <h3 className="text-gray-500 font-medium text-sm">External Hrs (Industry)</h3>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Recent Audit Log</h3>
        <div className="space-y-4">
          {logs.slice(0, 5).map(log => {
            const isProxy = log.recordedBy !== log.mentorId;
            return (
              <div key={log.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.status === 'APPROVED' ? 'bg-green-500' : log.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{users.find(u => u.id === log.mentorId)?.fullName || 'Unknown'}</p>
                      {isProxy && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 rounded border border-indigo-100 flex items-center gap-1"><Shield size={8} /> Admin Proxy</span>}
                    </div>
                    <p className="text-xs text-gray-500">{log.summaryNote}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{log.date}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};
