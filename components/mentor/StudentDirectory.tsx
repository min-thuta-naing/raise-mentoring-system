import React, { useState, useMemo } from 'react';
import { Users, Filter, Download, MessageCircle, Edit3, Search, ArrowUpDown, Layers, XCircle, CheckCircle, AlertOctagon } from 'lucide-react';
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
                             <button 
                                onClick={() => {
                                    if(selectedGroupId) setIsChatOpen(true);
                                    else toast.info("Please select a specific group first to start chatting.");
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                             >
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
                                    <img src={student.avatarUrl} alt={student.fullName} className="w-12 h-12 rounded-full bg-gray-100 object-cover" />
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
                            <div className="mt-auto border-t border-gray-50 bg-gray-50/50 p-3 flex justify-between items-center text-center">
                                 <div className="flex-1 border-r border-gray-200">
                                     <div className={`font-bold text-lg ${stats?.avg && stats.avg < 2.5 ? 'text-red-600' : 'text-gray-800'}`}>
                                         {stats?.avg ? stats.avg.toFixed(1) : '-'}
                                     </div>
                                     <div className="text-[10px] text-gray-400 uppercase font-black">Avg Score</div>
                                 </div>
                                 <div className="flex-1">
                                     <div className={`font-bold text-lg ${stats?.attendance && stats.attendance < 80 ? 'text-orange-500' : 'text-gray-800'}`}>
                                         {stats?.attendance ? Math.round(stats.attendance) : 0}%
                                     </div>
                                     <div className="text-[10px] text-gray-400 uppercase font-black">Attendance</div>
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
