import React, { useState } from 'react';
import { StudentProfile } from './profile/StudentProfile';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trophy, TrendingUp, Calendar, Bell, CheckCircle, XCircle, FileText, Send, Map } from 'lucide-react';
import { LogStatus, MentoringLog, AttendanceStatus } from '../types';

import { Layout } from './Layout';
import { CurriculumRoadmap } from './CurriculumRoadmap';

export const StudentView: React.FC = () => {
  const { currentUser, logs, modules, users, updateStudentSubmission } = useData();
  
  // State for Modal
  const [selectedLog, setSelectedLog] = useState<MentoringLog | null>(null);
  const [artifactUrl, setArtifactUrl] = useState('');
  const [reflection, setReflection] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard'); // Kept for legacy compatibility if needed, but primarily using Routes

  const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <Trophy size={18} />, path: '/student/dashboard' },
      { id: 'roadmap', label: 'Curriculum Roadmap', icon: <Map size={18} />, path: '/student/roadmap' },
      { id: 'logs', label: 'My Logs', icon: <FileText size={18} />, path: '/student/logs' }
  ];

  // Filter logs where this student was scored and the log is APPROVED or DRAFT
  const studentLogs = logs.filter(log => 
    (log.status === LogStatus.APPROVED || log.status === LogStatus.DRAFT) && 
    log.scores.some(s => s.studentId === currentUser.id)
  );

  const myScores = studentLogs.map(log => {
      const score = log.scores.find(s => s.studentId === currentUser.id)!;
      return { ...score, date: log.date, logId: log.id, moduleId: log.moduleId, mentorId: log.mentorId, summaryNote: log.summaryNote, logStatus: log.status };
  });

  // Pending actions: Either not acknowledged (for APPROVED logs) or missing artifact/reflection (for DRAFT logs)
  const pendingActions = myScores.filter(s => {
      if (s.logStatus === LogStatus.DRAFT) {
          return !s.studentArtifactUrl || !s.studentReflection;
      }
      return !s.isFeedbackAcknowledged;
  });
  const completedSessions = myScores.filter(s => s.logStatus === LogStatus.APPROVED && s.isFeedbackAcknowledged);

  const radarSessions = myScores.filter(s => s.logStatus === LogStatus.APPROVED);
  const totalRadarSessions = radarSessions.length;

  // Dynamically calculate averages for all metrics found (for all approved sessions)
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

  const radarData = Object.keys(metricTotals).map(key => ({
      subject: key,
      Average: metricTotals[key].count > 0 ? (metricTotals[key].sum / metricTotals[key].count) : 0,
      Latest: latestScores[key] || 0,
      fullMark: 5
  }));

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
          <div className="space-y-6 animate-fade-in relative pb-10">
            <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold">Hello, {currentUser.fullName.split(' ')[0]}!</h1>
                <p className="text-indigo-200 mt-2">Here is your competency growth report and pending tasks.</p>
            </div>

        {pendingActions.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Pending Actions ({pendingActions.length})
                </h3>
                <div className="space-y-3">
                    {pendingActions.map(action => {
                        const moduleName = modules.find(m => m.id === action.moduleId)?.name;
                        const mentorName = users.find(u => u.id === action.mentorId)?.fullName;
                        return (
                            <div key={action.logId} className="bg-white p-4 rounded-lg border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{action.date}</span>
                                        <span className="text-sm font-bold text-gray-800">{moduleName}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Mentor: {mentorName}</p>
                                    <p className="text-xs text-gray-500 mt-1">"{action.summaryNote}"</p>
                                </div>
                                <button 
                                    onClick={() => openModal(action.logId)}
                                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors whitespace-nowrap"
                                >
                                    View Feedback & Submit
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Competency Radar
                </h3>
                <div className="h-72 w-full flex justify-center items-center">
                  {totalRadarSessions > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
                              <PolarRadiusAxis angle={30} domain={[0, 5]} />
                              <Radar name="Latest Score" dataKey="Latest" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                              <Radar name="Average Score" dataKey="Average" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeDasharray="4 4" />
                              <Tooltip />
                              <Legend />
                          </RadarChart>
                      </ResponsiveContainer>
                  ) : (
                      <p className="text-gray-400 text-center text-sm">No approved assessment data available yet.<br/>Wait for your mentor to approve your submissions to see your radar.</p>
                  )}
                </div>
            </div>

            {/* Stats & History */}
            <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" /> Current Standing
                      </h3>
                      {radarData.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4 text-center">
                              {radarData.map(stat => (
                                  <div key={stat.subject} className="p-3 bg-gray-50 rounded-lg">
                                      <div className="text-2xl font-bold text-indigo-700">{stat.Latest.toFixed(1)}</div>
                                      <div className="text-xs text-gray-500 uppercase font-medium truncate" title={stat.subject}>{stat.subject}</div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <p className="text-gray-400 text-sm">No data available.</p>
                      )}
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-gray-500" /> Completed Sessions
                      </h3>
                      <div className="space-y-3">
                          {completedSessions.slice(0, 5).map((score, idx) => {
                              const values = Object.values(score.metrics) as number[];
                              const avg = values.length > 0 ? values.reduce((a,b) => a+b, 0) / values.length : 0;
                              const moduleName = modules.find(m => m.id === score.moduleId)?.name;
                              
                              return (
                                  <div key={idx} className="flex flex-col p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <p className="text-sm font-bold text-gray-900">{moduleName}</p>
                                              <p className="text-xs text-gray-500">{score.date} • {score.attendance}</p>
                                          </div>
                                          <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                                              Avg: {avg.toFixed(1)}
                                          </div>
                                      </div>
                                      {score.feedback && (
                                          <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 italic mb-2">
                                              " {score.feedback} "
                                          </div>
                                      )}
                                      {score.studentArtifactUrl && (
                                          <a href={score.studentArtifactUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                                              <FileText size={12} /> View My Submission
                                          </a>
                                      )}
                                  </div>
                              );
                          })}
                          {completedSessions.length === 0 && <p className="text-gray-400 text-sm">No completed sessions yet.</p>}
                      </div>
                 </div>
            </div>
        </div>
        </div>
        } />

        <Route path="roadmap" element={<CurriculumRoadmap />} />

        <Route 
          path="logs" element={
            <div className="space-y-6 animate-fade-in pb-10">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">My Mentoring Logs</h2>
                <p className="text-gray-500 mb-8">Review your complete history of feedback, scores, and reflections.</p>
                
                <div className="space-y-4">
                  {studentLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No logs available yet.</p>
                  ) : (
                    [...studentLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                      const moduleName = modules.find(m => m.id === log.moduleId)?.name;
                      const mentorName = users.find(u => u.id === log.mentorId)?.fullName;
                      const myScore = log.scores.find(s => s.studentId === currentUser.id);
                      const isPending = log.status === LogStatus.DRAFT;
                      const values = Object.values(myScore?.metrics || {}) as number[];
                      const avg = values.length > 0 ? values.reduce((a,b) => a+b, 0) / values.length : 0;

                      return (
                        <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-bold text-gray-900">{moduleName}</span>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.date}</span>
                              {isPending ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Action Required</span>
                              ) : (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completed</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-4 mb-2">
                              <span>Mentor: <span className="font-medium">{mentorName}</span></span>
                              <span>Attendance: <span className="font-medium">{myScore?.attendance}</span></span>
                              {!isPending && <span>Avg Score: <span className="font-bold text-indigo-600">{avg.toFixed(1)}</span></span>}
                            </div>
                            {!isPending && myScore?.feedback && (
                              <p className="text-sm text-gray-500 italic line-clamp-2">"{myScore.feedback}"</p>
                            )}
                          </div>
                          <button 
                            onClick={() => openModal(log.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                              isPending 
                                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {isPending ? 'Submit Reflection' : 'View Details'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          } 
        />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="/" element={<Navigate to="dashboard" replace />} />
      </Routes>

      {/* Submission Modal */}
      {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                  <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedLog.status === LogStatus.DRAFT ? 'Submit Your Work' : 'Session Feedback'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">{selectedLog.date} • {modules.find(m => m.id === selectedLog.moduleId)?.name}</p>

                  {/* Mentor's Feedback Section (Only show if APPROVED) */}
                  {selectedLog.status === LogStatus.APPROVED && (
                      <div className="bg-indigo-50 rounded-xl p-5 mb-6 border border-indigo-100">
                          <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                              <Trophy size={18} /> Mentor's Assessment
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                              {Object.entries(selectedLog.scores.find(s => s.studentId === currentUser.id)?.metrics || {}).map(([key, val]) => (
                                  <div key={key} className="bg-white p-2 rounded border border-indigo-50 flex justify-between items-center">
                                      <span className="text-xs font-medium text-gray-600">{key}</span>
                                      <span className="text-sm font-bold text-indigo-700">{val as number}/5</span>
                                  </div>
                              ))}
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-indigo-100">
                              <p className="text-sm text-gray-700 italic">
                                  "{selectedLog.scores.find(s => s.studentId === currentUser.id)?.feedback || 'No specific feedback provided.'}"
                              </p>
                          </div>
                      </div>
                  )}

                  {/* Student Submission Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                              Submit Your Work (Artifact URL)
                              {modules.find(m => m.id === selectedLog.moduleId)?.expectedArtifactType && (
                                  <span className="ml-2 text-xs font-normal bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                                      Expected: {modules.find(m => m.id === selectedLog.moduleId)?.expectedArtifactType}
                                  </span>
                              )}
                          </label>
                          <p className="text-xs text-gray-500 mb-2">Provide a link to your code, document, or project related to this session.</p>
                          <input 
                              type="url" 
                              required
                              placeholder={
                                  modules.find(m => m.id === selectedLog.moduleId)?.expectedArtifactType === 'GITHUB' ? "https://github.com/..." :
                                  modules.find(m => m.id === selectedLog.moduleId)?.expectedArtifactType === 'FIGMA' ? "https://figma.com/..." :
                                  "https://..."
                              }
                              className="w-full rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-indigo-500 text-sm"
                              value={artifactUrl}
                              onChange={e => setArtifactUrl(e.target.value)}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Self Reflection</label>
                          <p className="text-xs text-gray-500 mb-2">What did you learn? What was challenging? How will you improve?</p>
                          <textarea 
                              required
                              rows={4}
                              placeholder="I learned how to..." 
                              className="w-full rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-indigo-500 text-sm"
                              value={reflection}
                              onChange={e => setReflection(e.target.value)}
                          />
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                          <button type="button" onClick={() => setSelectedLog(null)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                          <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold flex items-center gap-2">
                              <Send size={16} /> {selectedLog.status === LogStatus.DRAFT ? 'Submit Work' : 'Acknowledge & Submit'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </Layout>
  );
};