import React from 'react';
import { Trophy, Bell, TrendingUp, Calendar } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { User, MentoringLog, Module } from '../../types';

interface DashboardHomeProps {
    currentUser: User;
    pendingActions: any[];
    modules: Module[];
    users: User[];
    radarData: any[];
    totalRadarSessions: number;
    completedSessions: any[];
    onOpenModal: (logId: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    currentUser,
    pendingActions,
    modules,
    users,
    radarData,
    totalRadarSessions,
    completedSessions,
    onOpenModal
}) => {
    return (
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
                                        onClick={() => onOpenModal(action.logId)}
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
                                  const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
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
                                                  <TrendingUp size={12} /> View My Submission
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
    );
};
