import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../services/DataContext';
import { AttendanceStatus, CompetencyScore, LogStatus, MentoringLog, Role } from '../../types';
import { 
    Clock, Users, Save, Link as LinkIcon, Star, Sparkles, MessageSquare, 
    Loader2, Send, ArrowLeft, Mic, CheckCircle, AlertTriangle, Shield 
} from 'lucide-react';
import { draftAssessmentWithAI } from '../../services/aiService';
import { SYSTEM_FALLBACK_RUBRIC } from '../../constants';

// SFIA Level Definitions (Synchronized with Form)
const SFIA_LEVELS = [
    { score: 0, level: 'N/A', label: 'Not Observed / No Output', color: 'text-gray-400' },
    { score: 1, level: 'Level 1', label: 'Follow - Needs close supervision, performs routine tasks.', color: 'text-red-500' },
    { score: 2, level: 'Level 2', label: 'Assist - Understands concepts but needs constant guidance/AI.', color: 'text-orange-500' },
    { score: 3, level: 'Level 2', label: 'Assist - Follows steps correctly, effective with help.', color: 'text-yellow-600' },
    { score: 4, level: 'Level 3', label: 'Apply - Completes tasks independently, uses AI efficiently.', color: 'text-blue-500' },
    { score: 5, level: 'Level 3', label: 'Apply - Exceeds expectations, solves complex problems autonomously.', color: 'text-green-600' }
];

interface MentorLogEditProps {
    onSuccess: () => void;
}

export const MentorLogEdit: React.FC<MentorLogEditProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const { logId } = useParams<{ logId: string }>();
    const { logs, batches, getModulesByBatch, currentUser, getStudentsByBatch, addLog, users, rubrics } = useData();

    // Find the log in our global data context
    const log = logs.find(l => l.id === logId);

    // Form State (Initialized from the log data)
    const [selectedBatchId, setSelectedBatchId] = useState(log?.batchId || '');
    const [selectedModuleId, setSelectedModuleId] = useState(log?.moduleId || '');
    const [selectedMentorId, setSelectedMentorId] = useState(log?.mentorId || '');
    const [date, setDate] = useState(log?.date || '');
    const [startTime, setStartTime] = useState(log?.startTime || '');
    const [endTime, setEndTime] = useState(log?.endTime || '');
    const [summary, setSummary] = useState(log?.summaryNote || '');
    const [artifactUrl, setArtifactUrl] = useState(log?.artifactUrl || '');
    const [scores, setScores] = useState<CompetencyScore[]>(log?.scores || []);
    const [isStarred, setIsStarred] = useState(log?.isStarred || false);
    const [digitalSignature, setDigitalSignature] = useState(log?.digitalSignature || false);
    
    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isDraftingAI, setIsDraftingAI] = useState<Record<string, boolean>>({});

    const isAdmin = currentUser?.role === Role.ADMIN;
    const mentors = users.filter(u => u.role === Role.MENTOR);
    const students = getStudentsByBatch(selectedBatchId);
    const modules = getModulesByBatch(selectedBatchId);
    const selectedModule = modules.find(m => m.id === selectedModuleId);

    // Sync state if log was initially undefined (loading state)
    useEffect(() => {
        if (log && !selectedBatchId) {
            setSelectedBatchId(log.batchId);
            setSelectedModuleId(log.moduleId);
            setSelectedMentorId(log.mentorId);
            setDate(log.date);
            setStartTime(log.startTime);
            setEndTime(log.endTime);
            setSummary(log.summaryNote);
            setArtifactUrl(log.artifactUrl);
            setScores(log.scores);
            setIsStarred(log.isStarred || false);
            setDigitalSignature(log.digitalSignature || false);
        }
    }, [log, selectedBatchId]);

    // AI & Logic Handlers (Copied from MentorLogForm)
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
        setIsDraftingAI(prev => ({ ...prev, [studentId]: true }));
        try {
            const result = await draftAssessmentWithAI(artifact, reflection, activeCategories || []);
            setScores(prev => prev.map(s => {
                if (s.studentId !== studentId) return s;
                const newMetrics = { ...s.metrics };
                Object.keys(result.scores).forEach(categoryName => {
                    newMetrics[categoryName] = result.scores[categoryName];
                });
                return { ...s, metrics: newMetrics, feedback: result.feedback };
            }));
        } catch (error) {
            console.error("AI Drafting error:", error);
            alert("Failed to draft AI assessment.");
        } finally {
            setIsDraftingAI(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleScoreChange = (studentId: string, categoryName: string, value: number) => {
        setScores(prev => prev.map(s => {
            if (s.studentId !== studentId) return s;
            return { ...s, metrics: { ...s.metrics, [categoryName]: value } };
        }));
    };

    const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
        setScores(prev => prev.map(s => s.studentId === studentId ? { ...s, attendance: status } : s));
    };

    const toggleSfiaQualifier = (studentId: string, qualifier: string) => {
        setScores(prev => prev.map(s => {
            if (s.studentId !== studentId) return s;
            const current = s.sfiaQualifiers || [];
            const updated = current.includes(qualifier) ? current.filter(q => q !== qualifier) : [...current, qualifier];
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
        const comment = `Demonstrated ${level} competency. Student showed steady progress.`;
        handleFeedbackChange(studentId, comment);
    };

    const calculateDuration = () => {
        if (!startTime || !endTime) return 0;
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
    };

    const submitForm = async (targetStatus: LogStatus) => {
        if (!logId) return;
        if (targetStatus === LogStatus.PENDING && !artifactUrl) {
            alert("Artifact link required for submission.");
            return;
        }
        if (targetStatus === LogStatus.PENDING && !digitalSignature) {
            alert("Digital signature required.");
            return;
        }

        setIsSubmitting(true);
        const updatedLog: MentoringLog = {
            ...log!,
            id: logId,
            batchId: selectedBatchId,
            moduleId: selectedModuleId,
            mentorId: selectedMentorId || log?.mentorId || '',
            date,
            startTime,
            endTime,
            durationMinutes: calculateDuration(),
            summaryNote: summary,
            artifactUrl,
            scores,
            isStarred,
            digitalSignature,
            status: targetStatus,
        };

        try {
            await addLog(updatedLog, isAdmin ? selectedMentorId : undefined);
            setSuccessMsg("Changes saved successfully!");
            setTimeout(() => {
                onSuccess();
                navigate('/mentor/logs');
            }, 1000);
        } catch (error) {
            console.error("Failed to update log:", error);
            alert("Failed to save changes.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!log) {
        return (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl mx-auto">
                <Loader2 className="w-12 h-12 text-indigo-200 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Finding history log...</p>
                <button onClick={() => navigate('/mentor/logs')} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">
                    Back to History
                </button>
            </div>
        );
    }

    const duration = calculateDuration();
    const customRubric = rubrics.find(r => r.moduleId === selectedModuleId);
    const activeCategories = customRubric?.categories?.filter(c => c.isEnabled) || SYSTEM_FALLBACK_RUBRIC;

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-20">
            <div className={`bg-white rounded-[2rem] shadow-2xl overflow-hidden border ${isAdmin ? 'border-indigo-200' : 'border-gray-100'}`}>
                {/* Header */}
                <div className={`p-8 border-b ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-900 border-indigo-100'}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white backdrop-blur-sm">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tighter italic">Edit Session Log</h1>
                                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">
                                    Updating log from {log.date}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                log.status === LogStatus.REJECTED ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'
                            }`}>
                                Previous Status: {log.status}
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); submitForm(LogStatus.PENDING); }} className="p-8 space-y-12">
                    
                    {/* Section 1: Session Scope */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Teaching Module</label>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-gray-900">
                                {modules.find(m => m.id === selectedModuleId)?.name || 'Unknown Module'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Duration (Minutes)</label>
                            <div className={`p-4 rounded-2xl border font-black text-2xl transition-all ${duration >= 50 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                {duration} <span className="text-xs uppercase tracking-widest font-bold opacity-60">min</span>
                            </div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Proof of Work (Artifact)</label>
                           <input 
                                type="url" 
                                value={artifactUrl}
                                onChange={(e) => setArtifactUrl(e.target.value)}
                                className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-indigo-900/5 focus:ring-4 ring-indigo-500/10 transition-all font-bold text-sm"
                                placeholder="https://github.com/..."
                            />
                        </div>
                    </div>

                    {/* Section 2: Student Assessments */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                <Users size={18} />
                            </div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Student Performance Assessments</h2>
                        </div>

                        <div className="space-y-4">
                            {students.map(student => {
                                const score = scores.find(s => s.studentId === student.id);
                                if (!score) return null;
                                const qualifiers = score.sfiaQualifiers || [];

                                return (
                                    <div key={student.id} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-900/5 p-6 hover:border-indigo-100 transition-all group">
                                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                                            {/* Left: Student Info */}
                                            <div className="flex items-start gap-4 flex-1">
                                                <img src={student.avatarUrl} className="w-14 h-14 rounded-2xl border-4 border-gray-50 shadow-lg" alt="" />
                                                <div className="space-y-3 flex-1">
                                                    <div>
                                                        <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{student.fullName}</h3>
                                                        <div className="flex gap-2 mt-2">
                                                            {['Autonomy', 'Complexity', 'Knowledge'].map(q => (
                                                                <button
                                                                    key={q}
                                                                    type="button"
                                                                    onClick={() => toggleSfiaQualifier(student.id, q)}
                                                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                                        qualifiers.includes(q) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-white text-gray-400 border-gray-100'
                                                                    }`}
                                                                >
                                                                    {q}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SFIA Metrics</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleDraftAssessmentWithAI(student.id)}
                                                                disabled={isDraftingAI[student.id]}
                                                                className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-50"
                                                            >
                                                                {isDraftingAI[student.id] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                                {isDraftingAI[student.id] ? 'Drafting...' : 'AI Suggestions'}
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                            {activeCategories.map(cat => {
                                                                const val = score.metrics[cat.name] || 0;
                                                                return (
                                                                    <div key={cat.id}>
                                                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1 shadow-sm">
                                                                            <span className="text-gray-400">{cat.name}</span>
                                                                            <span className="text-indigo-600">{val}/5</span>
                                                                        </div>
                                                                        <input 
                                                                            type="range" min="0" max="5" step="1" 
                                                                            value={val} 
                                                                            onChange={(e) => handleScoreChange(student.id, cat.name, parseInt(e.target.value))}
                                                                            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600 shadow-inner"
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Feedback & Attendance */}
                                            <div className="lg:w-80 space-y-4">
                                                <div className="flex bg-gray-100 rounded-2xl p-1.5 shadow-inner">
                                                    {[AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT].map(status => (
                                                        <button
                                                            key={status} type="button"
                                                            onClick={() => handleAttendanceChange(student.id, status)}
                                                            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                                score.attendance === status ? 'bg-white text-indigo-600 shadow-md ring-1 ring-gray-900/5' : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="relative group/feedback">
                                                    <div className="absolute top-3 left-4 text-[9px] font-black uppercase text-indigo-600 bg-white px-2 py-0.5 rounded-full shadow-sm z-10 border border-indigo-50">
                                                        Feedback
                                                    </div>
                                                    <textarea 
                                                        value={score.feedback || ''}
                                                        onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                                        className="w-full h-32 p-6 pt-10 text-xs font-bold bg-white border border-gray-100 rounded-3xl shadow-xl shadow-indigo-900/5 focus:ring-4 ring-indigo-500/10 transition-all"
                                                        placeholder="Write detailed assessment..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Summary & Signature */}
                    <div className="space-y-8 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                        <div>
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Overall Session Summary</label>
                             <textarea 
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className="w-full h-24 p-6 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-indigo-900/5 font-bold text-xs"
                                placeholder="..."
                            />
                        </div>

                        <div className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border border-indigo-50">
                            <input 
                                type="checkbox" checked={digitalSignature}
                                onChange={(e) => setDigitalSignature(e.target.checked)}
                                className="w-6 h-6 rounded-lg text-indigo-600 border-gray-200 focus:ring-4 ring-indigo-500/10 transition-all cursor-pointer"
                            />
                            <div>
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Update Certification Signature</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mt-1">
                                    I certify these updates are accurate and reflect real student performance.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6">
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button 
                                type="button" 
                                onClick={() => submitForm(LogStatus.DRAFT)}
                                className="flex-1 sm:flex-none px-8 py-4 bg-white text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
                            >
                                Save Draft
                            </button>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button 
                                type="submit" disabled={isSubmitting}
                                className="flex-1 sm:flex-none px-12 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Update Log Entry
                            </button>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 animate-slide-up z-50">
                            <CheckCircle size={18} />
                            {successMsg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
