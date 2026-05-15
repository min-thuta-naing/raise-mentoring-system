import React, { useState, useMemo } from 'react';
import { XCircle, TrendingUp, Clock, Calendar, CheckCircle, AlertTriangle, MessageSquare, Download, MessageCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MentoringLog, User, Module, LogStatus, AttendanceStatus } from '../../types';

interface StudentProfileDrawerProps {
    student: User; 
    logs: MentoringLog[];
    allLogs: MentoringLog[]; // For batch comparison
    modules: Module[];
    onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ student, logs, allLogs, modules, onClose }) => {
    const [showBatchAvg, setShowBatchAvg] = useState(false);
    const [privateNote, setPrivateNote] = useState('');

    // 1. Filter logs for this student
    const studentLogs = useMemo(() => 
        logs
            .filter(l => l.status === LogStatus.APPROVED && l.scores.some(s => s.studentId === student.id))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [logs, student.id]);

    // 2. Calculate Radar Data (Student vs Batch)
    const radarData = useMemo(() => {
        const studentTotals: Record<string, { sum: number, count: number }> = {};
        studentLogs.forEach(log => {
            const score = log.scores.find(s => s.studentId === student.id);
            if (score && score.attendance !== AttendanceStatus.ABSENT) {
                Object.entries(score.metrics).forEach(([key, value]) => {
                    if (!studentTotals[key]) studentTotals[key] = { sum: 0, count: 0 };
                    studentTotals[key].sum += (value as number);
                    studentTotals[key].count += 1;
                });
            }
        });

        const batchTotals: Record<string, { sum: number, count: number }> = {};
        if (showBatchAvg) {
            allLogs.filter(l => l.status === LogStatus.APPROVED).forEach(log => {
                log.scores.forEach(score => {
                    if (score.attendance !== AttendanceStatus.ABSENT) {
                         Object.entries(score.metrics).forEach(([key, value]) => {
                            if (!batchTotals[key]) batchTotals[key] = { sum: 0, count: 0 };
                            batchTotals[key].sum += (value as number);
                            batchTotals[key].count += 1;
                        });
                    }
                });
            });
        }

        const allKeys = new Set([...Object.keys(studentTotals), ...Object.keys(batchTotals)]);
        
        return Array.from(allKeys).map(key => ({
            subject: key,
            Student: studentTotals[key] ? (studentTotals[key].sum / studentTotals[key].count) : 0,
            Batch: batchTotals[key] ? (batchTotals[key].sum / batchTotals[key].count) : 0,
            fullMark: 5
        }));
    }, [studentLogs, student.id, allLogs, showBatchAvg]);

    // 3. Calculate Line Data (Progress over time)
    const progressData = useMemo(() => {
        return studentLogs.reduce((acc, log) => {
            const score = log.scores.find(s => s.studentId === student.id);
            if (!score || score.attendance === AttendanceStatus.ABSENT) return acc;
            
            const values = Object.values(score.metrics) as number[];
            const avg = values.length ? values.reduce((a,b) => a+b,0)/values.length : 0;
            const moduleName = modules.find(m => m.id === log.moduleId)?.name || log.moduleId;

            acc.push({
                date: log.date,
                score: parseFloat(avg.toFixed(2)),
                module: moduleName
            });
            return acc;
        }, [] as { date: string; score: number; module: string }[]);
    }, [studentLogs, student.id, modules]);

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[60] flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#454040] text-white">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <img src={student.avatarUrl} className="w-14 h-14 rounded-[1.2rem] border-2 border-white/20 shadow-lg object-cover" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-[#454040] rounded-full"></span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic">{student.fullName}</h2>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">{student.email}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
                    <XCircle size={24} />
                </button>
            </div>

                <div className="p-6 space-y-6">
                    {/* Growth Analytics Section */}
                    <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-[#454040] flex items-center gap-3 uppercase tracking-tighter italic text-sm"><TrendingUp size={18} /> Growth Radar</h3>
                            <button 
                                onClick={() => setShowBatchAvg(!showBatchAvg)}
                                className={`text-[8px] uppercase font-black px-3 py-1.5 rounded-full border transition-all tracking-widest ${showBatchAvg ? 'bg-[#454040] text-white border-[#454040] shadow-lg shadow-[#454040]/20' : 'text-gray-300 border-gray-100 hover:border-[#454040]/30 hover:text-[#454040]'}`}
                            >
                                {showBatchAvg ? 'Showing Batch' : 'Batch Comparison'}
                            </button>
                        </div>
                        
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#f1f5f9" />
                                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
                                    <Radar name="Student" dataKey="Student" stroke="#454040" fill="#454040" fillOpacity={0.6} />
                                    {showBatchAvg && <Radar name="Batch Avg" dataKey="Batch" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.15} strokeDasharray="4 4" />}
                                    <Tooltip />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Progress Timeline */}
                    <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#454040] mb-6 flex items-center gap-3 uppercase tracking-tighter italic text-sm">
                             <TrendingUp size={18} strokeWidth={3} /> Progress Timeline
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="#454040" strokeWidth={4} dot={{r: 5, fill: '#454040', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Attendance & Stats Highlights */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-50 text-center shadow-sm">
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-1.5">Total Classes</p>
                            <p className="text-lg font-black text-[#454040] italic tracking-tighter">{studentLogs.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-50 text-center shadow-sm">
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-1.5">Avg Rating</p>
                            <p className="text-lg font-black text-[#454040] italic tracking-tighter">
                                {progressData.length ? (progressData.reduce((a,b)=>a+b.score,0)/progressData.length).toFixed(1) : '0.0'}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-50 text-center shadow-sm">
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mb-1.5">Red Flags</p>
                            <p className="text-lg font-black text-red-500 italic tracking-tighter">0</p>
                        </div>
                    </div>

                    {/* Feedback Logs */}
                    <section className="bg-white rounded-[1.5rem] shadow-sm border border-gray-50 overflow-hidden">
                        <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-gray-400">Session History</h3>
                            <button className="text-[#454040] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                                <Download size={14} /> Export Portfolio
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {[...studentLogs].reverse().map((log) => {
                                const score = log.scores.find(s => s.studentId === student.id);
                                const metricsValues = score ? Object.values(score.metrics) : [];
                                let totalScore = 0;
                                metricsValues.forEach(v => { totalScore += Number(v) || 0; });
                                
                                const avgScore = metricsValues.length > 0 
                                    ? (totalScore / metricsValues.length).toFixed(1) 
                                    : '0.0';
                                
                                return (
                                    <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{log.date}</span>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${score?.attendance === AttendanceStatus.PRESENT ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {score?.attendance}
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-[#454040] group-hover:italic transition-all uppercase tracking-tighter text-base">
                                                    {modules.find(m => m.id === log.moduleId)?.name || 'Unknown Module'}
                                                </h4>
                                            </div>
                                            <div className="flex flex-col items-end">
                                               <span className="text-2xl font-black text-[#454040] italic tracking-tighter">{avgScore}</span>
                                               <span className="text-[8px] uppercase font-black text-gray-300 tracking-widest">Rating</span>
                                            </div>
                                        </div>
                                        
                                        {score?.feedback && (
                                            <div className="relative bg-gray-50 p-4 rounded-[1.2rem] border border-gray-100 flex gap-4 mt-4">
                                                <MessageCircle size={16} className="text-gray-300 mt-1 flex-shrink-0" />
                                                <p className="text-[13px] text-[#454040] leading-relaxed italic font-medium">"{score.feedback}"</p>
                                            </div>
                                        )}

                                        {log.artifactUrl && (
                                            <div className="mt-6 flex items-center justify-between">
                                                <a href={log.artifactUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#454040] hover:bg-[#454040] hover:text-white bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-all">
                                                    <Download size={16} /> Session Artifact
                                                </a>
                                                {score?.studentArtifactUrl && (
                                                    <a href={score.studentArtifactUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:underline">
                                                        Student Submission
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Private Mentor Notes */}
                    <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#454040] mb-5 flex items-center gap-3 uppercase tracking-tighter italic text-sm"><MessageSquare size={18} /> Private Notes</h3>
                        <textarea 
                            value={privateNote}
                            onChange={(e) => setPrivateNote(e.target.value)}
                            placeholder="Add private observations..."
                            className="w-full h-24 p-5 text-xs bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all"
                        />
                        <div className="flex justify-between items-center mt-3">
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={12} className="opacity-50" /> Local storage</p>
                            <button className="text-[9px] font-black text-[#454040] uppercase tracking-widest hover:underline">Save Note</button>
                        </div>
                    </section>
                </div>
            </div>
    );
};
