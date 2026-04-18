import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { LogStatus, MentoringLog, ActivityType, LessonPlan, User, Role, Group, AttendanceStatus, Module, PlanStatus } from '../types';
import { 
  Bell, BookOpen, Calendar, CheckCircle, Clock, FileText, 
  LayoutDashboard, PieChart, Search, TrendingUp, 
  Upload, XCircle, ChevronRight, PlayCircle, Users, Filter,
  GraduationCap, MessageSquare, AlertTriangle, Layers,
  Menu, List, History, AlertOctagon, FolderOpen, MoreVertical,
  Download, MessageCircle, Edit3, ArrowUpDown, Lock
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { MentorProfile } from './profile/MentorProfile';
import { Layout } from './Layout';
import { MentorLogForm } from './MentorLogForm';

// --- Sub-Components ---

const StudentProfileDrawer: React.FC<{ 
    student: User; 
    logs: MentoringLog[];
    allLogs: MentoringLog[]; // For batch comparison
    modules: Module[];
    onClose: () => void 
}> = ({ student, logs, allLogs, modules, onClose }) => {
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
        // A. Student Data
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

        // B. Batch Data (If enabled)
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
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-end backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col transform transition-transform duration-300 ease-in-out animate-slide-in-right">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-4">
                        <img src={student.avatarUrl} alt={student.fullName} className="w-16 h-16 rounded-full border-4 border-indigo-50" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{student.fullName}</h2>
                            <p className="text-gray-500 text-sm flex items-center gap-2">
                                <GraduationCap size={16} /> Student Profile
                                <span className="text-gray-300">|</span>
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{studentLogs.length} Sessions</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <XCircle size={28} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* 1. Radar Chart with Comparison */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <PieChart size={18} className="text-indigo-500" /> Competency Map
                            </h3>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={showBatchAvg} 
                                    onChange={e => setShowBatchAvg(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-600">Compare with Batch Avg</span>
                            </label>
                        </div>
                        <div className="h-72">
                            {radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                        <Radar name="Student" dataKey="Student" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
                                        {showBatchAvg && (
                                            <Radar name="Batch Avg" dataKey="Batch" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} strokeDasharray="4 4" />
                                        )}
                                        <Tooltip />
                                        <Legend />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* 2. Private Note */}
                    <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
                        <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <Lock size={16} /> Private Quick Note
                        </h3>
                        <textarea 
                            className="w-full bg-white border border-yellow-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                            placeholder="Add a private note about this student (strengths, weaknesses, things to remember)..."
                            rows={3}
                            value={privateNote}
                            onChange={(e) => setPrivateNote(e.target.value)}
                        />
                         <div className="flex justify-end mt-2">
                             <button className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded font-medium hover:bg-yellow-200">Save Note</button>
                         </div>
                    </div>

                    {/* 3. Performance Timeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-500" /> Performance Timeline
                        </h3>
                        <div className="h-48">
                            {progressData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{fontSize: 10}} 
                                            tickMargin={10} 
                                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                                        />
                                        <YAxis domain={[0, 5]} hide />
                                        <Tooltip labelStyle={{color: '#333'}} itemStyle={{color: '#10b981'}} />
                                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                            )}
                        </div>
                    </div>

                    {/* 4. Feedback History */}
                    <div>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-orange-500" /> Feedback History
                        </h3>
                        <div className="space-y-3">
                            {studentLogs.length === 0 && <p className="text-gray-400 italic">No recorded sessions yet.</p>}
                            {studentLogs.map(log => {
                                const moduleName = modules.find(m => m.id === log.moduleId)?.name;
                                const studentScore = log.scores.find(s => s.studentId === student.id);
                                return (
                                    <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{log.date}</span>
                                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">{moduleName}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {log.artifactUrl && (
                                                    <a href={log.artifactUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                                        <FileText size={12} /> Mentor Link
                                                    </a>
                                                )}
                                                {studentScore?.studentArtifactUrl && (
                                                    <a href={studentScore.studentArtifactUrl} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-green-600 hover:underline">
                                                        <FileText size={12} /> Student Link
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 italic mb-3">"{log.summaryNote}"</p>
                                        
                                        {studentScore?.studentReflection && (
                                            <div className="bg-white p-3 rounded border border-gray-200 mt-2">
                                                <p className="text-xs font-bold text-gray-500 mb-1">Student Reflection:</p>
                                                <p className="text-sm text-gray-800">"{studentScore.studentReflection}"</p>
                                            </div>
                                        )}
                                        
                                        <div className="mt-3 flex items-center gap-2">
                                            {studentScore?.isFeedbackAcknowledged ? (
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                                                    <CheckCircle size={12} /> Acknowledged
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                                                    <Bell size={12} /> Pending Acknowledgment
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentDirectory: React.FC<{
    users: User[];
    groups: Group[];
    modules: Module[];
    currentUserId: string;
    logs: MentoringLog[];
    onSelectStudent: (s: User) => void;
}> = ({ users, groups, modules, currentUserId, logs, onSelectStudent }) => {
    // Filter States
    const [filterMode, setFilterMode] = useState<'ALL' | 'MY_GROUPS'>('MY_GROUPS');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'NAME' | 'SCORE_DESC' | 'ATTENDANCE_DESC'>('NAME');
    
    // Comparison State
    const [compareMode, setCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const allStudents = users.filter(u => u.role === Role.STUDENT);
    const myGroups = useMemo(() => groups.filter(g => g.mentorIds.includes(currentUserId)), [groups, currentUserId]);
    const myModules = useMemo(() => {
        const myModuleIds = new Set(myGroups.map(g => g.moduleId));
        return modules.filter(m => myModuleIds.has(m.id));
    }, [myGroups, modules]);
    
    // Logic to calculate Stats for each student (Memoized)
    const studentStats = useMemo(() => {
        const stats = new Map<string, { avg: number, attendance: number, isRedFlag: boolean }>();
        
        allStudents.forEach(s => {
            const sLogs = logs.filter(l => l.scores.some(score => score.studentId === s.id));
            const totalSessions = sLogs.length;
            
            if (totalSessions === 0) {
                stats.set(s.id, { avg: 0, attendance: 0, isRedFlag: false });
                return;
            }

            let totalScore = 0;
            let presentCount = 0;
            
            sLogs.forEach(l => {
                const score = l.scores.find(sc => sc.studentId === s.id);
                if (score) {
                    if (score.attendance !== AttendanceStatus.ABSENT) {
                        presentCount++;
                        const metrics = Object.values(score.metrics) as number[];
                        const sessionAvg = metrics.length ? metrics.reduce((a,b) => a+b, 0) / metrics.length : 0;
                        totalScore += sessionAvg;
                    }
                }
            });

            // Calculate Avg based on PRESENT sessions only for score, but total sessions for attendance
            const effectiveSessions = presentCount || 1; 
            const avg = totalScore / effectiveSessions; 
            const attendance = (presentCount / totalSessions) * 100;
            const isRedFlag = avg < 2.5 || attendance < 80;

            stats.set(s.id, { avg, attendance, isRedFlag });
        });
        return stats;
    }, [allStudents, logs]);

    const displayedStudents = useMemo(() => {
        let list = allStudents;
        
        // 1. Toggle Filter
        if (filterMode === 'MY_GROUPS') {
            const allMyStudentIds = myGroups.flatMap(g => g.studentIds);
            list = list.filter(s => allMyStudentIds.includes(s.id));
        }

        // 2. Dropdown Filters
        if (selectedModuleId) {
             const moduleGroups = groups.filter(g => g.moduleId === selectedModuleId);
             const studentIdsInModule = moduleGroups.flatMap(g => g.studentIds);
             list = list.filter(s => studentIdsInModule.includes(s.id));
        }
        if (selectedGroupId) {
             const grp = groups.find(g => g.id === selectedGroupId);
             if (grp) list = list.filter(s => grp.studentIds.includes(s.id));
        }

        // 3. Search
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            list = list.filter(s => s.fullName.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower));
        }

        // 4. Sort
        list = list.sort((a, b) => {
            const statA = studentStats.get(a.id);
            const statB = studentStats.get(b.id);
            
            if (sortBy === 'NAME') return a.fullName.localeCompare(b.fullName);
            if (sortBy === 'SCORE_DESC') return (statB?.avg || 0) - (statA?.avg || 0);
            if (sortBy === 'ATTENDANCE_DESC') return (statB?.attendance || 0) - (statA?.attendance || 0);
            return 0;
        });

        return list;
    }, [allStudents, filterMode, selectedModuleId, selectedGroupId, searchQuery, sortBy, myGroups, groups, studentStats]);

    const handleCompareToggle = (id: string) => {
        if (selectedForCompare.includes(id)) {
            setSelectedForCompare(prev => prev.filter(s => s !== id));
        } else {
            if (selectedForCompare.length >= 3) {
                alert("You can compare up to 3 students max.");
                return;
            }
            setSelectedForCompare(prev => [...prev, id]);
        }
    };

    // Calculate Comparison Data (Radar Overlay)
    const comparisonData = useMemo(() => {
        if (!showCompareModal) return [];
        
        const studentsToCompare = users.filter(u => selectedForCompare.includes(u.id));
        const allSubjects = new Set<string>();
        
        const getStudentAvg = (studentId: string) => {
             const studentLogs = logs.filter(l => l.scores.some(s => s.studentId === studentId));
             const totals: Record<string, {sum:number, count:number}> = {};
             
             studentLogs.forEach(l => {
                 const score = l.scores.find(s => s.studentId === studentId);
                 if(score && score.attendance !== AttendanceStatus.ABSENT) {
                     Object.entries(score.metrics).forEach(([k, v]) => {
                         allSubjects.add(k);
                         if(!totals[k]) totals[k] = {sum:0, count:0};
                         totals[k].sum += (v as number);
                         totals[k].count++;
                     });
                 }
             });
             
             const avgs: Record<string, number> = {};
             Object.keys(totals).forEach(k => {
                 avgs[k] = totals[k].sum / totals[k].count;
             });
             return avgs;
        };

        const studentsData = studentsToCompare.map(s => ({
            id: s.id,
            name: s.fullName,
            avgs: getStudentAvg(s.id),
        }));

        return Array.from(allSubjects).map(subject => {
            const entry: any = { subject, fullMark: 5 };
            studentsData.forEach(s => {
                entry[s.name] = s.avgs[subject] || 0;
            });
            return entry;
        });

    }, [showCompareModal, selectedForCompare, logs, users]);

    return (
        <div className="space-y-6 animate-fade-in relative pb-20">
            {/* 1. Top Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => { setFilterMode('ALL'); setSelectedGroupId(''); }}
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filterMode === 'ALL' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users size={16} /> All Students
                        </button>
                        <button 
                            onClick={() => { setFilterMode('MY_GROUPS'); if(myGroups.length > 0) setSelectedGroupId(myGroups[0].id); }}
                            className={`px-6 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${filterMode === 'MY_GROUPS' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Filter size={16} /> My Groups
                        </button>
                    </div>

                    {/* Group Action Tools (Only for My Groups) */}
                    {filterMode === 'MY_GROUPS' && (
                        <div className="flex gap-2">
                             <button className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                 <Download size={14} /> Report
                             </button>
                             <button className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                                 <MessageCircle size={14} /> Group Chat
                             </button>
                             <button className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors">
                                 <Edit3 size={14} /> Bulk Assess
                             </button>
                        </div>
                    )}
                </div>
                
                <div className="h-px bg-gray-100 w-full"></div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Module/Group Dropdowns */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <select 
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="rounded-lg border-gray-300 text-sm p-2 border focus:ring-2 focus:ring-indigo-500 w-1/2 md:w-40"
                        >
                            <option value="">All Modules</option>
                            {myModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <select 
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="rounded-lg border-gray-300 text-sm p-2 border focus:ring-2 focus:ring-indigo-500 w-1/2 md:w-40"
                        >
                            <option value="">All Groups</option>
                            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search by name or ID..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 rounded-lg border-gray-300 text-sm p-2 border focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Sort & Compare */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative">
                            <ArrowUpDown className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="pl-8 rounded-lg border-gray-300 text-sm p-2 border focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer bg-white"
                            >
                                <option value="NAME">Name (A-Z)</option>
                                <option value="SCORE_DESC">Score (High-Low)</option>
                                <option value="ATTENDANCE_DESC">Attendance %</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
                            className={`px-3 py-2 text-sm font-bold rounded-lg border flex items-center gap-2 transition-colors whitespace-nowrap ${compareMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-300 text-gray-600'}`}
                        >
                            <Layers size={16} /> Compare
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Comparison Bar */}
            {compareMode && selectedForCompare.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-40 flex items-center gap-4 animate-bounce-in">
                    <span className="text-sm font-bold">{selectedForCompare.length} Selected</span>
                    <button 
                        onClick={() => setShowCompareModal(true)}
                        disabled={selectedForCompare.length < 2}
                        className={`bg-indigo-500 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-400 transition-colors ${selectedForCompare.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Compare Now
                    </button>
                    <button onClick={() => setSelectedForCompare([])} className="text-gray-400 hover:text-white"><XCircle size={20}/></button>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedStudents.map(student => {
                    const stats = studentStats.get(student.id);
                    const isSelected = selectedForCompare.includes(student.id);
                    
                    return (
                        <div 
                            key={student.id} 
                            className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col
                                ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'}
                                ${stats?.isRedFlag ? 'border-l-4 border-l-red-500' : ''}
                            `}
                            onClick={() => {
                                if (compareMode) handleCompareToggle(student.id);
                                else onSelectStudent(student);
                            }}
                        >
                            {compareMode && (
                                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors z-10 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                    {isSelected && <CheckCircle size={14} className="text-white" />}
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="p-4 flex items-center gap-4">
                                <div className="relative">
                                    <img src={student.avatarUrl} alt={student.fullName} className="w-12 h-12 rounded-full bg-gray-100" />
                                    {stats?.isRedFlag && (
                                        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-0.5 rounded-full border-2 border-white" title="Red Flag: Low Performance">
                                            <AlertOctagon size={12} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{student.fullName}</h4>
                                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                    <div className="mt-1 flex gap-1 flex-wrap">
                                         {groups.filter(g => g.studentIds.includes(student.id)).map(g => (
                                             <span key={g.id} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">{g.name}</span>
                                         ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Card Stats */}
                            <div className="mt-auto border-t border-gray-50 bg-gray-50/50 p-3 flex justify-between items-center text-xs">
                                 <div className="text-center flex-1 border-r border-gray-200">
                                     <div className={`font-bold text-lg ${stats?.avg && stats.avg < 2.5 ? 'text-red-600' : 'text-gray-800'}`}>
                                         {stats?.avg ? stats.avg.toFixed(1) : '-'}
                                     </div>
                                     <div className="text-gray-400">Avg Score</div>
                                 </div>
                                 <div className="text-center flex-1">
                                     <div className={`font-bold text-lg ${stats?.attendance && stats.attendance < 80 ? 'text-orange-500' : 'text-gray-800'}`}>
                                         {stats?.attendance ? Math.round(stats.attendance) : 0}%
                                     </div>
                                     <div className="text-gray-400">Attendance</div>
                                 </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {displayedStudents.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                     <Users size={48} className="mx-auto text-gray-300 mb-4" />
                     <p className="text-gray-500 font-medium">No students found matching your filters.</p>
                     <button onClick={() => { setFilterMode('ALL'); setSearchQuery(''); setSelectedGroupId(''); }} className="mt-2 text-indigo-600 text-sm font-bold hover:underline">Clear Filters</button>
                </div>
            )}

            {/* Comparison Modal */}
            {showCompareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 relative">
                        <button onClick={() => setShowCompareModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Layers size={24} /> Student Comparison</h2>
                        
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={comparisonData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                    <Tooltip />
                                    <Legend />
                                    {users.filter(u => selectedForCompare.includes(u.id)).map((s, idx) => (
                                        <Radar 
                                            key={s.id}
                                            name={s.fullName} 
                                            dataKey={s.fullName} 
                                            stroke={idx === 0 ? '#4f46e5' : idx === 1 ? '#10b981' : '#f59e0b'} 
                                            fill={idx === 0 ? '#4f46e5' : idx === 1 ? '#10b981' : '#f59e0b'} 
                                            fillOpacity={0.3} 
                                        />
                                    ))}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---

export const MentorDashboard: React.FC = () => {
    const { currentUser, lessonPlans, logs, modules, users, groups } = useData();
    const navigate = useNavigate();
    
    // Selection States
    const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
    const [selectedLogToEdit, setSelectedLogToEdit] = useState<MentoringLog | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    // --- Derived Data ---
    const today = new Date().toISOString().split('T')[0];
    const myLogs = logs.filter(l => l.mentorId === currentUser.id);
    const pendingLogs = myLogs.filter(l => l.status === LogStatus.PENDING);
    const approvedLogs = myLogs.filter(l => l.status === LogStatus.APPROVED);
    const myGroups = groups.filter(g => g.mentorIds.includes(currentUser.id));
    
    const todaysClasses = lessonPlans.filter(p => p.mentorId === currentUser.id && p.date === today && p.status === PlanStatus.PUBLISHED);
    const nextClass = todaysClasses.sort((a,b) => a.startTime.localeCompare(b.startTime))[0];
    
    const totalMinutes = approvedLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    const totalHours = totalMinutes / 60;
    const lectureHours = (totalHours * 0.4).toFixed(1);
    const practiceHours = (totalHours * 0.6).toFixed(1);

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
        }).filter(item => item && item.avg < 2.5) as { user: User, avg: number }[];
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
        navigate('/mentor/entry');
    };

    const handleLogSuccess = () => {
        navigate('/mentor/logs');
        setSelectedPlan(null);
        setSelectedLogToEdit(null);
    };

    // --- Sub-Views ---
    
    const DashboardHome = () => (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Hours</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-indigo-900">{totalHours.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">hrs</span>
                    </div>
                    <div className="flex gap-2 mt-2 text-[10px] font-medium text-gray-500">
                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">L: {lectureHours}</span>
                        <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded">P: {practiceHours}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Pending Logs</p>
                    <span className="text-2xl font-bold text-yellow-600">{pendingLogs.length}</span>
                    <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Active Groups</p>
                    <span className="text-2xl font-bold text-gray-800">{myGroups.length}</span>
                    <p className="text-xs text-gray-400 mt-1">Under supervision</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-gray-500 font-bold uppercase mb-1">My Progress</p>
                     <span className="text-2xl font-bold text-green-600">--%</span>
                     <p className="text-xs text-gray-400 mt-1">Of planned sessions</p>
                </div>
            </div>

            {/* Today's Action (Hero) */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Calendar className="w-5 h-5 text-indigo-200" />
                             <span className="font-bold text-indigo-100 uppercase tracking-wide text-sm">Today's Action</span>
                        </div>
                        {nextClass ? (
                            <>
                                <h2 className="text-2xl font-bold mb-1">{modules.find(m => m.id === nextClass.moduleId)?.name || "Unknown Module"}</h2>
                                <p className="text-indigo-200 text-sm flex items-center gap-2">
                                    <Clock size={14} /> {nextClass.startTime} - {nextClass.endTime} 
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full mx-1"></span>
                                    {nextClass.topic}
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-1">No Classes Scheduled</h2>
                                <p className="text-indigo-200 text-sm">You're all clear for today! Or record an extra session.</p>
                            </>
                        )}
                    </div>
                    <button 
                        onClick={() => handleStartLog(nextClass)}
                        className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <PlayCircle size={20} />
                        {nextClass ? 'Record Log Now' : 'Record Extra Log'}
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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><PieChart size={18} className="text-indigo-500" /> Group Competency</h3>
                        <span className="text-xs text-gray-400">Average of all your students</span>
                    </div>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
                                <Radar name="Group Avg" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-red-600"><AlertOctagon size={18} /> Red Flag Alerts</h3>
                    {redFlagStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-200" />
                            <p className="text-sm">All students are performing well.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {redFlagStudents.map(({ user, avg }) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{user.fullName}</p>
                                        <p className="text-xs text-red-500 font-bold">Avg Score: {avg.toFixed(1)}</p>
                                    </div>
                                    <button 
                                        onClick={() => { navigate('/mentor/students'); setSelectedStudent(user); }}
                                        className="ml-auto text-xs bg-white text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><History size={18} /> Recent Activity</h3>
                    <button onClick={() => navigate('/mentor/logs')} className="text-xs text-indigo-600 font-medium hover:underline">View All</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {myLogs.slice(0, 5).map(log => {
                        const moduleName = modules.find(m => m.id === log.moduleId)?.name;
                        const totalStudents = log.scores.length;
                        const submittedStudents = log.scores.filter(s => s.studentArtifactUrl || s.studentReflection).length;
                        
                        return (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${log.status === LogStatus.APPROVED ? 'bg-green-500' : log.status === LogStatus.PENDING ? 'bg-yellow-400' : log.status === LogStatus.DRAFT ? 'bg-gray-400' : 'bg-red-500'}`}></span>
                                        <span className="text-xs font-bold text-gray-500 uppercase">{log.date}</span>
                                        <span className="text-xs text-gray-300">|</span>
                                        <span className="text-xs font-medium text-indigo-600">{moduleName}</span>
                                        {log.status === LogStatus.DRAFT && totalStudents > 0 && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                                                {submittedStudents}/{totalStudents} Submitted
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{log.summaryNote || 'No summary provided'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-600">{log.durationMinutes} min</span>
                                    {(log.status === LogStatus.REJECTED || log.status === LogStatus.PENDING || log.status === LogStatus.DRAFT) && (
                                        <button onClick={() => handleEditLog(log)} className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-white">Edit</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {myLogs.length === 0 && <div className="p-8 text-center text-gray-400">No logs recorded yet.</div>}
                </div>
            </div>
        </div>
    );

    const ScheduleView = () => {
        const sortedPlans = useMemo(() => {
            return lessonPlans
                .filter(p => p.mentorId === currentUser.id && p.status === PlanStatus.PUBLISHED)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }, [lessonPlans, currentUser.id]);

        const groupedPlans = useMemo(() => {
            const groups: Record<string, LessonPlan[]> = {};
            sortedPlans.forEach(plan => {
                if (!groups[plan.moduleId]) groups[plan.moduleId] = [];
                groups[plan.moduleId].push(plan);
            });
            return groups;
        }, [sortedPlans]);

        // Order modules by their first appearing lesson plan's date
        const moduleOrder = useMemo(() => {
            return Object.keys(groupedPlans).sort((a, b) => {
                const dateA = new Date(groupedPlans[a][0].date).getTime();
                const dateB = new Date(groupedPlans[b][0].date).getTime();
                return dateA - dateB;
            });
        }, [groupedPlans]);

        return (
            <div className="space-y-8 animate-fade-in pb-20">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg">
                        <Calendar size={24} />
                    </div>
                    My Schedule
                 </h2>
                 
                 {moduleOrder.length === 0 ? (
                     <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                             <Calendar size={32} className="text-gray-200" />
                         </div>
                         <p className="font-medium">No published classes scheduled.</p>
                         <p className="text-xs mt-1">Draft plans from admin are not visible here.</p>
                     </div>
                 ) : (
                     <div className="space-y-12">
                         {moduleOrder.map(moduleId => {
                             const mod = modules.find(m => m.id === moduleId);
                             const plans = groupedPlans[moduleId];
                             
                             return (
                                 <div key={moduleId} className="relative">
                                     {/* Module Header */}
                                     <div className="flex items-center gap-4 mb-6 sticky top-0 bg-gray-50/80 backdrop-blur-md py-2 z-10">
                                         <div className="h-px bg-gray-200 flex-1"></div>
                                         <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                             <FolderOpen size={16} className="text-indigo-500" />
                                             <span className="text-sm font-black text-indigo-900 uppercase tracking-wider">{mod?.name || 'Unknown Module'}</span>
                                             <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{plans.length} Sessions</span>
                                         </div>
                                         <div className="h-px bg-gray-200 flex-1"></div>
                                     </div>

                                     <div className="grid gap-4">
                                         {plans.map(plan => {
                                             const isPast = plan.date < today;
                                             const isLogged = myLogs.some(l => l.date === plan.date && l.startTime === plan.startTime);
                                             
                                             return (
                                                 <div key={plan.id} className={`group bg-white p-5 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isPast && !isLogged ? 'border-red-200 bg-red-50/30' : 'border-gray-100 shadow-sm'}`}>
                                                     <div className="flex gap-4 items-start">
                                                         <div className={`p-3 rounded-xl flex flex-col items-center justify-center min-w-[70px] ${isPast && !isLogged ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                             <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(plan.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                             <span className="text-xl font-black">{new Date(plan.date).getDate()}</span>
                                                         </div>
                                                         <div>
                                                             <div className="flex items-center gap-2 text-xs mb-1 font-bold">
                                                                 <span className="text-gray-900">{plan.date}</span>
                                                                 <span className="text-gray-300">|</span>
                                                                 <span className="text-gray-600 flex items-center gap-1"><Clock size={12} /> {plan.startTime} - {plan.endTime}</span>
                                                                 {isPast && !isLogged && (
                                                                    <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse transition-all">
                                                                        <AlertOctagon size={10} /> Overdue
                                                                    </span>
                                                                 )}
                                                             </div>
                                                             <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{plan.topic}</h3>
                                                             <div className="flex items-center gap-2 mt-1">
                                                                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${plan.activityType === ActivityType.LECTURE ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                                     {plan.activityType}
                                                                 </span>
                                                             </div>
                                                         </div>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                         {!isLogged && (
                                                             <button 
                                                                 onClick={() => handleStartLog(plan)}
                                                                 className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                             >
                                                                 <PlayCircle size={18} /> Log Session
                                                             </button>
                                                         )}
                                                         {isLogged && (
                                                             <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                                                 <CheckCircle size={18} /> Completed
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 )}
            </div>
        );
    };
    
    const MaterialsView = () => (
        <div className="animate-fade-in space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FolderOpen className="text-indigo-600" /> Teaching Materials</h2>
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                 <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300">
                     <Upload size={32} />
                 </div>
                 <h3 className="font-bold text-gray-700">My Material Library</h3>
                 <p className="text-sm text-gray-500 mt-2 mb-6">Upload slides, PDFs, or link resources for your classes here.</p>
                 <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Upload New File</button>
            </div>
            
            {/* Auto-extracted from logs */}
            <h3 className="font-bold text-gray-700 mt-8">Recent Artifacts from Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myLogs.filter(l => l.artifactUrl).slice(0,6).map(l => (
                    <a key={l.id} href={l.artifactUrl} target="_blank" rel="noreferrer" className="block bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-300 transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                             <FileText className="text-gray-400 group-hover:text-indigo-500" />
                             <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{l.date}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 truncate">{l.summaryNote}</p>
                        <p className="text-xs text-indigo-500 truncate mt-1">{l.artifactUrl}</p>
                    </a>
                ))}
            </div>
        </div>
    );

    const HistoryView = () => (
        <div className="animate-fade-in space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><History className="text-indigo-600" /> Log History</h2>
                <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-bold">
                    <span className="px-3 py-1 bg-white shadow rounded text-gray-800">All</span>
                    <span className="px-3 py-1 text-gray-500">Pending</span>
                    <span className="px-3 py-1 text-gray-500">Verified</span>
                </div>
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 {myLogs.length === 0 ? (
                     <div className="p-8 text-center text-gray-400">No history found.</div>
                 ) : (
                     <table className="w-full text-left text-sm">
                         <thead className="bg-gray-50 text-gray-500 font-medium">
                             <tr>
                                 <th className="p-4">Date/Time</th>
                                 <th className="p-4">Module</th>
                                 <th className="p-4">Duration</th>
                                 <th className="p-4">Status</th>
                                 <th className="p-4 text-right">Action</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {myLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                                 <tr key={log.id} className="hover:bg-gray-50">
                                     <td className="p-4">
                                         <div className="font-bold text-gray-900">{log.date}</div>
                                         <div className="text-xs text-gray-500">{log.startTime} - {log.endTime}</div>
                                     </td>
                                     <td className="p-4 text-gray-600">
                                         {modules.find(m => m.id === log.moduleId)?.name}
                                     </td>
                                     <td className="p-4 font-mono">{log.durationMinutes} min</td>
                                     <td className="p-4">
                                         <div className="flex flex-col items-start gap-1">
                                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                 log.status === LogStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                                                 log.status === LogStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 
                                                 log.status === LogStatus.DRAFT ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                                             }`}>
                                                 {log.status}
                                             </span>
                                             {log.status === LogStatus.DRAFT && log.scores.length > 0 && (
                                                 <span className="text-[10px] text-blue-600 font-medium">
                                                     {log.scores.filter(s => s.studentArtifactUrl || s.studentReflection).length}/{log.scores.length} Submitted
                                                 </span>
                                             )}
                                         </div>
                                     </td>
                                     <td className="p-4 text-right">
                                         {(log.status !== LogStatus.APPROVED) && (
                                             <button onClick={() => handleEditLog(log)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                                         )}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 )}
             </div>
        </div>
    );

    // --- Main Render ---

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/mentor/dashboard' },
        { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} />, path: '/mentor/schedule' },
        { id: 'logs', label: 'History', icon: <History size={18} />, path: '/mentor/logs' },
        { id: 'students', label: 'Students', icon: <Users size={18} />, path: '/mentor/students' },
        { id: 'materials', label: 'Materials', icon: <FolderOpen size={18} />, path: '/mentor/materials' },
    ];

    const location = useLocation();

    return (
        <Layout navItems={navItems}>
            <Routes>
                <Route path="entry" element={
                    <MentorLogForm 
                        initialData={selectedLogToEdit || (selectedPlan ? {
                            moduleId: selectedPlan.moduleId,
                            date: selectedPlan.date,
                            startTime: selectedPlan.startTime,
                            endTime: selectedPlan.endTime,
                            summaryNote: selectedPlan.topic,
                        } : undefined)} 
                        onSuccess={handleLogSuccess}
                        onCancel={() => navigate(-1)}
                    />
                } />
                <Route path="*" element={
                    <div className="space-y-6">
                        {/* 2. Main Content Area */}
                        <div className="min-h-[500px]">
                            <Routes>
                                <Route path="dashboard" element={<DashboardHome />} />
                                <Route path="schedule" element={<ScheduleView />} />
                                <Route path="logs" element={<HistoryView />} />
                                <Route path="materials" element={<MaterialsView />} />
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