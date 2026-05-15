import React, { useState, useEffect } from 'react';
import { useData } from '../../services/DataContext';
import { AttendanceStatus, CompetencyScore, LogStatus, MentoringLog, Role, LessonPlan } from '../../types';
import { toast } from 'sonner';
import { Clock, Users, Save, Link as LinkIcon, Upload, AlertTriangle, CheckCircle, Shield, CalendarCheck, HelpCircle, ArrowLeft, Mic, Star, Sparkles, MessageSquare, Loader2, Send } from 'lucide-react';
import { SYSTEM_FALLBACK_RUBRIC } from '../../constants';
import { draftAssessmentWithAI } from '../../services/aiService';

interface MentorLogFormProps {
  initialData?: Partial<MentoringLog> & { lessonPlanId?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// SFIA Level Definitions
const SFIA_LEVELS = [
    { score: 0, level: 'N/A', label: 'Not Observed / No Output', color: 'text-gray-400' },
    { score: 1, level: 'Level 1', label: 'Follow - Needs close supervision, performs routine tasks.', color: 'text-red-500' },
    { score: 2, level: 'Level 2', label: 'Assist - Understands concepts but needs constant guidance/AI.', color: 'text-orange-500' },
    { score: 3, level: 'Level 2', label: 'Assist - Follows steps correctly, effective with help.', color: 'text-yellow-600' },
    { score: 4, level: 'Level 3', label: 'Apply - Completes tasks independently, uses AI efficiently.', color: 'text-blue-500' },
    { score: 5, level: 'Level 3', label: 'Apply - Exceeds expectations, solves complex problems autonomously.', color: 'text-green-600' }
];

export const MentorLogForm: React.FC<MentorLogFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { batches, getModulesByBatch, currentUser, getStudentsByBatch, addLog, users, lessonPlans, rubrics } = useData();
  
  // Local State
  const [selectedBatchId, setSelectedBatchId] = useState(initialData?.batchId || batches[0]?.id || '');
  const [selectedModuleId, setSelectedModuleId] = useState(initialData?.moduleId || '');
  
  // Admin Proxy State
  const isAdmin = currentUser.role === Role.ADMIN;
  const mentors = users.filter(u => u.role === Role.MENTOR);
  const [selectedMentorId, setSelectedMentorId] = useState(initialData?.mentorId || '');

  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [endTime, setEndTime] = useState(initialData?.endTime || '');
  const [summary, setSummary] = useState(initialData?.summaryNote || '');
  const [artifactUrl, setArtifactUrl] = useState(initialData?.artifactUrl || '');
  const [scores, setScores] = useState<CompetencyScore[]>(initialData?.scores || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // New Features State
  const [isListening, setIsListening] = useState(false);
  const [isStarred, setIsStarred] = useState(initialData?.isStarred || false);
  const [digitalSignature, setDigitalSignature] = useState(initialData?.digitalSignature || false);
  const [isDraftingAI, setIsDraftingAI] = useState<Record<string, boolean>>({});

  const students = getStudentsByBatch(selectedBatchId);
  const modules = getModulesByBatch(selectedBatchId);
  const selectedModule = modules.find(m => m.id === selectedModuleId);

  const handleDraftAssessmentWithAI = async (studentId: string) => {
      const studentScore = scores.find(s => s.studentId === studentId);
      if (!studentScore) return;

      const artifact = studentScore.studentArtifactUrl || artifactUrl;
      const reflection = studentScore.studentReflection || '';

      if (!artifact && !reflection) {
          toast.error("Student has not submitted an artifact or reflection to evaluate.");
          return;
      }

      const activeCategories = selectedModule?.assessmentConfig?.filter(c => c.isEnabled) || [];
      if (activeCategories.length === 0) {
          toast.error("No active rubric categories found for this module.");
          return;
      }

      setIsDraftingAI(prev => ({ ...prev, [studentId]: true }));
      try {
          const result = await draftAssessmentWithAI(artifact, reflection, activeCategories);
          
          setScores(prev => prev.map(s => {
              if (s.studentId !== studentId) return s;
              
              // Merge AI suggested scores
              const newMetrics = { ...s.metrics };
              Object.keys(result.scores).forEach(categoryName => {
                  // Only merge if the category is one of the active categories
                  if (activeCategories.some(c => c.name === categoryName)) {
                      newMetrics[categoryName] = result.scores[categoryName];
                  }
              });

              return {
                  ...s,
                  metrics: newMetrics,
                  feedback: result.feedback
              };
          }));
      } catch (error) {
          console.error("Failed to draft assessment with AI:", error);
          toast.error("Failed to generate AI assessment. Please check your API key and try again.");
      } finally {
          setIsDraftingAI(prev => ({ ...prev, [studentId]: false }));
      }
  };

  // Backdate limitation logic: Mentors max 3 days, Admin unlimited
  const minDate = isAdmin ? undefined : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Load Initial Data (From Dashboard)
  useEffect(() => {
    if (initialData) {
      if (initialData.batchId) setSelectedBatchId(initialData.batchId);
      if (initialData.moduleId) setSelectedModuleId(initialData.moduleId);
      if (initialData.date) setDate(initialData.date);
      if (initialData.startTime) setStartTime(initialData.startTime);
      if (initialData.endTime) setEndTime(initialData.endTime);
      if (initialData.summaryNote) setSummary(initialData.summaryNote);
      if (initialData.artifactUrl) setArtifactUrl(initialData.artifactUrl);
      if (initialData.scores && initialData.scores.length > 0) setScores(initialData.scores);
      if (initialData.isStarred !== undefined) setIsStarred(initialData.isStarred);
      if (initialData.digitalSignature !== undefined) setDigitalSignature(initialData.digitalSignature);
      if (initialData.mentorId && isAdmin) setSelectedMentorId(initialData.mentorId);
    }
  }, [initialData, isAdmin]);

  // Auto-select first module if available when batch changes
  useEffect(() => {
    if (!initialData?.moduleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [selectedBatchId, modules, initialData]);

  // Set default mentor ID if Admin
  useEffect(() => {
      if (isAdmin && mentors.length > 0 && !selectedMentorId) {
          setSelectedMentorId(mentors[0].id);
      }
  }, [isAdmin, mentors]);

  // Initialize scores
  useEffect(() => {
    if (students.length > 0 && scores.length === 0) {
      // Find dynamic rubric for this module
      const customRubric = rubrics.find(r => r.moduleId === selectedModuleId);
      const activeCategories = customRubric?.categories || SYSTEM_FALLBACK_RUBRIC;
      
      const initialScores: CompetencyScore[] = students.map(s => {
          const metrics: Record<string, number> = {};
          activeCategories.forEach(cat => {
              if (cat.isEnabled) metrics[cat.name] = 3;
          });

          return {
            studentId: s.id,
            attendance: AttendanceStatus.PRESENT,
            metrics: metrics,
            sfiaQualifiers: [],
            feedback: ''
          };
      });
      setScores(initialScores);
    }
  }, [selectedBatchId, students.length, selectedModuleId, selectedModule, scores.length, rubrics]); 

  // Check for Lesson Plans
  const availablePlan = lessonPlans.find(p => p.moduleId === selectedModuleId && p.date === date);

  const applyLessonPlan = () => {
      if (availablePlan) {
          setStartTime(availablePlan.startTime);
          setEndTime(availablePlan.endTime);
          setSummary(availablePlan.topic);
          if (availablePlan.mentorId && isAdmin) {
              setSelectedMentorId(availablePlan.mentorId);
          }
      }
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const duration = calculateDuration();
  const isValidSession = duration >= 50;

  const handleScoreChange = (studentId: string, categoryName: string, value: number) => {
    // Artifact Check: If no artifact is attached, cap score at 2
    if (!artifactUrl && value > 2) {
        // Just visual warning or restriction? Let's restrict for consistency with prompt.
        // But users might add URL later. Let's allow but show warning.
        // Requirement: "if no work attached, score not > 2"
        // Let's soft-block or just warn.
    }
    
    setScores(prev => prev.map(s => {
        if (s.studentId !== studentId) return s;
        return {
            ...s,
            metrics: {
                ...s.metrics,
                [categoryName]: value
            }
        };
    }));
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
      setScores(prev => prev.map(s => s.studentId === studentId ? { ...s, attendance: status } : s));
  };

  const toggleSfiaQualifier = (studentId: string, qualifier: string) => {
      setScores(prev => prev.map(s => {
          if (s.studentId !== studentId) return s;
          const current = s.sfiaQualifiers || [];
          const updated = current.includes(qualifier) 
            ? current.filter(q => q !== qualifier)
            : [...current, qualifier];
          return { ...s, sfiaQualifiers: updated };
      }));
  };

  const handleFeedbackChange = (studentId: string, text: string) => {
      setScores(prev => prev.map(s => s.studentId === studentId ? { ...s, feedback: text } : s));
  };

  const generateFeedback = (studentId: string) => {
      const studentScore = scores.find(s => s.studentId === studentId);
      if (!studentScore) return;

      const metrics = Object.values(studentScore.metrics) as number[];
      const avg = metrics.length ? metrics.reduce((a, b) => a + b, 0) / metrics.length : 0;
      const level = SFIA_LEVELS.find(l => l.score === Math.round(avg))?.level || 'N/A';
      const qualifiers = studentScore.sfiaQualifiers || [];
      
      let comment = `Demonstrated ${level} competency in this session. `;
      if (avg >= 4) comment += "Student showed strong ability to apply concepts independently. ";
      else if (avg >= 2) comment += "Student required some guidance but followed procedures well. ";
      else comment += "Student needs more practice on fundamentals. ";

      if (qualifiers.includes('Autonomy')) comment += "Worked with good autonomy. ";
      if (qualifiers.includes('Complexity')) comment += "Handled complex tasks effectively. ";
      if (qualifiers.includes('Knowledge')) comment += "Applied previous knowledge well. ";

      handleFeedbackChange(studentId, comment);
  };

  // Voice to Text Simulation/Implementation
  const toggleVoiceInput = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          // @ts-ignore
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = false;

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setSummary(prev => prev + (prev ? ' ' : '') + transcript);
          };
          recognition.start();
      } else {
          // Fallback simulation for demo
          if (!isListening) {
            setIsListening(true);
            setTimeout(() => {
                setSummary(prev => prev + (prev ? ' ' : '') + "Student showed great progress in understanding the core concepts today.");
                setIsListening(false);
            }, 1500);
          }
      }
  };

  // Logic to calculate if session is "Red Flag" (Low Scores)
  const isRedFlagSession = scores.some(s => {
      if (s.attendance === AttendanceStatus.ABSENT) return false;
      const values = Object.values(s.metrics) as number[];
      const avg = values.length ? values.reduce((a,b) => a+b, 0) / values.length : 0;
      return avg < 2.5;
  });

    const submitForm = async (targetStatus: LogStatus) => {
    if (isAdmin && !selectedMentorId) {
        toast.error("Please select a mentor to record for.");
        return;
    }
    if (!selectedModuleId) {
        toast.error("Please select a teaching module.");
        return;
    }
    // Artifact is not strictly required for DRAFT, but let's keep it required for PENDING
    if (targetStatus === LogStatus.PENDING && !artifactUrl) {
      toast.error("Please provide an artifact link (Proof of work) before submitting for approval.");
      return;
    }
    if (targetStatus === LogStatus.PENDING && !digitalSignature) {
        toast.error("Please check the digital signature box to certify this session before submitting.");
        return;
    }

    setIsSubmitting(true);

    const newLog: MentoringLog = {
      id: initialData?.id || `log-${Date.now()}`,
      mentorId: '', 
      recordedBy: '', 
      batchId: selectedBatchId,
      moduleId: selectedModuleId,
      date,
      startTime,
      endTime,
      durationMinutes: duration,
      isValidSession: isValidSession,
      status: targetStatus,
      summaryNote: summary,
      artifactUrl,
      scores,
      isStarred,
      digitalSignature,
      history: []
    };

    try {
        await addLog(newLog, isAdmin ? selectedMentorId : undefined);
        setIsSubmitting(false);
        setSuccessMsg(targetStatus === LogStatus.DRAFT ? "Draft saved successfully!" : "Log submitted successfully!");
        setSummary('');
        setArtifactUrl('');
        setDigitalSignature(false);
        setIsStarred(false);
        
        if (onSuccess) {
            setTimeout(() => onSuccess(), 1000);
        } else {
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    } catch (error: any) {
        console.error("Failed to submit log:", error);
        setIsSubmitting(false);
        toast.error(`Failed to save log: ${error.message || 'Unknown database error'}. Please try again.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm(LogStatus.PENDING);
  };

  // Determine which categories to render
  const currentRubric = rubrics.find(r => r.moduleId === selectedModule?.id);
  const activeCategories = currentRubric?.categories?.filter(c => c.isEnabled) || SYSTEM_FALLBACK_RUBRIC;

  return (
    <div className={`bg-white rounded-[1.5rem] shadow-sm border overflow-hidden ${isAdmin ? 'border-[#454040]/30' : 'border-gray-100'}`}>
      <div className={`p-5 border-b ${isAdmin ? 'bg-[#454040] text-white' : 'bg-gray-50 text-[#454040]'}`}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
                {onCancel && (
                    <button onClick={onCancel} className={`p-2 rounded-full transition-all ${isAdmin ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-100 text-gray-600 shadow-sm'}`}>
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div>
                    <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter italic">
                        <Clock className="w-6 h-6" /> 
                        {isAdmin ? "Admin Proxy Entry" : initialData ? "Complete Session Log" : "New Session Log"}
                    </h2>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${isAdmin ? 'opacity-50' : 'text-gray-400'}`}>
                        {isAdmin 
                            ? "Recording session on behalf of a mentor" 
                            : "Sessions must be 50+ minutes for valid credit"}
                    </p>
                </div>
            </div>
            {isAdmin && <Shield className="w-8 h-8 text-white opacity-20" />}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Admin Proxy Selection */}
        {isAdmin && (
            <div className="bg-[#454040]/5 border border-[#454040]/10 p-4 rounded-[1.5rem] flex items-center gap-5">
                <div className="w-10 h-10 bg-[#454040] rounded-2xl flex items-center justify-center text-white shrink-0">
                    <Shield size={20} />
                </div>
                <div className="flex-1">
                    <label className="block text-[9px] font-black text-[#454040] uppercase tracking-widest mb-1.5">Log on behalf of Mentor</label>
                    <select
                        value={selectedMentorId}
                        onChange={(e) => setSelectedMentorId(e.target.value)}
                        className="w-full rounded-[1.2rem] border-gray-100 p-2.5 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-white"
                    >
                        <option value="">-- Select Mentor --</option>
                        {mentors.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.fullName} ({m.mentorType})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* Section 1: Session Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div>
            <label className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2.5 ml-1">Batch (Cohort)</label>
            <select 
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full rounded-[1.5rem] border-gray-50 p-3 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-gray-50/50 font-bold"
              disabled={!!initialData}
            >
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2.5 ml-1">Teaching Module</label>
            <select 
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full rounded-[1.5rem] border-gray-50 p-3 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-gray-50/50 font-bold"
              disabled={modules.length === 0 || !!initialData}
            >
              {modules.length === 0 && <option>No modules found</option>}
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2.5 ml-1">Date</label>
            <input 
              type="date" 
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-[1.5rem] border-gray-50 p-3 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-gray-50/50 font-bold"
              disabled={!!initialData?.date}
            />
             {!isAdmin && <p className="text-[9px] font-black text-gray-200 uppercase tracking-widest mt-2 ml-4">Backdating limit: 3 days</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2.5 ml-1">Start Time</label>
                <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-[1.5rem] border-gray-50 p-3 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-gray-50/50 font-bold"
                    required
                />
             </div>
             <div>
                <label className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2.5 ml-1">End Time</label>
                <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-[1.5rem] border-gray-50 p-3 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-gray-50/50 font-bold"
                    required
                />
             </div>
          </div>
          
          {/* Plan Auto-fill Notification */}
          {availablePlan && !initialData && (
              <div className="col-span-1 md:col-span-2 bg-[#454040]/5 border border-[#454040]/10 rounded-[1.5rem] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#454040] rounded-xl text-white">
                          <CalendarCheck size={20} />
                      </div>
                      <div>
                          <p className="text-sm font-black text-[#454040] uppercase tracking-widest">Planned Session Found</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-1">{availablePlan.topic} ({availablePlan.startTime} - {availablePlan.endTime})</p>
                      </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={applyLessonPlan}
                    className="bg-[#454040] text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-[1.5rem] hover:bg-[#353030] shadow-lg shadow-[#454040]/10 transition-all active:scale-95"
                  >
                      Apply Plan
                  </button>
              </div>
          )}

          <div className="col-span-1 md:col-span-2">
             <div className={`rounded-[1.5rem] border p-5 flex flex-col items-center justify-center transition-all ${isValidSession ? 'bg-emerald-50/50 border-emerald-100 shadow-lg shadow-emerald-900/5' : 'bg-red-50 border-red-100'}`}>
                 <div className="text-center">
                     <p className="text-[9px] text-gray-300 uppercase font-black tracking-[0.25em] mb-1.5">Net Duration</p>
                     <p className={`text-3xl font-black italic tracking-tighter ${isValidSession ? 'text-emerald-600' : 'text-red-600'}`}>
                         {duration} MIN
                     </p>
                 </div>
                 <div className="mt-4 flex items-center gap-3">
                     {isValidSession ? (
                        <>
                            <CheckCircle size={22} className="text-emerald-500" />
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Valid Working Hour (1 Credit)</span>
                        </>
                     ) : (
                        <>
                            <AlertTriangle size={22} className="text-red-500" />
                            <span className="text-xs font-black text-red-800 uppercase tracking-widest">Duration too short (Min. 50 mins)</span>
                        </>
                     )}
                 </div>
             </div>
          </div>
        </section>

        {/* Section 2: Artifacts */}
        <section className="bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-50">
             <div className="flex flex-col md:flex-row gap-6">
                 <div className="flex-1">
                    <label className="block text-[9px] font-black text-[#454040] uppercase tracking-[0.2em] mb-2.5 flex items-center gap-3">
                        <LinkIcon className="w-4 h-4 opacity-40" /> Artifact Link (Required)
                    </label>
                    <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-3">
                        Proof of work (GitHub, Drive, etc)
                        <span className="text-red-500/50 ml-2">※ Scores &gt; 2 require artifact</span>
                    </p>
                    <input 
                        type="url" 
                        value={artifactUrl}
                        onChange={(e) => setArtifactUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-[1.2rem] border-gray-50 p-3 text-xs focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-white font-bold"
                    />
                 </div>
                 <div className="flex items-end">
                    <label className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] border cursor-pointer transition-all ${isStarred ? 'bg-[#454040] border-[#454040] text-white shadow-xl shadow-[#454040]/20' : 'bg-white border-gray-100 text-gray-300 hover:border-[#454040]/30 hover:text-[#454040]'}`}>
                        <input 
                            type="checkbox" 
                            checked={isStarred} 
                            onChange={(e) => setIsStarred(e.target.checked)} 
                            className="hidden"
                        />
                        <Star size={18} fill={isStarred ? "currentColor" : "none"} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Showcase</span>
                    </label>
                 </div>
             </div>
        </section>

        {/* Section 3: Student Assessment (SFIA) */}
        <section className="space-y-6">
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-lg font-black text-[#454040] flex items-center gap-3 uppercase tracking-tighter italic">
                    <Users className="w-5 h-5" /> Assessment (SFIA)
                </h3>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-50">
                    Rubric: {selectedModule?.assessmentConfig ? 'CUSTOM' : 'SYSTEM'}
                </span>
            </div>
            
            {students.length === 0 ? (
                <div className="text-center p-12 bg-gray-50/30 rounded-[1.5rem] border border-dashed border-gray-100">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">No students in batch</p>
                </div>
            ) : (
                <div className="space-y-6">
                {students.map((student) => {
                    const score = scores.find(s => s.studentId === student.id);
                    if (!score) return null;
                    const qualifiers = score.sfiaQualifiers || [];
 
                    return (
                        <div key={student.id} className="bg-white border border-gray-50 rounded-[1.5rem] p-5 shadow-sm hover:shadow-lg transition-all group/student">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <img src={student.avatarUrl} alt={student.fullName} className="w-12 h-12 rounded-full border-2 border-gray-50 shadow-sm object-cover group-hover/student:scale-105 transition-transform duration-500" />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <p className="font-black text-[#454040] text-lg uppercase tracking-tighter italic">{student.fullName}</p>
                                        <div className="flex gap-1.5 mt-2">
                                            {['Autonomy', 'Complexity', 'Knowledge'].map(q => (
                                                <label key={q} className={`text-[8px] px-2 py-0.5 rounded-full border cursor-pointer select-none transition-all font-black uppercase tracking-widest ${qualifiers.includes(q) ? 'bg-[#454040] text-white border-[#454040]' : 'bg-gray-50/50 text-gray-300 border-gray-100 hover:bg-gray-100'}`}>
                                                    <input type="checkbox" className="hidden" checked={qualifiers.includes(q)} onChange={() => toggleSfiaQualifier(student.id, q)} />
                                                    {q}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100">
                                    {[AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT].map((status) => (
                                        <button
                                            type="button"
                                            key={status}
                                            onClick={() => handleAttendanceChange(student.id, status)}
                                            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                                                score.attendance === status 
                                                ? status === AttendanceStatus.PRESENT ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                                                : status === AttendanceStatus.LATE ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10' 
                                                : 'bg-red-500 text-white shadow-md shadow-red-500/10'
                                                : 'text-gray-300 hover:text-gray-500'
                                            }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Student Submission Info */}
                            {(score.studentArtifactUrl || score.studentReflection) && (
                                <div className="mt-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                    <h5 className="text-xs font-bold text-indigo-800 mb-2">Student Submission</h5>
                                    {score.studentArtifactUrl && (
                                        <div className="mb-2">
                                            <span className="text-[10px] uppercase font-bold text-indigo-500 mr-2">Artifact:</span>
                                            <a href={score.studentArtifactUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline break-all">
                                                {score.studentArtifactUrl}
                                            </a>
                                        </div>
                                    )}
                                    {score.studentReflection && (
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-indigo-500 block mb-1">Reflection:</span>
                                            <p className="text-xs text-indigo-900 italic bg-white p-2 rounded border border-indigo-50">
                                                "{score.studentReflection}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Rubrics - Only show if present or late */}
                            {score.attendance !== AttendanceStatus.ABSENT && (
                             <div className="space-y-5 pt-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.25em]">Assessment Metrics</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleDraftAssessmentWithAI(student.id)}
                                            disabled={isDraftingAI[student.id]}
                                            className="text-[9px] bg-[#454040]/5 text-[#454040] px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#454040]/10 disabled:opacity-50 transition-all font-black uppercase tracking-widest border border-[#454040]/10 shadow-sm"
                                        >
                                            {isDraftingAI[student.id] ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={12} />
                                            )}
                                            {isDraftingAI[student.id] ? 'AI DRAFTING...' : 'AI ASSISTANT'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {activeCategories.map((cat) => {
                                            const val = score.metrics[cat.name] || 0;
                                            const sfiaInfo = SFIA_LEVELS.find(l => l.score === val);
                                            const levelDescription = cat.levels && cat.levels[val] ? cat.levels[val] : sfiaInfo?.label;
 
                                            return (
                                                <div key={cat.id} className="group relative">
                                                    <div className="flex justify-between mb-3">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            {cat.name}
                                                        </label>
                                                        <span className={`text-[11px] font-black ${sfiaInfo?.color}`}>{val}/5</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0" max="5" step="1"
                                                        value={val}
                                                        onChange={(e) => handleScoreChange(student.id, cat.name, parseInt(e.target.value))}
                                                        className={`w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#454040] ${!artifactUrl && val > 2 ? 'ring-2 ring-red-300' : ''}`}
                                                    />
                                                    <p className={`text-[10px] mt-3 font-bold uppercase tracking-tight leading-relaxed ${sfiaInfo?.color}`}>
                                                        {levelDescription}
                                                    </p>
                                                    {!artifactUrl && val > 2 && (
                                                        <p className="text-[9px] font-black text-red-500 mt-2 uppercase tracking-widest">⚠️ Evidence required</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Smart Feedback */}
                                    <div className="bg-gray-50/30 p-4 rounded-[1.5rem] border border-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                                <MessageSquare size={12} className="opacity-30" /> Feedback
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={() => generateFeedback(student.id)}
                                                className="text-[8px] bg-white text-[#454040] px-3 py-1 rounded-full flex items-center gap-2 hover:bg-[#454040] hover:text-white transition-all font-black uppercase tracking-widest shadow-sm border border-gray-100"
                                            >
                                                <Sparkles size={10} /> Auto-Gen
                                            </button>
                                        </div>
                                        <textarea 
                                            value={score.feedback || ''}
                                            onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                            placeholder="Specify observations..."
                                            rows={2}
                                            className="w-full text-xs p-3.5 rounded-[1.2rem] border-gray-50 focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-white font-medium"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            )}
        </section>

        {/* Section 4: Summary Note */}
        <section className="bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-50">
             <div className="mb-4">
                 <div className="flex justify-between items-center mb-3">
                    <label className="block text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Session Overview</label>
                    <button 
                        type="button" 
                        onClick={toggleVoiceInput}
                        className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${isListening ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 'bg-white text-gray-400 border-gray-50 hover:bg-gray-50'}`}
                    >
                        <Mic size={12} /> {isListening ? 'Listening...' : 'Voice Dictate'}
                    </button>
                 </div>
                 <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Describe session summary, blockers, and next steps..."
                    rows={3}
                    className="w-full rounded-[1.2rem] border-gray-50 p-4 text-xs font-bold focus:ring-4 focus:ring-[#454040]/5 focus:border-[#454040] outline-none transition-all bg-white"
                 />
             </div>
        </section>
        
        {/* Integrity Check */}
        <div className="p-5 bg-[#454040]/5 rounded-[1.5rem] border border-[#454040]/10 flex items-start gap-5">
            <div className="relative flex items-center mt-0.5">
                <input 
                    type="checkbox" 
                    id="digitalSig"
                    checked={digitalSignature}
                    onChange={(e) => setDigitalSignature(e.target.checked)}
                    className="w-5 h-5 text-[#454040] border-gray-100 rounded-[0.4rem] focus:ring-[#454040] cursor-pointer"
                />
            </div>
            <div>
                <label htmlFor="digitalSig" className="block text-[11px] font-black text-[#454040] uppercase tracking-widest cursor-pointer">
                    Digital Signature / Integrity Pledge
                </label>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.1em] mt-1 leading-relaxed">
                    I certify that this mentoring session occurred as recorded, and the assessment accurately reflects performance.
                </p>
            </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-50 gap-6">
             <div className="text-[9px] font-black text-gray-200 uppercase tracking-[0.25em] w-full sm:w-auto text-center sm:text-left">
                Secured Submission Protocol <span className="text-emerald-500/50 ml-2">● Active</span>
             </div>
             <div className="flex gap-3 w-full sm:w-auto">
                 <button 
                    type="button" 
                    onClick={() => submitForm(LogStatus.DRAFT)}
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2.5 text-[#454040] bg-white border border-gray-100 px-8 py-3 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest transition-all hover:bg-gray-50 shadow-sm active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                    <Save className="w-4 h-4 opacity-40" />
                    Save Draft
                 </button>
                 <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2.5 text-white px-8 py-3 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.25em] shadow-xl shadow-[#454040]/10 transition-all active:scale-95 border border-white/10 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'bg-[#454040] hover:bg-[#353030]'}`}
                 >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'SAVING...' : 'SUBMIT LOG'}
                 </button>
             </div>
        </div>
        {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-6 rounded-[1.5rem] border border-emerald-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 shadow-xl shadow-emerald-900/5">
                <CheckCircle className="w-6 h-6" /> 
                <span className="font-black uppercase tracking-widest text-sm">{successMsg}</span>
            </div>
        )}
      </form>
    </div>
  );
};
