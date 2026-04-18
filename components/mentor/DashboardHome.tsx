import React from 'react';
import { LayoutDashboard, PieChart, AlertOctagon, CheckCircle, History, Calendar, Clock, PlayCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { MentoringLog, LessonPlan, Module, User, Group, LogStatus } from '../../types';

interface DashboardHomeProps {
    totalHours: number;
    lectureHours: string;
    practiceHours: string;
    pendingLogs: MentoringLog[];
    myGroups: Group[];
    nextClass: LessonPlan | undefined;
    modules: Module[];
    radarData: any[];
    redFlagStudents: { user: User, avg: number }[];
    myLogs: MentoringLog[];
    onStartLog: (plan?: LessonPlan) => void;
    onEditLog: (log: MentoringLog) => void;
    onNavigateToLogs: () => void;
    onNavigateToStudents: (student: User) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
    totalHours, lectureHours, practiceHours, pendingLogs, myGroups, nextClass,
    modules, radarData, redFlagStudents, myLogs, onStartLog, onEditLog,
    onNavigateToLogs, onNavigateToStudents
}) => {
    return (
        <div className="space-y-6 animate-fade-in text-gray-900">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Hours</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-900">{totalHours.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">hrs</span>
                    </div>
                    <div className="flex gap-2 mt-2 text-[10px] font-bold">
                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">L: {lectureHours}</span>
                        <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">P: {practiceHours}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pending Logs</p>
                    <span className="text-2xl font-black text-yellow-600">{pendingLogs.length}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Awaiting approval</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Active Groups</p>
                    <span className="text-2xl font-black text-gray-800">{myGroups.length}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Under supervision</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">My Progress</p>
                     <span className="text-2xl font-black text-green-600">--%</span>
                     <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Of planned sessions</p>
                </div>
            </div>

            {/* Today's Action (Hero) */}
            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
                                <Calendar className="w-4 h-4 text-indigo-200" />
                             </div>
                             <span className="font-black text-indigo-300 uppercase tracking-widest text-[10px]">Today's Action</span>
                        </div>
                        {nextClass ? (
                            <>
                                <h2 className="text-2xl font-black mb-1 leading-tight uppercase tracking-tight">{modules.find(m => m.id === nextClass.moduleId)?.name || "Unknown Module"}</h2>
                                <p className="text-indigo-200 text-sm font-medium flex items-center gap-2">
                                    <Clock size={14} className="opacity-70" /> {nextClass.startTime} - {nextClass.endTime} 
                                    <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full"></span>
                                    <span className="truncate">{nextClass.topic}</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-black mb-1 uppercase tracking-tight">No Classes Today</h2>
                                <p className="text-indigo-200 text-sm font-medium">You're all clear! Feel free to record an extra session or catch up on paperwork.</p>
                            </>
                        )}
                    </div>
                    <button 
                        onClick={() => onStartLog(nextClass)}
                        className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-sm shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3 group uppercase tracking-widest"
                    >
                        <div className="p-1 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors">
                            <PlayCircle size={20} className="text-indigo-600" />
                        </div>
                        {nextClass ? 'Record Log' : 'Extra Log'}
                    </button>
                </div>
                {/* Decorative BG elements */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-indigo-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
            </div>

            {/* Performance & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <PieChart size={18} className="text-indigo-600" />
                            </div>
                            <h3 className="font-black text-gray-800 uppercase text-xs tracking-wider">Group Competency</h3>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">All Students Average</span>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} stroke="#e2e8f0" />
                                <Radar name="Group Avg" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.6} />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertOctagon size={18} className="text-red-500" />
                        </div>
                        <h3 className="font-black text-red-600 uppercase text-xs tracking-wider">Red Flags</h3>
                    </div>
                    {redFlagStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 animate-pulse">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-900">All Clear</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">No critical alerts</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {redFlagStudents.map(({ user, avg }) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100 group hover:bg-red-50 transition-all cursor-pointer" onClick={() => onNavigateToStudents(user)}>
                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full ring-2 ring-white object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-gray-900 truncate">{user.fullName}</p>
                                        <p className="text-[10px] text-red-600 font-black uppercase tracking-tight">Avg Score: {avg.toFixed(1)}</p>
                                    </div>
                                    <button className="p-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-red-100 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                        <History size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ring-1 ring-gray-900/5">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                             <History size={16} className="text-indigo-600" />
                        </div>
                        <h3 className="font-black text-gray-800 uppercase text-xs tracking-wider">Recent Activity</h3>
                    </div>
                    <button onClick={onNavigateToLogs} className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline">View Full History</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {myLogs.slice(0, 5).map(log => {
                        const moduleName = modules.find(m => m.id === log.moduleId)?.name;
                        const totalStudents = log.scores.length;
                        const submittedStudents = log.scores.filter(s => s.studentArtifactUrl || s.studentReflection).length;
                        
                        return (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-all group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`w-2 h-2 rounded-full ring-2 ring-white ${log.status === LogStatus.APPROVED ? 'bg-green-500' : log.status === LogStatus.PENDING ? 'bg-yellow-400' : log.status === LogStatus.DRAFT ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{log.date}</span>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate">{moduleName}</span>
                                        {log.status === LogStatus.DRAFT && totalStudents > 0 && (
                                            <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black border border-blue-100 uppercase tracking-tight">
                                                {submittedStudents}/{totalStudents} Submissions
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 truncate pr-4">{log.summaryNote || 'Record of session data'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-black text-gray-400 tabular-nums">{log.durationMinutes}min</span>
                                    {(log.status === LogStatus.REJECTED || log.status === LogStatus.PENDING || log.status === LogStatus.DRAFT) && (
                                        <button 
                                            onClick={() => onEditLog(log)} 
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 active:scale-90"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {myLogs.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <History size={24} className="text-gray-200" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No logs recorded yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Icon for Table
const Edit3 = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
);
