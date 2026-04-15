import React, { useState } from 'react';
import { Calendar, Plus, Send, Repeat, AlertTriangle } from 'lucide-react';
import { Module, User, LessonPlan, Role, ActivityType, PlanStatus, MentorType } from '../../types';

interface PlanningTabProps {
  modules: Module[];
  users: User[];
  lessonPlans: LessonPlan[];
  onAddPlan: (plan: LessonPlan) => void;
}

export const PlanningTab: React.FC<PlanningTabProps> = ({ modules, users, lessonPlans, onAddPlan }) => {
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
    </div>
  );
};
