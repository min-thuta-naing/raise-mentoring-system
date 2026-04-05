import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { LogStatus, Role, User, MentoringLog, Batch, Module, Group, MentorType, LessonPlan, ActivityType, AssessmentCategory, PlanStatus, AttendanceStatus } from '../types';
import { 
  AlertTriangle, CheckCircle, Clock, ExternalLink, 
  LayoutGrid, Users, CheckSquare, 
  Settings, Plus, BookOpen, GraduationCap, Briefcase,
  XCircle, History,
  Activity, Calendar, PenTool, Edit, Repeat, Trash2, ToggleLeft, ToggleRight, Scale, Shield, AlertOctagon, Eye, Send, Download
} from 'lucide-react';
import { Layout } from './Layout';
import { MentorLogForm } from './MentorLogForm';

// --- Helper Components ---

const AuditLogModal: React.FC<{ log: MentoringLog; users: User[]; onClose: () => void }> = ({ log, users, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <History size={18} /> Audit Trail
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={20} />
                    </button>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    <div className="relative border-l-2 border-indigo-100 ml-3 space-y-6">
                        {log.history.map((h, idx) => {
                            const actor = users.find(u => u.id === h.actorId);
                            return (
                                <div key={idx} className="relative pl-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-800">{h.action}</p>
                                        <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString()}</p>
                                        <p className="text-xs text-gray-600 mt-1">by {actor?.fullName} ({actor?.role})</p>
                                        {h.note && (
                                            <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 italic border border-gray-100">
                                                "{h.note}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Group Management Component ---
const GroupManagement: React.FC<{
    groups: Group[];
    modules: Module[];
    users: User[];
    onSave: (group: Group) => void;
}> = ({ groups, modules, users, onSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    
    // Form State
    const [name, setName] = useState('');
    const [moduleId, setModuleId] = useState('');
    const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    const openModal = (group?: Group) => {
        if (group) {
            setEditingGroup(group);
            setName(group.name);
            setModuleId(group.moduleId);
            setSelectedMentorIds(group.mentorIds);
            setSelectedStudentIds(group.studentIds);
        } else {
            setEditingGroup(null);
            setName('');
            setModuleId(modules[0]?.id || '');
            setSelectedMentorIds([]);
            setSelectedStudentIds([]);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name || !moduleId) {
            alert("Please fill in group name and select a module.");
            return;
        }
        const group: Group = {
            id: editingGroup ? editingGroup.id : `g-${Date.now()}`,
            name,
            moduleId,
            mentorIds: selectedMentorIds,
            studentIds: selectedStudentIds
        };
        onSave(group);
        setIsModalOpen(false);
    };

    const selectedModule = modules.find(m => m.id === moduleId);
    const availableStudents = users.filter(u => u.role === Role.STUDENT && (!selectedModule || u.batchId === selectedModule.batchId));
    const availableMentors = users.filter(u => u.role === Role.MENTOR);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users size={20} className="text-indigo-600" /> Student Groups & Mentor Matching
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Assign students to groups and match them with mentors for a module.</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                    <Plus size={16} /> Create Group
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-3 border-b border-gray-100 rounded-tl-lg">Group Name</th>
                            <th className="p-3 border-b border-gray-100">Module</th>
                            <th className="p-3 border-b border-gray-100">Mentors</th>
                            <th className="p-3 border-b border-gray-100">Students</th>
                            <th className="p-3 border-b border-gray-100 rounded-tr-lg text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {groups.map(g => {
                            const mod = modules.find(m => m.id === g.moduleId);
                            return (
                                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 font-medium text-gray-900">{g.name}</td>
                                    <td className="p-3 text-gray-500">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100">
                                            {mod?.name}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {g.mentorIds.length === 0 && <span className="text-xs text-gray-400">No mentors</span>}
                                            {g.mentorIds.map(mid => {
                                                const m = users.find(u => u.id === mid);
                                                return (
                                                    <img 
                                                        key={mid} 
                                                        title={m?.fullName} 
                                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200" 
                                                        src={m?.avatarUrl} 
                                                        alt={m?.fullName}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} />
                                            <span className="font-medium">{g.studentIds.length}</span> Students
                                        </div>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => openModal(g)} 
                                            className="text-gray-500 hover:text-indigo-600 p-1.5 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{editingGroup ? 'Edit Student Group' : 'Create New Group'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                        </div>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={e => setName(e.target.value)} 
                                        placeholder="e.g. Group Alpha"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                                    <select 
                                        value={moduleId} 
                                        onChange={e => {
                                            setModuleId(e.target.value);
                                            setSelectedStudentIds([]);
                                        }} 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="" disabled>Select Module</option>
                                        {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-64">
                                    <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">Assign Mentors</div>
                                    <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
                                        {availableMentors.map(m => (
                                            <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" checked={selectedMentorIds.includes(m.id)} onChange={e => e.target.checked ? setSelectedMentorIds([...selectedMentorIds, m.id]) : setSelectedMentorIds(selectedMentorIds.filter(id => id !== m.id))} className="rounded text-indigo-600" />
                                                <span className="text-sm">{m.fullName}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-64">
                                    <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">Assign Students</div>
                                    <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
                                        {availableStudents.map(s => (
                                            <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={e => e.target.checked ? setSelectedStudentIds([...selectedStudentIds, s.id]) : setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id))} className="rounded text-green-600" />
                                                <span className="text-sm">{s.fullName}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"><CheckCircle size={16}/> Save Group</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Assessment Builder Component ---
const AssessmentBuilder: React.FC<{
    modules: Module[];
    onUpdateModule: (module: Module) => void;
}> = ({ modules, onUpdateModule }) => {
    const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
    const selectedModule = modules.find(m => m.id === selectedModuleId);
    
    // New Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatWeight, setNewCatWeight] = useState(0);
    const [newCatLevels, setNewCatLevels] = useState<{ [key: number]: string }>({
        1: '', 2: '', 3: '', 4: '', 5: ''
    });

    const handleAddCategory = () => {
        if (!newCatName || !selectedModule) return;
        
        const newCat: AssessmentCategory = {
            id: `cat-${Date.now()}`,
            name: newCatName,
            description: newCatDesc,
            weight: newCatWeight,
            isEnabled: true,
            levels: newCatLevels
        };

        const updatedModule = {
            ...selectedModule,
            assessmentConfig: [...(selectedModule.assessmentConfig || []), newCat]
        };
        onUpdateModule(updatedModule);
        
        setNewCatName('');
        setNewCatDesc('');
        setNewCatWeight(0);
        setNewCatLevels({ 1: '', 2: '', 3: '', 4: '', 5: '' });
    };

    const handleToggleCategory = (catId: string) => {
        if (!selectedModule) return;
        const updatedConfig = selectedModule.assessmentConfig?.map(cat => 
            cat.id === catId ? { ...cat, isEnabled: !cat.isEnabled } : cat
        );
        onUpdateModule({ ...selectedModule, assessmentConfig: updatedConfig });
    };

    const handleDeleteCategory = (catId: string) => {
        if (!selectedModule || !confirm('Are you sure you want to delete this category?')) return;
        const updatedConfig = selectedModule.assessmentConfig?.filter(cat => cat.id !== catId);
        onUpdateModule({ ...selectedModule, assessmentConfig: updatedConfig });
    };

    const handleImportTemplate = (sourceModuleId: string) => {
        if (!selectedModule || !sourceModuleId) return;
        const sourceModule = modules.find(m => m.id === sourceModuleId);
        if (sourceModule && confirm(`Overwrite current rubric with config from ${sourceModule.name}?`)) {
            onUpdateModule({
                ...selectedModule,
                assessmentConfig: sourceModule.assessmentConfig
            });
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Scale size={20} className="text-indigo-600" /> Competency Settings (Rubric)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Customize assessment criteria per module.</p>
                </div>
                <div className="flex gap-2">
                     <select 
                         className="rounded-lg border-gray-300 p-2 text-xs border"
                         onChange={(e) => handleImportTemplate(e.target.value)}
                         value=""
                     >
                         <option value="" disabled>Import Template...</option>
                         {modules.filter(m => m.id !== selectedModuleId).map(m => (
                             <option key={m.id} value={m.id}>From: {m.name}</option>
                         ))}
                     </select>
                    <div className="w-64">
                        <select 
                            className="w-full rounded-lg border-gray-300 p-2 text-sm border font-medium"
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                        >
                            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories List */}
                <div className="md:col-span-2 space-y-3">
                    {selectedModule?.assessmentConfig?.length === 0 && (
                        <div className="p-8 text-center bg-gray-50 rounded-lg text-gray-400 border border-dashed border-gray-200">
                            No categories defined. Add one or Import from another module.
                        </div>
                    )}
                    {selectedModule?.assessmentConfig?.map((cat) => (
                        <div key={cat.id} className={`p-4 rounded-lg border flex items-center justify-between transition-all ${cat.isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-800">{cat.name}</h4>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-mono">Weight: {cat.weight}%</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 italic">"Score 5: {cat.description}"</p>
                                {cat.levels && Object.values(cat.levels).some(l => l) && (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
                                        {[1, 2, 3, 4, 5].map(lvl => (
                                            <div key={lvl} className="bg-gray-50 p-2 rounded border border-gray-100">
                                                <div className="text-[10px] font-bold text-gray-400 mb-1">Level {lvl}</div>
                                                <div className="text-[10px] text-gray-600 leading-tight">{cat.levels![lvl] || '-'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleToggleCategory(cat.id)}
                                    className={`p-1.5 rounded-md transition-colors ${cat.isEnabled ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                                    title="Toggle Enable/Disable"
                                >
                                    {cat.isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                                <button 
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add New Form */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit">
                    <h4 className="font-bold text-gray-700 mb-4 text-sm">Add New Category</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                            <input 
                                type="text" 
                                className="w-full rounded border-gray-300 p-2 text-sm"
                                placeholder="e.g. Technical Skill"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Score 5 Description</label>
                            <textarea 
                                rows={2}
                                className="w-full rounded border-gray-300 p-2 text-sm"
                                placeholder="Behavior at excellence level..."
                                value={newCatDesc}
                                onChange={e => setNewCatDesc(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Weight (%)</label>
                            <input 
                                type="number" 
                                className="w-full rounded border-gray-300 p-2 text-sm"
                                placeholder="0-100"
                                value={newCatWeight}
                                onChange={e => setNewCatWeight(Number(e.target.value))}
                            />
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <label className="block text-xs font-bold text-gray-700 mb-2">Detailed Scoring Levels (Optional)</label>
                            {[1, 2, 3, 4, 5].map(level => (
                                <div key={level} className="mb-2">
                                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Level {level}</label>
                                    <input 
                                        type="text" 
                                        className="w-full rounded border-gray-300 p-1.5 text-xs"
                                        placeholder={`Description for score ${level}...`}
                                        value={newCatLevels[level]}
                                        onChange={e => setNewCatLevels({ ...newCatLevels, [level]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={handleAddCategory}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 mt-2 flex justify-center items-center gap-2"
                        >
                            <Plus size={16} /> Add Category
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Overview Tab ---
const OverviewTab: React.FC<{ logs: MentoringLog[]; users: User[]; onNavigateToRedFlags: () => void }> = ({ logs, users, onNavigateToRedFlags }) => {
    const pendingCount = logs.filter(l => l.status === LogStatus.PENDING).length;
    const approvedCount = logs.filter(l => l.status === LogStatus.APPROVED).length;
    
    // Valid Hours Breakdown
    const validLogs = logs.filter(l => l.status === LogStatus.APPROVED && l.isValidSession);
    const internalHours = validLogs.filter(l => users.find(u => u.id === l.mentorId)?.mentorType === MentorType.INTERNAL).length;
    const externalHours = validLogs.filter(l => users.find(u => u.id === l.mentorId)?.mentorType === MentorType.EXTERNAL).length;

    // Early Warning Calculation
    const atRiskStudents = users.filter(u => u.role === Role.STUDENT).map(student => {
        const studentScores = logs.flatMap(l => l.scores.filter(s => s.studentId === student.id));
        const totalSessions = studentScores.length;
        const absentCount = studentScores.filter(s => s.attendance === AttendanceStatus.ABSENT).length;
        
        let totalAvg = 0;
        if (totalSessions > 0) {
            const sumScores = studentScores.reduce((acc, s) => {
                const vals = Object.values(s.metrics) as number[];
                const sessionAvg = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
                return acc + sessionAvg;
            }, 0);
            totalAvg = sumScores / totalSessions;
        }

        return { ...student, totalAvg, absentCount };
    }).filter(s => s.totalAvg < 2.5 || s.absentCount > 2);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Early Warning Widget */}
            {atRiskStudents.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex items-start justify-between z-10 relative">
                        <div>
                            <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">
                                <AlertOctagon size={24} /> Early Warning System
                            </h3>
                            <p className="text-red-600 text-sm mt-1">Students requiring immediate attention (Avg &lt; 2.5 or Low Attendance)</p>
                        </div>
                        <button onClick={onNavigateToRedFlags} className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-50 border border-red-100">
                            View Details
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                        {atRiskStudents.map(s => (
                            <div key={s.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-3 border border-red-100">
                                <img src={s.avatarUrl} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{s.fullName}</p>
                                    <p className="text-xs text-red-500 font-semibold">Avg: {s.totalAvg.toFixed(1)} | Abs: {s.absentCount}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Clock size={24} /></div>
                        <span className="text-2xl font-bold text-gray-900">{pendingCount}</span>
                    </div>
                    <h3 className="text-gray-500 font-medium text-sm">Pending Verification</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-50 p-3 rounded-lg text-green-600"><CheckCircle size={24} /></div>
                        <span className="text-2xl font-bold text-gray-900">{approvedCount}</span>
                    </div>
                    <h3 className="text-gray-500 font-medium text-sm">Total Sessions</h3>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg text-purple-600"><Briefcase size={24} /></div>
                        <span className="text-2xl font-bold text-gray-900">{internalHours} hrs</span>
                    </div>
                    <h3 className="text-gray-500 font-medium text-sm">Internal Hrs (Staff)</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-50 p-3 rounded-lg text-orange-600"><Briefcase size={24} /></div>
                        <span className="text-2xl font-bold text-gray-900">{externalHours} hrs</span>
                    </div>
                    <h3 className="text-gray-500 font-medium text-sm">External Hrs (Industry)</h3>
                </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Recent Audit Log</h3>
                <div className="space-y-4">
                    {logs.slice(0, 5).map(log => {
                        const isProxy = log.recordedBy !== log.mentorId;
                        return (
                            <div key={log.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${log.status === 'APPROVED' ? 'bg-green-500' : log.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900">{users.find(u => u.id === log.mentorId)?.fullName || 'Unknown'}</p>
                                            {isProxy && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 rounded border border-indigo-100 flex items-center gap-1"><Shield size={8} /> Admin Proxy</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">{log.summaryNote}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{log.date}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Planning Tab ---
const PlanningTab: React.FC<{
    modules: Module[];
    users: User[];
    lessonPlans: LessonPlan[];
    onAddPlan: (plan: LessonPlan) => void;
}> = ({ modules, users, lessonPlans, onAddPlan }) => {
    const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State for Lesson Plan
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [activityType, setActivityType] = useState<ActivityType>(ActivityType.LECTURE);
    const [topic, setTopic] = useState('');
    const [mentorId, setMentorId] = useState('');
    const [planStatus, setPlanStatus] = useState<PlanStatus>(PlanStatus.DRAFT);

    // Recursion / Bulk Create State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceCount, setRecurrenceCount] = useState(1);
    const [recurrenceInterval, setRecurrenceInterval] = useState(7); // Default 7 days

    const filteredPlans = lessonPlans.filter(p => p.moduleId === selectedModuleId);
    
    // Stats calculation
    const lectureHours = filteredPlans.filter(p => p.activityType === ActivityType.LECTURE).reduce((acc, p) => acc + (p.durationMinutes / 60), 0);
    const practiceHours = filteredPlans.filter(p => p.activityType === ActivityType.PRACTICE).reduce((acc, p) => acc + (p.durationMinutes / 60), 0);
    
    const mentors = users.filter(u => u.role === Role.MENTOR);
    const selectedModule = modules.find(m => m.id === selectedModuleId);

    // Teaching Load Calculation
    const getMentorLoad = (mId: string) => {
        const plannedMins = lessonPlans.filter(p => p.mentorId === mId).reduce((acc, p) => acc + p.durationMinutes, 0);
        return plannedMins / 60;
    };

    // Helpers
    const calculateDuration = () => {
        if (!startTime || !endTime) return 0;
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        return (end.getTime() - start.getTime()) / 60000;
    };

    const calculateCost = () => {
        const durationMin = calculateDuration();
        const hrs = durationMin / 60;
        const mentor = mentors.find(m => m.id === mentorId);
        if (!mentor) return 0;
        
        const rate = mentor.mentorType === MentorType.EXTERNAL ? 1200 : 600;
        const singleSessionCost = hrs * rate;
        
        return isRecurring ? singleSessionCost * recurrenceCount : singleSessionCost;
    };

    const checkForConflicts = (checkDate: string, checkStart: string, checkEnd: string, checkMentorId: string) => {
        if (!checkDate) return false; // No conflict if no date is set
        return lessonPlans.some(p => 
            p.mentorId === checkMentorId &&
            p.date === checkDate &&
            ((checkStart >= p.startTime && checkStart < p.endTime) || 
             (checkEnd > p.startTime && checkEnd <= p.endTime))
        );
    };

    const hasConflict = checkForConflicts(date, startTime, endTime, mentorId);

    const handleAddPlan = (e: React.FormEvent) => {
        e.preventDefault();
        
        const duration = calculateDuration();

        if (duration < 50) {
            alert("Session must be at least 50 minutes.");
            return;
        }

        if (hasConflict) {
            if(!confirm("Warning: This mentor has a conflicting session at this time. Do you want to proceed?")) return;
        }

        const count = isRecurring ? recurrenceCount : 1;
        let currentDate = date ? new Date(date) : null;

        for (let i = 0; i < count; i++) {
            let dateStr = '';
            if (currentDate) {
                // Format date YYYY-MM-DD
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            }

            const newPlan: LessonPlan = {
                id: `plan-${Date.now()}-${i}`,
                moduleId: selectedModuleId,
                date: dateStr,
                startTime,
                endTime,
                durationMinutes: duration,
                activityType,
                topic: isRecurring ? `${topic} (Session ${i + 1})` : topic,
                mentorId,
                status: planStatus
            };
            onAddPlan(newPlan);

            if (currentDate) {
                // Increment date
                currentDate.setDate(currentDate.getDate() + recurrenceInterval);
            }
        }
        
        setIsModalOpen(false);
        // Reset form
        setTopic(''); setStartTime(''); setEndTime(''); setMentorId(''); 
        setIsRecurring(false); setRecurrenceCount(1);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Module Selector & Summary */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Module</label>
                    <select 
                        className="w-full rounded-lg border-gray-300 p-2.5 border"
                        value={selectedModuleId}
                        onChange={(e) => setSelectedModuleId(e.target.value)}
                    >
                        {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                            <h4 className="text-xs font-bold uppercase text-indigo-500 mb-1">Total Planned Hours</h4>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-indigo-900">{(lectureHours + practiceHours).toFixed(1)} h</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-xs text-blue-500 uppercase font-bold">Lecture</div>
                                <div className="text-lg font-bold text-blue-900">{lectureHours.toFixed(1)} h</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="text-xs text-green-500 uppercase font-bold">Practice</div>
                                <div className="text-lg font-bold text-green-900">{practiceHours.toFixed(1)} h</div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Plan Table */}
                 <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-600" /> Lesson Plan
                        </h3>
                        <div className="flex gap-2">
                             <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50">
                                <Send size={14} /> Publish All Drafts
                            </button>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                            >
                                <Plus size={16} /> Add Session
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 max-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0 z-10">
                                <tr>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Topic</th>
                                    <th className="p-3">Mentor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPlans.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                            No sessions planned for this module yet.
                                        </td>
                                    </tr>
                                )}
                                {filteredPlans.sort((a,b) => {
                                    if (!a.date && !b.date) return 0;
                                    if (!a.date) return 1;
                                    if (!b.date) return -1;
                                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                                }).map(plan => {
                                    const m = users.find(u => u.id === plan.mentorId);
                                    return (
                                        <tr key={plan.id} className="hover:bg-gray-50">
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${plan.status === PlanStatus.PUBLISHED ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {plan.status || 'DRAFT'}
                                                </span>
                                            </td>
                                            <td className="p-3 whitespace-nowrap">
                                                {plan.date ? plan.date : <span className="text-gray-400 italic">Unscheduled</span>}
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-gray-500">{plan.startTime} - {plan.endTime}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                                    plan.activityType === ActivityType.LECTURE 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                                    : 'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                    {plan.activityType === ActivityType.LECTURE ? 'L' : 'P'}
                                                </span>
                                            </td>
                                            <td className="p-3 font-medium text-gray-900">{plan.topic}</td>
                                            <td className="p-3 text-gray-600 flex items-center gap-2">
                                                 {m && <img src={m.avatarUrl} className="w-5 h-5 rounded-full" />}
                                                 <span className="truncate max-w-[100px]">{m?.fullName}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
             </div>

             {/* Add Session Modal */}
             {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Add Planned Session</h3>
                        <p className="text-sm text-gray-500 mb-6">Module: <span className="font-semibold text-indigo-600">{selectedModule?.name}</span></p>
                        
                        <form onSubmit={handleAddPlan} className="space-y-4">
                            <div className="flex justify-end">
                                <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-bold">
                                    <button type="button" onClick={() => setPlanStatus(PlanStatus.DRAFT)} className={`px-3 py-1 rounded ${planStatus === PlanStatus.DRAFT ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Draft</button>
                                    <button type="button" onClick={() => setPlanStatus(PlanStatus.PUBLISHED)} className={`px-3 py-1 rounded ${planStatus === PlanStatus.PUBLISHED ? 'bg-green-500 shadow text-white' : 'text-gray-500'}`}>Publish</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date (Optional)</label>
                                <input type="date" className="w-full rounded-lg border-gray-300 p-2 border" value={date} onChange={e => setDate(e.target.value)} />
                                <p className="text-xs text-gray-500 mt-1">Leave blank to schedule later.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input required type="time" className="w-full rounded-lg border-gray-300 p-2 border" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input required type="time" className="w-full rounded-lg border-gray-300 p-2 border" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded flex-1">
                                        <input type="radio" name="type" className="text-indigo-600" checked={activityType === ActivityType.LECTURE} onChange={() => setActivityType(ActivityType.LECTURE)} />
                                        <span className="text-sm font-medium">Lecture</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded flex-1">
                                        <input type="radio" name="type" className="text-indigo-600" checked={activityType === ActivityType.PRACTICE} onChange={() => setActivityType(ActivityType.PRACTICE)} />
                                        <span className="text-sm font-medium">Practice</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                <input required type="text" placeholder="e.g. Intro to Data Models" className="w-full rounded-lg border-gray-300 p-2 border" value={topic} onChange={e => setTopic(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Mentor</label>
                                <select required className="w-full rounded-lg border-gray-300 p-2 border" value={mentorId} onChange={e => setMentorId(e.target.value)}>
                                    <option value="">Select Mentor...</option>
                                    {mentors.map(m => {
                                        const load = getMentorLoad(m.id);
                                        return (
                                            <option key={m.id} value={m.id}>
                                                {m.fullName} ({load.toFixed(0)} hrs loaded)
                                            </option>
                                        );
                                    })}
                                </select>
                                {mentorId && getMentorLoad(mentorId) > 20 && (
                                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1"><AlertTriangle size={10} /> Warning: High teaching load</p>
                                )}
                            </div>

                            {/* Conflict Warning */}
                            {hasConflict && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                                    <AlertTriangle size={18} className="mt-0.5" />
                                    <div>
                                        <p className="font-bold">Schedule Conflict Detected</p>
                                        <p className="text-xs">This mentor is already assigned to another session at this time.</p>
                                    </div>
                                </div>
                            )}

                            {/* Recurring Options */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-indigo-600"
                                        checked={isRecurring}
                                        onChange={e => setIsRecurring(e.target.checked)}
                                    />
                                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Repeat size={14} /> Repeat Session</span>
                                </label>
                                {isRecurring && (
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Repeat Every</label>
                                            <select 
                                                className="w-full rounded border-gray-300 text-sm p-1.5"
                                                value={recurrenceInterval}
                                                onChange={e => setRecurrenceInterval(Number(e.target.value))}
                                            >
                                                <option value={1}>1 Day</option>
                                                <option value={7}>1 Week</option>
                                                <option value={14}>2 Weeks</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Occurrences</label>
                                            <input 
                                                type="number" 
                                                min="2" max="10"
                                                className="w-full rounded border-gray-300 text-sm p-1.5"
                                                value={recurrenceCount}
                                                onChange={e => setRecurrenceCount(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                    {isRecurring ? `Add ${recurrenceCount} Sessions` : 'Add Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                 </div>
             )}
        </div>
    );
};

// --- Approvals Tab ---
const ApprovalsTab: React.FC<{ 
    logs: MentoringLog[]; 
    users: User[]; 
    modules: Module[]; 
    onUpdateStatus: (id: string, status: LogStatus, reason?: string) => void; 
}> = ({ logs, users, modules, onUpdateStatus }) => {
    const pendingLogs = logs.filter(l => l.status === LogStatus.PENDING);

    // Simple Overlap Detection
    const getOverlapWarning = (log: MentoringLog) => {
        const overlaps = logs.some(l => 
            l.id !== log.id && 
            l.mentorId === log.mentorId && 
            l.date === log.date && 
            l.status !== LogStatus.REJECTED &&
            ((l.startTime >= log.startTime && l.startTime < log.endTime) || 
             (l.endTime > log.startTime && l.endTime <= log.endTime))
        );
        return overlaps;
    };

    const handleBatchApprove = () => {
        const validPending = pendingLogs.filter(l => l.isValidSession && !getOverlapWarning(l));
        if (confirm(`Approve ${validPending.length} valid logs without conflicts?`)) {
            validPending.forEach(l => onUpdateStatus(l.id, LogStatus.APPROVED));
        }
    };

    const handleExportAudit = () => {
        const approvedLogs = logs.filter(l => l.status === LogStatus.APPROVED);
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Mentor Name,Module,Duration (Hrs),Mentor Artifact,Student Name,Student Artifact,Student Reflection\n";

        approvedLogs.forEach(log => {
            const mentor = users.find(u => u.id === log.mentorId)?.fullName || 'Unknown';
            const module = modules.find(m => m.id === log.moduleId)?.name || 'Unknown';
            const durationHrs = (log.durationMinutes / 60).toFixed(2);
            const mentorArtifact = log.artifactUrl || 'N/A';

            log.scores.forEach(score => {
                const student = users.find(u => u.id === score.studentId)?.fullName || 'Unknown';
                const studentArtifact = score.studentArtifactUrl || 'N/A';
                const studentReflection = score.studentReflection ? `"${score.studentReflection.replace(/"/g, '""')}"` : 'N/A';
                
                const row = `"${log.date}","${mentor}","${module}","${durationHrs}","${mentorArtifact}","${student}","${studentArtifact}",${studentReflection}`;
                csvContent += row + "\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in space-y-4">
             <div className="flex justify-end mb-4 gap-2">
                 <button 
                     onClick={handleExportAudit}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 flex items-center gap-2"
                 >
                     <Download size={16} /> Export for Audit (CSV)
                 </button>
                 {pendingLogs.length > 0 && (
                     <button 
                        onClick={handleBatchApprove}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 flex items-center gap-2"
                     >
                         <CheckCircle size={16} /> Approve All Valid
                     </button>
                 )}
             </div>

             {pendingLogs.length === 0 ? (
                 <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                     <CheckCircle size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
                     <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
                     <p className="text-gray-500">No pending logs to review.</p>
                 </div>
             ) : (
                 pendingLogs.map(log => {
                     const mentor = users.find(u => u.id === log.mentorId);
                     const module = modules.find(m => m.id === log.moduleId);
                     const hasOverlap = getOverlapWarning(log);
                     const isProxy = log.recordedBy !== log.mentorId;

                     return (
                         <div key={log.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative">
                             {hasOverlap && (
                                 <div className="absolute top-0 right-0 bg-red-100 text-red-700 px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg border-l border-b border-red-200 flex items-center gap-1">
                                     <AlertTriangle size={12} /> Time Overlap Detected
                                 </div>
                             )}
                             <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                     <img src={mentor?.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                                     <div>
                                         <p className="font-bold text-gray-900 flex items-center gap-2">
                                             {mentor?.fullName}
                                             {isProxy && (
                                                 <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                                                     <Shield size={10} /> Recorded by Admin
                                                 </span>
                                             )}
                                         </p>
                                         <p className="text-xs text-gray-500">{log.date} • {log.startTime} - {log.endTime} ({log.durationMinutes} min)</p>
                                     </div>
                                 </div>
                                 <div className="ml-13 pl-13">
                                     <p className="text-sm font-medium text-indigo-900 bg-indigo-50 inline-block px-2 py-1 rounded mb-2">
                                         {module?.name}
                                     </p>
                                     <p className="text-gray-600 text-sm mb-3">"{log.summaryNote}"</p>
                                     <div className="flex gap-4 text-xs text-gray-500 items-center">
                                         <a 
                                            href={log.artifactUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors font-medium"
                                         >
                                             <Eye size={14} /> View Evidence
                                         </a>
                                         
                                         {log.isValidSession ? (
                                             <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                                 <CheckCircle size={12} /> Valid Working Hour
                                             </span>
                                         ) : (
                                             <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                                 <AlertTriangle size={12} /> Invalid Duration (&lt;50m)
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             </div>
                             <div className="flex flex-col gap-2 justify-center md:border-l md:pl-6 border-gray-100 min-w-[150px]">
                                 <button 
                                    onClick={() => onUpdateStatus(log.id, LogStatus.APPROVED)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                 >
                                     <CheckCircle size={16} /> Verify Log
                                 </button>
                                 <button 
                                    onClick={() => {
                                        const reason = prompt("Reason for rejection?");
                                        if (reason) onUpdateStatus(log.id, LogStatus.REJECTED, reason);
                                    }}
                                    className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                 >
                                     <XCircle size={16} /> Reject
                                 </button>
                             </div>
                         </div>
                     );
                 })
             )}
        </div>
    );
};

// --- Setup Tab ---
const SetupTab: React.FC<{
  batches: Batch[];
  modules: Module[];
  groups: Group[];
  users: User[];
  onAddBatch: (b: Batch) => void;
  onAddModule: (m: Module) => void;
  onUpdateModule: (m: Module) => void;
  onAddUser: (u: User) => void;
  onAddGroup: (g: Group) => void;
  onUpdateGroup: (g: Group) => void;
}> = ({ batches, modules, groups, users, onAddBatch, onAddModule, onUpdateModule, onAddUser, onAddGroup, onUpdateGroup }) => {
    
    // Forms State (User Registration)
    const [userForm, setUserForm] = useState({ 
        role: Role.STUDENT, 
        fullName: '', 
        email: '', 
        batchId: '',
        mentorType: MentorType.NONE
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simple Duplicate Check (by Email)
        if (users.some(u => u.email === userForm.email)) {
            alert("Error: A user with this email already exists.");
            return;
        }

        const newUser: User = {
            id: `u-${Date.now()}`,
            role: userForm.role,
            fullName: userForm.fullName,
            email: userForm.email,
            avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
            batchId: userForm.role === Role.STUDENT ? userForm.batchId : undefined,
            mentorType: userForm.role === Role.MENTOR ? userForm.mentorType : undefined
        };
        onAddUser(newUser);
        
        // Reset
        setUserForm(prev => ({ 
            ...prev, 
            fullName: '', 
            email: '' 
        }));
        
        alert(`${userForm.role === Role.MENTOR ? 'Mentor' : 'Student'} added successfully!`);
    };
    
    const handleAddModule = () => {
        const name = prompt("Module Name");
        if(name) onAddModule({ id: `m-${Date.now()}`, batchId: batches[0]?.id, name, assessmentConfig: [] });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
             {/* Assessment Builder Section */}
             <div className="md:col-span-2">
                <AssessmentBuilder modules={modules} onUpdateModule={onUpdateModule} />
             </div>

             {/* Group Management Section */}
             <div className="md:col-span-2">
                <GroupManagement 
                    groups={groups} 
                    modules={modules} 
                    users={users} 
                    onSave={(g) => {
                        const exists = groups.find(ex => ex.id === g.id);
                        if (exists) onUpdateGroup(g);
                        else onAddGroup(g);
                    }} 
                />
             </div>

             {/* Existing Batch & Module Section */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BookOpen size={18} /> Modules
                </h3>
                <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {modules.map(m => (
                        <li key={m.id} className="p-2 bg-gray-50 rounded text-sm flex justify-between">
                            <span>{m.name}</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={handleAddModule}
                    className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-500 text-sm hover:bg-gray-50"
                >
                    + Add Module
                </button>
            </div>

            {/* User Registration with Mentor Type */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" /> User Registration
                </h3>
                
                {/* Role Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button 
                        type="button"
                        onClick={() => setUserForm({...userForm, role: Role.STUDENT})}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex justify-center items-center gap-2 ${userForm.role === Role.STUDENT ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    >
                        <GraduationCap size={16} /> Student
                    </button>
                    <button 
                        type="button"
                        onClick={() => setUserForm({...userForm, role: Role.MENTOR})}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex justify-center items-center gap-2 ${userForm.role === Role.MENTOR ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    >
                        <Briefcase size={16} /> Mentor
                    </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full rounded-lg border-gray-300 p-2 border focus:ring-2 focus:ring-indigo-500"
                            value={userForm.fullName}
                            onChange={e => setUserForm({...userForm, fullName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input 
                            required
                            type="email" 
                            className="w-full rounded-lg border-gray-300 p-2 border focus:ring-2 focus:ring-indigo-500"
                            value={userForm.email}
                            onChange={e => setUserForm({...userForm, email: e.target.value})}
                        />
                    </div>

                    {userForm.role === Role.STUDENT && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batch</label>
                            <select 
                                required
                                className="w-full rounded-lg border-gray-300 p-2 border focus:ring-2 focus:ring-indigo-500"
                                value={userForm.batchId}
                                onChange={e => setUserForm({...userForm, batchId: e.target.value})}
                            >
                                <option value="">Select a Batch...</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Mentor Type Selection */}
                    {userForm.role === Role.MENTOR && (
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-3 mt-4">
                            <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                                <Shield size={14} /> Mentor Classification
                            </h4>
                            <div>
                                <label className="block text-xs text-indigo-500 mb-1 uppercase font-bold">Type</label>
                                <select 
                                    required
                                    className="w-full rounded border-gray-300 p-2 border text-sm"
                                    value={userForm.mentorType}
                                    onChange={e => setUserForm({...userForm, mentorType: e.target.value as MentorType})}
                                >
                                    <option value={MentorType.NONE}>-- Select Type --</option>
                                    <option value={MentorType.INTERNAL}>Internal (University Staff)</option>
                                    <option value={MentorType.EXTERNAL}>External (Industry Expert)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-4">
                        Register {userForm.role === Role.STUDENT ? 'Student' : 'Mentor'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Main Admin Dashboard ---
export const AdminDashboard: React.FC = () => {
    const { 
        logs, users, batches, modules, groups, lessonPlans,
        updateLogStatus, addUser, addBatch, addModule, updateModule, addGroup, updateGroup, addLessonPlan
    } = useData();
    const navigate = useNavigate();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <LayoutGrid size={18} />, path: '/admin/overview' },
        { id: 'planning', label: 'Planning', icon: <Calendar size={18} />, path: '/admin/planning' },
        { id: 'approvals', label: 'Verification', icon: <CheckSquare size={18} />, path: '/admin/approvals' },
        { id: 'entry', label: 'New Entry', icon: <PenTool size={18} />, path: '/admin/entry' },
        { id: 'setup', label: 'Configuration', icon: <Settings size={18} />, path: '/admin/setup' },
    ];

    return (
        <Layout navItems={tabs}>
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage sessions, verify logs, and configure system.</p>
                    </div>
                </header>

                <main>
                    <Routes>
                        <Route path="overview" element={
                            <OverviewTab 
                                logs={logs} 
                                users={users} 
                                onNavigateToRedFlags={() => navigate('/admin/approvals')} 
                            />
                        } />
                        <Route path="planning" element={
                            <PlanningTab 
                                modules={modules}
                                users={users}
                                lessonPlans={lessonPlans}
                                onAddPlan={addLessonPlan}
                            />
                        } />
                        <Route path="approvals" element={
                            <ApprovalsTab 
                                logs={logs} 
                                users={users} 
                                modules={modules}
                                onUpdateStatus={updateLogStatus} 
                            />
                        } />
                        <Route path="entry" element={<MentorLogForm />} />
                        <Route path="setup" element={
                            <SetupTab 
                                batches={batches}
                                modules={modules}
                                groups={groups}
                                users={users}
                                onAddBatch={addBatch}
                                onAddModule={addModule}
                                onUpdateModule={updateModule}
                                onAddUser={addUser}
                                onAddGroup={addGroup}
                                onUpdateGroup={updateGroup}
                            />
                        } />
                        <Route path="/" element={<Navigate to="overview" replace />} />
                    </Routes>
                </main>
            </div>
        </Layout>
    );
};