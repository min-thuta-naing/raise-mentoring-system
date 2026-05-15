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
                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Total Hours</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-[#454040]">{totalHours.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">hrs</span>
                    </div>
                    <div className="flex gap-2 mt-2 text-[9px] font-black uppercase tracking-widest">
                        <span className="bg-[#454040]/5 text-[#454040] px-2 py-0.5 rounded-full border border-[#454040]/10">L: {lectureHours}</span>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">P: {practiceHours}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Pending Logs</p>
                    <span className="text-xl font-black text-orange-600">{pendingLogs.length}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Awaiting approval</p>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Active Groups</p>
                    <span className="text-xl font-black text-[#454040]">{myGroups.length}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Under supervision</p>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">My Progress</p>
                     <span className="text-xl font-black text-emerald-600">--%</span>
                     <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Of planned sessions</p>
                </div>
            </div>

            {/* Today's Action (Hero) */}
            <div className="bg-[#0f172a] rounded-[1.5rem] p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-3">
                             <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                <Calendar className="w-4 h-4 text-white" />
                             </div>
                             <span className="font-black text-white/40 uppercase tracking-[0.25em] text-[9px]">Today's Action</span>
                        </div>
                        {nextClass ? (
                            <>
                                <h2 className="text-xl font-black mb-1 leading-tight uppercase tracking-tighter italic">{modules.find(m => m.id === nextClass.moduleId)?.name || "Unknown Module"}</h2>
                                <p className="text-white/60 text-[11px] font-bold flex items-center gap-3 uppercase tracking-widest">
                                    <Clock size={14} className="text-white/30" /> {nextClass.startTime} - {nextClass.endTime} 
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                    <span className="truncate">{nextClass.topic}</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black mb-1 uppercase tracking-tighter italic">No Classes Today</h2>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-relaxed">You're all clear! Record an extra session or catch up on paperwork.</p>
                            </>
                        )}
                    </div>
                    <button 
                        onClick={() => onStartLog(nextClass)}
                        className="bg-[#454040] text-white px-6 py-3 rounded-[1.5rem] font-black text-[10px] shadow-2xl hover:bg-[#353030] transition-all active:scale-95 flex items-center gap-4 group uppercase tracking-[0.2em] border border-white/10"
                    >
                        <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                            <PlayCircle size={18} className="text-white" />
                        </div>
                        {nextClass ? 'Record Log' : 'Extra Log'}
                    </button>
                </div>
                {/* Decorative BG elements */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#454040]/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4"></div>
            </div>

            {/* Performance & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#454040]/5 rounded-xl">
                                <PieChart size={16} className="text-[#454040]" />
                            </div>
                            <h3 className="font-black text-[#454040] uppercase text-[10px] tracking-[0.2em]">Group Competency</h3>
                        </div>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Average Analytics</span>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} stroke="#e2e8f0" />
                                <Radar name="Group Avg" dataKey="A" stroke="#454040" strokeWidth={3} fill="#454040" fillOpacity={0.6} />
                                <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px'}} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <AlertOctagon size={16} className="text-red-500" />
                        </div>
                        <h3 className="font-black text-red-600 uppercase text-[10px] tracking-[0.2em]">Red Flags</h3>
                    </div>
                    {redFlagStudents.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 animate-pulse">
                                <CheckCircle size={40} className="text-emerald-500" />
                            </div>
                            <p className="text-sm font-black text-gray-900 uppercase tracking-wider">All Clear</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest">No critical alerts</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {redFlagStudents.map(({ user, avg }) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 bg-red-50/50 rounded-[1.2rem] border border-red-50 group hover:bg-red-50 transition-all cursor-pointer" onClick={() => onNavigateToStudents(user)}>
                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full ring-2 ring-white object-cover shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-xs text-[#454040] truncate">{user.fullName}</p>
                                        <p className="text-[9px] text-red-600 font-black uppercase tracking-widest mt-0.5">Score: {avg.toFixed(1)}</p>
                                    </div>
                                    <button className="p-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-red-50 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                        <History size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#454040]/5 rounded-xl">
                             <History size={16} className="text-[#454040]" />
                        </div>
                        <h3 className="font-black text-[#454040] uppercase text-[10px] tracking-[0.25em]">Recent Activity</h3>
                    </div>
                    <button onClick={onNavigateToLogs} className="text-[9px] text-[#454040] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Full History</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {myLogs.slice(0, 5).map(log => {
                        const moduleName = modules.find(m => m.id === log.moduleId)?.name;
                        const totalStudents = log.scores.length;
                        const submittedStudents = log.scores.filter(s => s.studentArtifactUrl || s.studentReflection).length;
                        
                        return (
                            <div key={log.id} className="p-5 flex items-center justify-between hover:bg-gray-50/30 transition-all group">
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ring-2 ring-white ${log.status === LogStatus.APPROVED ? 'bg-emerald-500' : log.status === LogStatus.PENDING ? 'bg-orange-400' : log.status === LogStatus.DRAFT ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{log.date}</span>
                                        <span className="w-1 h-1 bg-gray-100 rounded-full"></span>
                                        <span className="text-[9px] font-black text-[#454040]/60 uppercase tracking-widest truncate">{moduleName}</span>
                                        {log.status === LogStatus.DRAFT && totalStudents > 0 && (
                                            <span className="text-[8px] bg-[#454040]/5 text-[#454040] px-2 py-0.5 rounded-full font-black border border-[#454040]/10 uppercase tracking-widest">
                                                {submittedStudents}/{totalStudents} Submissions
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-[#454040] truncate uppercase tracking-tight">{log.summaryNote || 'Record of session data'}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-[11px] font-black text-gray-300 tabular-nums tracking-tighter uppercase">{log.durationMinutes} min</span>
                                    {(log.status === LogStatus.REJECTED || log.status === LogStatus.PENDING || log.status === LogStatus.DRAFT) && (
                                        <button 
                                            onClick={() => onEditLog(log)} 
                                            className="p-2 bg-white text-[#454040] rounded-xl hover:bg-[#454040] hover:text-white transition-all shadow-sm border border-gray-100"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {myLogs.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <History size={40} className="text-gray-200" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">No logs recorded yet</p>
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
