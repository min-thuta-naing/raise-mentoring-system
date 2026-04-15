import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Send, Repeat, AlertTriangle, BookOpen, Edit, Trash2, X, Shield, ChevronsDown, ChevronDown } from 'lucide-react';
import { Module, User, LessonPlan, Role, ActivityType, PlanStatus, MentorType, Batch } from '../../types';

interface PlanningTabProps {
  modules: Module[];
  batches: Batch[];
  users: User[];
  lessonPlans: LessonPlan[];
  onAddPlan: (plan: LessonPlan) => void;
  onAddModule: (m: Module) => void;
  onUpdateModule: (m: Module) => void;
  onDeleteModule: (id: string) => void;
}

export const PlanningTab: React.FC<PlanningTabProps> = ({
  modules,
  batches,
  users,
  lessonPlans,
  onAddPlan,
  onAddModule,
  onUpdateModule,
  onDeleteModule
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Module Management State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');

  // Adaptive Scroll State
  const [showScrollUp, setShowScrollUp] = useState(false);

  // Scroll Tracking Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the top modules section is visible, we should offer to scroll DOWN
        // If it's NOT visible, we are down in the workspace and should offer to scroll UP
        setShowScrollUp(!entry.isIntersecting);
      },
      { 
        threshold: 0.1,
        rootMargin: "-80px 0px 0px 0px" // Account for the dashboard section nav
      }
    );

    const target = document.getElementById('modules-section');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, []);

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
      if (!confirm("Warning: This mentor has a conflicting session at this time. Do you want to proceed?")) return;
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

  // Module Handlers
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newModuleName && selectedBatchId) {
      if (editingModule) {
        onUpdateModule({
          ...editingModule,
          name: newModuleName,
          batchId: selectedBatchId
        });
      } else {
        onAddModule({
          id: `m-${Date.now()}`,
          batchId: selectedBatchId,
          name: newModuleName,
          assessmentConfig: [],
          createdAt: Date.now()
        });
      }
      setIsModuleModalOpen(false);
      setNewModuleName('');
      setEditingModule(null);
    }
  }

  const openModuleModal = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setNewModuleName(module.name);
      setSelectedBatchId(module.batchId);
    } else {
      setEditingModule(null);
      setNewModuleName('');
      setSelectedBatchId(batches[0]?.id || '');
    }
    setIsModuleModalOpen(true);
  };

  const handleDeleteModule = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    onDeleteModule(deleteConfirm.id);
    if (selectedModuleId === deleteConfirm.id) {
      setSelectedModuleId(modules.find(m => m.id !== deleteConfirm.id)?.id || '');
    }
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  // Reusable Module Card Sub-component
  const renderModuleCard = (m: Module, isRecent: boolean = false) => (
    <div
      key={isRecent ? `recent-${m.id}` : m.id}
      onClick={() => {
        setSelectedModuleId(m.id);
        if (isViewAllModalOpen) setIsViewAllModalOpen(false);
      }}
      className={`p-3 rounded-lg text-sm flex justify-between items-center cursor-pointer transition-all border w-full ${selectedModuleId === m.id
          ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm'
          : isRecent
            ? 'bg-indigo-50/30 border-indigo-100/50 hover:bg-indigo-50/50'
            : 'bg-gray-50 border-transparent hover:bg-gray-100'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 rounded-full ${selectedModuleId === m.id ? 'bg-indigo-600' : isRecent ? 'bg-indigo-300' : 'bg-gray-300'}`} />
        <span className={`font-medium ${selectedModuleId === m.id ? 'text-indigo-900' : 'text-gray-700'}`}>
          {m.name}
        </span>
        {isRecent && (
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">New</span>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); openModuleModal(m); }}
          className="p-1.5 text-[#005461] hover:bg-white rounded-md transition-all shadow-sm"
          title="Edit"
        >
          <Edit size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteModule(m.id, m.name); }}
          className="p-1.5 text-[#D34E4E] hover:bg-white rounded-md transition-all shadow-sm"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dashboard Sections Navigation (Local to Planning) */}
      <div className="flex items-center gap-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
        <span className="text-gray-900">Dashboard Sections:</span>
        <nav className="flex items-center gap-4">
          <button
            onClick={() => document.getElementById('modules-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-indigo-600 border-b-2 border-indigo-600 pb-1"
          >
            Modules
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => document.getElementById('summary-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-indigo-600 transition-colors"
          >
            Summary
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => document.getElementById('planning-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-indigo-600 transition-colors"
          >
            Planning
          </button>
        </nav>
      </div>

      {/* 1. Modules Top Section (Flexible Height) */}
      <div id="modules-section" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-auto min-h-[160px] scroll-mt-24">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" /> Modules
          </h3>
          <button
            onClick={() => openModuleModal()}
            className="flex items-center gap-1 bg-indigo-50 text-[#1A3263] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <Plus size={14} /> Add New Module
          </button>
        </div>

        <div className="flex-1">
          {(() => {
            const RECENT_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
            const now = Date.now();
            const recentModules = modules.filter(m => m.createdAt && (now - m.createdAt) < RECENT_THRESHOLD);
            const allSortedModules = [...modules].sort((a, b) => a.name.localeCompare(b.name));
            const displayedAllModules = allSortedModules.slice(0, 3);
            const remainingCount = allSortedModules.length - 3;

            return (
              <div className="space-y-6">
                {recentModules.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-indigo-400 mb-3 tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" /> Recently Created
                    </h4>
                    <div className="space-y-2">
                      {recentModules.map(m => renderModuleCard(m, true))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">
                    All Modules
                  </h4>
                  <div className="space-y-2">
                    {displayedAllModules.map(m => renderModuleCard(m))}

                    {allSortedModules.length > 3 && (
                      <button
                        onClick={() => setIsViewAllModalOpen(true)}
                        className="w-full py-2 px-4 border border-dashed border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                      >
                        Show More (+{remainingCount})
                      </button>
                    )}

                    {modules.length === 0 && (
                      <div className="text-center py-10 px-4">
                        <BookOpen size={30} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-gray-400 text-xs italic">No modules scheduled yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Adaptive Screen-Edge Fixed Scroll Indicator (Transparent) */}
      <div 
        onClick={() => {
          const targetId = showScrollUp ? 'modules-section' : 'planning-workspace';
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="fixed right-6 bottom-1/3 flex flex-col items-center gap-1 cursor-pointer group z-50 transition-all hover:scale-110 active:scale-95"
      >
        <div className="flex flex-col items-center transition-all">
          <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-600 transition-colors lowercase tracking-[0.1em] vertical-text flex items-center justify-center py-4">
            {showScrollUp ? 'scroll to modules' : 'scroll to planning'}
          </span>
          {/* High-Fidelity Triple-Chevron Stack */}
          <div className={`transition-transform duration-50 ${showScrollUp ? 'rotate-180' : 'rotate-0'}`}>
            <div className={`flex flex-col items-center leading-none text-indigo-500 group-hover:text-indigo-600 transition-all ${showScrollUp ? '' : 'animate-bounce'}`}>
              <div className="opacity-30"><ChevronDown size={22} strokeWidth={3} /></div>
              <div className="opacity-60 -mt-3"><ChevronDown size={22} strokeWidth={3} /></div>
              <div className="opacity-100 -mt-3"><ChevronDown size={22} strokeWidth={3} /></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>

      {/* Currently Selected Module Banner */}
      <div id="planning-workspace" className="py-4 flex items-center gap-6 scroll-mt-24">
        <div id="summary-section" className="h-px bg-gradient-to-r from-transparent via-gray-200 to-gray-200 flex-1 scroll-mt-40"></div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-1">
            Currently Selected Module for Planning
          </span>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-tight">
              {selectedModule?.name || 'Select a Module'}
            </h2>
          </div>
        </div>
        <div id="planning-section" className="h-px bg-gradient-to-l from-transparent via-gray-200 to-gray-200 flex-1 scroll-mt-40"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* 2. Summary (Left Column) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider flex items-center gap-2">
              Summary: <span className="text-indigo-600 truncate">{selectedModule?.name || 'No Module Selected'}</span>
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h4 className="text-xs font-bold uppercase text-indigo-500 mb-1">Planned Content</h4>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-indigo-900">{(lectureHours + practiceHours).toFixed(1)} h</span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Total</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
        </div>

        {/* 3. Lesson Plan Table (Right Column) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
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
                {filteredPlans.sort((a, b) => {
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
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${plan.activityType === ActivityType.LECTURE
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-green-50 text-green-700 border-green-100'
                          }`}>
                          {plan.activityType === ActivityType.LECTURE ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{plan.topic}</td>
                      <td className="p-3 text-gray-600 flex items-center gap-2">
                        {m && <img src={m.avatarUrl} className="w-5 h-5 rounded-full" alt="" />}
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

      {/* Module Creation/Edit Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-indigo-600" /> {editingModule ? 'Edit Module' : 'New Module'}
              </h3>
              <button
                onClick={() => {
                  setIsModuleModalOpen(false);
                  setEditingModule(null);
                  setNewModuleName('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Module Title</label>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="e.g. Advanced AI Integration"
                  className="w-full rounded-xl border-gray-200 p-3 border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={newModuleName}
                  onChange={e => setNewModuleName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Batch</label>
                <select
                  required
                  className="w-full rounded-xl border-gray-200 p-3 border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                >
                  <option value="" disabled>Select Batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsModuleModalOpen(false);
                    setEditingModule(null);
                    setNewModuleName('');
                  }}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  {editingModule ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-red-50">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <Trash2 className="text-red-600" size={24} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Module?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-700">"{deleteConfirm.name}"</span>?
              This action will remove all associated data and cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
                className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Modules Full List Modal */}
      {isViewAllModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Shield className="text-indigo-600" /> Full Curriculum
                </h3>
                <p className="text-xs text-gray-500 font-medium">Browse and manage all available modules</p>
              </div>
              <button
                onClick={() => setIsViewAllModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-white border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search modules..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-gray-100 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  value={moduleSearchTerm}
                  onChange={(e) => setModuleSearchTerm(e.target.value)}
                />
                <Shield className="absolute left-3 top-3.5 text-gray-400" size={16} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modules
                  .filter(m => m.name.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(m => renderModuleCard(m))}

                {modules.filter(m => m.name.toLowerCase().includes(moduleSearchTerm.toLowerCase())).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-gray-400 italic font-medium">No modules matching your search.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span>Total Modules: {modules.length}</span>
              <button
                onClick={() => setIsViewAllModalOpen(false)}
                className="text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
