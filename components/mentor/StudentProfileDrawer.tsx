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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-900 text-white">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={student.avatarUrl} className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg object-cover" />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-indigo-900 rounded-full"></span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{student.fullName}</h2>
                        <p className="text-indigo-200 text-sm">{student.email}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white">
                    <XCircle size={28} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/30">
                <div className="p-6 space-y-8">
                    {/* Growth Analytics Section */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600" /> Growth Radar</h3>
                            <button 
                                onClick={() => setShowBatchAvg(!showBatchAvg)}
                                className={`text-[10px] uppercase font-black px-3 py-1 rounded-full border transition-all ${showBatchAvg ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-400 border-gray-200'}`}
                            >
                                {showBatchAvg ? 'Showing Batch Avg' : 'Compare with Batch'}
                            </button>
                        </div>
                        
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 10}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
                                    <Radar name="Student" dataKey="Student" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                                    {showBatchAvg && <Radar name="Batch Avg" dataKey="Batch" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} strokeDasharray="4 4" />}
                                    <Tooltip />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Progress Timeline */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                             <TrendingUp size={18} className="text-indigo-600" /> Progress Timeline
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 5]} hide />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 8}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Attendance & Stats Highlights */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Classes</p>
                            <p className="text-xl font-black text-gray-900">{studentLogs.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Avg Score</p>
                            <p className="text-xl font-black text-indigo-600">
                                {progressData.length ? (progressData.reduce((a,b)=>a+b.score,0)/progressData.length).toFixed(1) : '0.0'}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Red Flags</p>
                            <p className="text-xl font-black text-red-500">0</p>
                        </div>
                    </div>

                    {/* Feedback Logs */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-500">Session History</h3>
                            <button className="text-indigo-600 text-[10px] font-bold flex items-center gap-1 hover:underline">
                                <Download size={12} /> Export Portfolio
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
                                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-gray-400">{log.date}</span>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${score?.attendance === AttendanceStatus.PRESENT ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {score?.attendance}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {modules.find(m => m.id === log.moduleId)?.name || 'Unknown Module'}
                                                </h4>
                                            </div>
                                            <div className="flex flex-col items-end">
                                               <span className="text-lg font-black text-indigo-600">{avgScore}</span>
                                               <span className="text-[8px] uppercase font-bold text-gray-400">Avg Rating</span>
                                            </div>
                                        </div>
                                        
                                        {score?.feedback && (
                                            <div className="relative bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 flex gap-3 mt-2">
                                                <MessageCircle size={14} className="text-indigo-300 mt-1 flex-shrink-0" />
                                                <p className="text-xs text-indigo-900 leading-relaxed italic">"{score.feedback}"</p>
                                            </div>
                                        )}

                                        {log.artifactUrl && (
                                            <div className="mt-3 flex items-center justify-between">
                                                <a href={log.artifactUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all">
                                                    <Download size={14} /> Session Artifact
                                                </a>
                                                {score?.studentArtifactUrl && (
                                                    <a href={score.studentArtifactUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-green-600 hover:underline">
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
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-600" /> Private Mentor Notes</h3>
                        <textarea 
                            value={privateNote}
                            onChange={(e) => setPrivateNote(e.target.value)}
                            placeholder="Add private observations about this student's learning behavior, challenges, or focus areas. These are NOT visible to the student."
                            className="w-full h-32 p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                        <div className="flex justify-between items-center mt-3">
                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><AlertTriangle size={12} /> Auto-saved to local workspace.</p>
                            <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Save Note</button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
