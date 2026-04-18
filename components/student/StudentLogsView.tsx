import React from 'react';
import { LogStatus, User, MentoringLog, Module } from '../../types';

interface StudentLogsViewProps {
    studentLogs: MentoringLog[];
    modules: Module[];
    users: User[];
    currentUser: User;
    onOpenModal: (logId: string) => void;
}

export const StudentLogsView: React.FC<StudentLogsViewProps> = ({
    studentLogs,
    modules,
    users,
    currentUser,
    onOpenModal
}) => {
    return (
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
                            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

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
                                        onClick={() => onOpenModal(log.id)}
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
    );
};
