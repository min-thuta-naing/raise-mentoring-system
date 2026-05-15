import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, Filter, Download, MessageCircle, Edit3, Search, ArrowUpDown, Layers, XCircle, CheckCircle, AlertOctagon, X } from 'lucide-react';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { User, Group, Module, MentoringLog, Role, AttendanceStatus } from '../../types';

import { GroupChatDrawer } from './GroupChatDrawer';

interface StudentDirectoryProps {
    users: User[];
    groups: Group[];
    modules: Module[];
    currentUserId: string;
    logs: MentoringLog[];
    onSelectStudent: (s: User) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ users, groups, modules, currentUserId, logs, onSelectStudent }) => {
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

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);

    const allStudents = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);
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
        let list = [...allStudents];
        
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
                toast.error("You can compare up to 3 students max.");
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
            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-5">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Toggle */}
                    <div className="flex bg-gray-50 p-1 rounded-[1.5rem] border border-gray-100">
                        <button 
                            onClick={() => { setFilterMode('ALL'); setSelectedGroupId(''); }}
                            className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all flex items-center gap-2 ${filterMode === 'ALL' ? 'bg-[#454040] shadow-lg shadow-[#454040]/20 text-white' : 'text-gray-300 hover:text-[#454040]'}`}
                        >
                            <Users size={14} /> All Students
                        </button>
                        <button 
                            onClick={() => { setFilterMode('MY_GROUPS'); if(myGroups.length > 0) setSelectedGroupId(myGroups[0].id); }}
                            className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all flex items-center gap-2 ${filterMode === 'MY_GROUPS' ? 'bg-[#454040] shadow-lg shadow-[#454040]/20 text-white' : 'text-gray-300 hover:text-[#454040]'}`}
                        >
                            <Filter size={14} /> My Groups
                        </button>
                    </div>

                    {/* Group Action Tools (Only for My Groups) */}
                    {filterMode === 'MY_GROUPS' && (
                        <div className="flex gap-2">
                             <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100">
                                 <Download size={14} /> Report
                             </button>
                             <button 
                                onClick={() => {
                                    if(selectedGroupId) setIsChatOpen(true);
                                    else toast.info("Please select a specific group first to start chatting.");
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#454040]/5 text-[#454040] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#454040]/10 transition-all border border-[#454040]/10"
                             >
                                 <MessageCircle size={14} /> Group Chat
                             </button>
                             <button className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all border border-orange-100">
                                 <Edit3 size={14} /> Bulk Assess
                             </button>
                        </div>
                    )}
                </div>
                
                <div className="h-px bg-gray-100 w-full"></div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Module/Group Dropdowns */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <select 
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="rounded-[1.5rem] border-gray-100 text-sm p-3 border focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all w-1/2 md:w-48 bg-gray-50/50"
                        >
                            <option value="">All Modules</option>
                            {myModules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <select 
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="rounded-[1.5rem] border-gray-100 text-sm p-3 border focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all w-1/2 md:w-48 bg-gray-50/50"
                        >
                            <option value="">All Groups</option>
                            {myGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-3 text-gray-300 w-3.5 h-3.5" />
                        <input 
                            type="text" 
                            placeholder="Search by name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 rounded-[1.5rem] border-gray-50 text-[11px] font-bold p-3 border focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-gray-50/50 focus:bg-white"
                        />
                    </div>

                    {/* Sort & Compare */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative">
                            <ArrowUpDown className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="pl-10 rounded-[1.5rem] border-gray-100 text-sm p-3 border focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all appearance-none pr-10 cursor-pointer bg-gray-50/50"
                            >
                                <option value="NAME">Name (A-Z)</option>
                                <option value="SCORE_DESC">Score (High-Low)</option>
                                <option value="ATTENDANCE_DESC">Attendance %</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
                            className={`px-5 py-3 text-sm font-bold rounded-[1.5rem] border flex items-center gap-2 transition-all whitespace-nowrap ${compareMode ? 'bg-[#454040] text-white border-[#454040] shadow-lg shadow-[#454040]/20' : 'bg-white border-gray-100 text-[#454040] hover:bg-gray-50'}`}
                        >
                            <Layers size={16} /> Compare
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Comparison Bar */}
            {compareMode && selectedForCompare.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#0a0a0f]/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[90] flex items-center gap-6 animate-in slide-in-from-bottom-10 border border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-black uppercase tracking-widest">{selectedForCompare.length} Selected</span>
                    </div>
                    <button 
                        onClick={() => setShowCompareModal(true)}
                        disabled={selectedForCompare.length < 2}
                        className={`bg-white text-[#0a0a0f] px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 ${selectedForCompare.length < 2 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        Compare Now
                    </button>
                    <button onClick={() => setSelectedForCompare([])} className="text-white/40 hover:text-white transition-colors">
                        <XCircle size={22}/>
                    </button>
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
                            className={`bg-white rounded-[1.5rem] border shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col
                                ${isSelected ? 'border-[#454040] ring-4 ring-[#454040]/5' : 'border-gray-100'}
                                ${stats?.isRedFlag ? 'border-l-4 border-l-red-500' : ''}
                            `}
                            onClick={() => {
                                if (compareMode) handleCompareToggle(student.id);
                                else onSelectStudent(student);
                            }}
                        >
                            {compareMode && (
                                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? 'bg-[#454040] border-[#454040] scale-110' : 'bg-white/80 backdrop-blur-sm border-gray-200'}`}>
                                    {isSelected && <CheckCircle size={14} className="text-white" />}
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="p-4 flex items-center gap-3">
                                <div className="relative">
                                    <img src={student.avatarUrl} alt={student.fullName} className="w-12 h-12 rounded-full bg-gray-50 object-cover ring-2 ring-gray-50 group-hover:ring-[#454040]/10 transition-all" />
                                    {stats?.isRedFlag && (
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 text-white p-0.5 rounded-full border-2 border-white shadow-lg" title="Red Flag">
                                            <AlertOctagon size={10} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-black text-xs text-[#454040] truncate uppercase tracking-tight">{student.fullName}</h4>
                                    <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest truncate mt-0.5">{student.email}</p>
                                    <div className="mt-1.5 flex gap-1 flex-wrap">
                                         {groups.filter(g => g.studentIds.includes(student.id)).map(g => (
                                             <span key={g.id} className="text-[8px] font-black uppercase tracking-tight bg-[#454040]/5 text-[#454040]/60 px-2 py-0.5 rounded-full border border-[#454040]/5">{g.name}</span>
                                         ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Card Stats */}
                            <div className="mt-auto border-t border-gray-50 bg-gray-50/20 p-3 flex justify-between items-center text-center">
                                 <div className="flex-1 border-r border-gray-50">
                                     <div className={`font-black text-base ${stats?.avg && stats.avg < 2.5 ? 'text-red-600' : 'text-[#454040]'}`}>
                                         {stats?.avg ? stats.avg.toFixed(1) : '-'}
                                     </div>
                                     <div className="text-[8px] text-gray-300 uppercase font-black tracking-widest mt-0.5">Avg Score</div>
                                 </div>
                                 <div className="flex-1">
                                     <div className={`font-black text-base ${stats?.attendance && stats.attendance < 80 ? 'text-orange-500' : 'text-[#454040]'}`}>
                                         {stats?.attendance ? Math.round(stats.attendance) : 0}%
                                     </div>
                                     <div className="text-[8px] text-gray-300 uppercase font-black tracking-widest mt-0.5">Attendance</div>
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
            {showCompareModal && createPortal(
                <div className="fixed inset-0 bg-[#0a0a0f]/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[1.5rem] shadow-2xl max-w-5xl w-full p-10 relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] overflow-hidden">
                        <button onClick={() => setShowCompareModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-[#454040] p-2 hover:bg-gray-100 rounded-full transition-all">
                            <X size={24} />
                        </button>
                        
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-[#454040] flex items-center gap-4 italic tracking-tight uppercase">
                                <Layers size={24} className="text-[#454040]" /> 
                                Student Comparison
                            </h2>
                            <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] mt-2 ml-10">Competency overlap overview</p>
                        </div>
                        
                        <div className="flex-1 min-h-[400px] w-full bg-gray-50/50 rounded-[1.5rem] p-6 border border-gray-100">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 11, fontWeight: 'bold', fill: '#454040'}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} stroke="#e2e8f0" />
                                    <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px 20px'}} />
                                    <Legend wrapperStyle={{paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em'}} />
                                    {users.filter(u => selectedForCompare.includes(u.id)).map((s, idx) => (
                                        <Radar 
                                            key={s.id}
                                            name={s.fullName} 
                                            dataKey={s.fullName} 
                                            stroke={idx === 0 ? '#454040' : idx === 1 ? '#10b981' : '#f59e0b'} 
                                            fill={idx === 0 ? '#454040' : idx === 1 ? '#10b981' : '#f59e0b'} 
                                            strokeWidth={3}
                                            fillOpacity={0.25} 
                                        />
                                    ))}
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Group Chat Drawer */}
            {isChatOpen && selectedGroupId && (
                <GroupChatDrawer 
                    group={groups.find(g => g.id === selectedGroupId)!} 
                    onClose={() => setIsChatOpen(false)} 
                />
            )}
        </div>
    );
};
