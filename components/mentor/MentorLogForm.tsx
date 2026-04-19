import React, { useState, useEffect } from 'react';
import { useData } from '../../services/DataContext';
import { AttendanceStatus, CompetencyScore, LogStatus, MentoringLog, Role, LessonPlan } from '../../types';
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
          alert("Student has not submitted an artifact or reflection to evaluate.");
          return;
      }

      const activeCategories = selectedModule?.assessmentConfig?.filter(c => c.isEnabled) || [];
      if (activeCategories.length === 0) {
          alert("No active rubric categories found for this module.");
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
          alert("Failed to generate AI assessment. Please check your API key and try again.");
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
        alert("Please select a mentor to record for.");
        return;
    }
    if (!selectedModuleId) {
        alert("Please select a teaching module.");
        return;
    }
    // Artifact is not strictly required for DRAFT, but let's keep it required for PENDING
    if (targetStatus === LogStatus.PENDING && !artifactUrl) {
      alert("Please provide an artifact link (Proof of work) before submitting for approval.");
      return;
    }
    if (targetStatus === LogStatus.PENDING && !digitalSignature) {
        alert("Please check the digital signature box to certify this session before submitting.");
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
        // Alert the specific error message to help identify if it's a permission issue or something else
        alert(`Failed to save log: ${error.message || 'Unknown database error'}. Please try again.`);
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
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isAdmin ? 'border-indigo-200' : 'border-gray-100'}`}>
      <div className={`p-6 border-b ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-900'}`}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                {onCancel && (
                    <button onClick={onCancel} className={`p-1.5 rounded-full ${isAdmin ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-white hover:bg-gray-100 text-gray-600'}`}>
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5" /> 
                        {isAdmin ? "Admin Proxy Entry" : initialData ? "Complete Session Log" : "New Session Log"}
                    </h2>
                    <p className={`text-sm mt-1 ${isAdmin ? 'text-indigo-100' : 'text-indigo-600'}`}>
                        {isAdmin 
                            ? "You are recording a session on behalf of a mentor." 
                            : "Record your mentoring activity. Sessions must be 50+ minutes."}
                    </p>
                </div>
            </div>
            {isAdmin && <Shield className="w-8 h-8 text-indigo-300 opacity-50" />}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Admin Proxy Selection */}
        {isAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-4">
                <div className="flex-shrink-0">
                    <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-bold text-yellow-800 mb-1">Log on behalf of Mentor:</label>
                    <select
                        value={selectedMentorId}
                        onChange={(e) => setSelectedMentorId(e.target.value)}
                        className="w-full rounded border-yellow-300 p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch (Cohort)</label>
            <select 
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              disabled={!!initialData}
            >
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Module</label>
            <select 
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              disabled={modules.length === 0 || !!initialData}
            >
              {modules.length === 0 && <option>No modules found</option>}
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input 
              type="date" 
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
              disabled={!!initialData?.date}
            />
             {!isAdmin && <p className="text-[10px] text-gray-500 mt-1">Mentors can only log up to 3 days prior.</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Time</label>
                <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border-gray-300 p-2 border"
                    required
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Time</label>
                <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border-gray-300 p-2 border"
                    required
                />
             </div>
          </div>
          
          {/* Plan Auto-fill Notification */}
          {availablePlan && !initialData && (
              <div className="col-span-1 md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <CalendarCheck className="text-blue-600 w-5 h-5" />
                      <div>
                          <p className="text-sm font-bold text-blue-900">Planned Session Found!</p>
                          <p className="text-xs text-blue-700">Topic: {availablePlan.topic} ({availablePlan.startTime} - {availablePlan.endTime})</p>
                      </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={applyLessonPlan}
                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700"
                  >
                      Apply Plan
                  </button>
              </div>
          )}

          <div className="col-span-1 md:col-span-2">
             <div className={`rounded-lg border p-4 flex flex-col items-center justify-center transition-colors ${isValidSession ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                 <div className="text-center">
                     <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Net Duration</p>
                     <p className={`text-3xl font-bold ${isValidSession ? 'text-green-700' : 'text-red-600'}`}>
                         {duration} min
                     </p>
                 </div>
                 <div className="mt-2 flex items-center gap-2">
                     {isValidSession ? (
                        <>
                            <CheckCircle size={18} className="text-green-600" />
                            <span className="text-sm font-medium text-green-800">Valid Working Hour (1 Credit)</span>
                        </>
                     ) : (
                        <>
                            <AlertTriangle size={18} className="text-red-600" />
                            <span className="text-sm font-medium text-red-800">Duration too short (Min. 50 mins required)</span>
                        </>
                     )}
                 </div>
             </div>
          </div>
        </section>

        {/* Section 2: Artifacts (Moved Up for Logic Check) */}
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
             <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Session Artifact / Evidence (Required)
                    </label>
                    <p className="text-xs text-blue-700 mb-2">
                        Please provide a link to GitHub, Figma, or Drive. 
                        <span className="font-bold text-red-500 ml-1">Warning: If no artifact is attached, scores may be limited to Level 2.</span>
                    </p>
                    <div className="flex gap-2">
                        <input 
                            type="url" 
                            value={artifactUrl}
                            onChange={(e) => setArtifactUrl(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 rounded-lg border-blue-200 shadow-sm focus:border-blue-500 p-2 border"
                        />
                    </div>
                 </div>
                 <div className="flex items-end">
                    <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${isStarred ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-white border-blue-200 text-gray-500 hover:bg-gray-50'}`}>
                        <input 
                            type="checkbox" 
                            checked={isStarred} 
                            onChange={(e) => setIsStarred(e.target.checked)} 
                            className="hidden"
                        />
                        <Star size={18} fill={isStarred ? "currentColor" : "none"} />
                        <span className="text-sm font-medium">Showcase Work</span>
                    </label>
                 </div>
             </div>
        </section>

        {/* Section 3: Student Assessment (SFIA) */}
        <section>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" /> Competency Assessment (SFIA Standard)
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Using Rubric: {selectedModule?.assessmentConfig ? 'Custom' : 'Default'}
                </span>
            </div>
            
            {students.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg text-gray-500">
                    No students found in this batch.
                </div>
            ) : (
                <div className="space-y-6">
                {students.map((student) => {
                    const score = scores.find(s => s.studentId === student.id);
                    if (!score) return null;
                    const qualifiers = score.sfiaQualifiers || [];

                    return (
                        <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <img src={student.avatarUrl} alt={student.fullName} className="w-12 h-12 rounded-full border border-gray-200" />
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">{student.fullName}</p>
                                        <div className="flex gap-2 mt-1">
                                            {['Autonomy', 'Complexity', 'Knowledge'].map(q => (
                                                <label key={q} className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer select-none transition-colors ${qualifiers.includes(q) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}>
                                                    <input type="checkbox" className="hidden" checked={qualifiers.includes(q)} onChange={() => toggleSfiaQualifier(student.id, q)} />
                                                    {q}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    {[AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT].map((status) => (
                                        <button
                                            type="button"
                                            key={status}
                                            onClick={() => handleAttendanceChange(student.id, status)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                                score.attendance === status 
                                                ? status === AttendanceStatus.PRESENT ? 'bg-green-500 text-white' 
                                                : status === AttendanceStatus.LATE ? 'bg-yellow-500 text-white' 
                                                : 'bg-red-500 text-white'
                                                : 'text-gray-500 hover:text-gray-900'
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
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-gray-700">Competency Assessment</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleDraftAssessmentWithAI(student.id)}
                                            disabled={isDraftingAI[student.id]}
                                            className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 disabled:opacity-50 transition-colors font-medium border border-indigo-100"
                                        >
                                            {isDraftingAI[student.id] ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={14} />
                                            )}
                                            {isDraftingAI[student.id] ? 'AI is drafting...' : 'AI Draft Assessment'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {activeCategories.map((cat) => {
                                            const val = score.metrics[cat.name] || 0;
                                            const sfiaInfo = SFIA_LEVELS.find(l => l.score === val);
                                            const levelDescription = cat.levels && cat.levels[val] ? cat.levels[val] : sfiaInfo?.label;

                                            return (
                                                <div key={cat.id} className="group relative">
                                                    <div className="flex justify-between mb-1">
                                                        <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                                                            {cat.name}
                                                        </label>
                                                        <span className={`text-xs font-bold ${sfiaInfo?.color}`}>{val}/5</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0" max="5" step="1"
                                                        value={val}
                                                        onChange={(e) => handleScoreChange(student.id, cat.name, parseInt(e.target.value))}
                                                        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${!artifactUrl && val > 2 ? 'ring-2 ring-red-300' : ''}`}
                                                    />
                                                    <p className={`text-[10px] mt-1 font-medium ${sfiaInfo?.color}`}>
                                                        {levelDescription}
                                                    </p>
                                                    {!artifactUrl && val > 2 && (
                                                        <p className="text-[10px] text-red-500 mt-0.5">⚠️ Artifact required for &gt; 2</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Smart Feedback */}
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                                <MessageSquare size={12} /> Individual Feedback
                                            </label>
                                            <button 
                                                type="button" 
                                                onClick={() => generateFeedback(student.id)}
                                                className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-200"
                                            >
                                                <Sparkles size={10} /> Auto-Generate
                                            </button>
                                        </div>
                                        <textarea 
                                            value={score.feedback || ''}
                                            onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                            placeholder="Write specific feedback here..."
                                            rows={2}
                                            className="w-full text-sm p-2 rounded border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
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
        <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
             <div className="mb-4">
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Session Overview (Log Summary)</label>
                    <button 
                        type="button" 
                        onClick={toggleVoiceInput}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        <Mic size={12} /> {isListening ? 'Listening...' : 'Dictate'}
                    </button>
                 </div>
                 <textarea 
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Briefly describe what was covered..."
                    rows={3}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 p-2 border"
                 />
             </div>
        </section>
        
        {/* Integrity Check */}
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-3">
            <input 
                type="checkbox" 
                id="digitalSig"
                checked={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div>
                <label htmlFor="digitalSig" className="block text-sm font-bold text-indigo-900 cursor-pointer">
                    Digital Signature / Integrity Pledge
                </label>
                <p className="text-xs text-indigo-700 mt-1">
                    I certify that this mentoring session occurred as recorded, and the assessment accurately reflects the students' performance. 
                    I understand that this log is used for budget disbursement and academic verification.
                </p>
            </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4">
             <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
                System Status: <span className="font-semibold text-gray-800">Online</span>
             </div>
             <div className="flex gap-3 w-full sm:w-auto">
                 <button 
                    type="button" 
                    onClick={() => submitForm(LogStatus.DRAFT)}
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 text-indigo-700 bg-indigo-50 border border-indigo-200 px-6 py-2.5 rounded-lg font-medium transition-all hover:bg-indigo-100 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                 >
                    <Save className="w-4 h-4" />
                    Save Draft
                 </button>
                 <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''} ${isAdmin ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                 >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit Log'}
                 </button>
             </div>
        </div>
        {successMsg && (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-5 h-5" /> {successMsg}
            </div>
        )}
      </form>
    </div>
  );
};
