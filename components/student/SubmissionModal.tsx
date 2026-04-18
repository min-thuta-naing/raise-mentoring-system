import React from 'react';
import { XCircle, Trophy, Send } from 'lucide-react';
import { LogStatus, MentoringLog, Module, User } from '../../types';

interface SubmissionModalProps {
    selectedLog: MentoringLog;
    currentUser: User;
    modules: Module[];
    artifactUrl: string;
    setArtifactUrl: (url: string) => void;
    reflection: string;
    setReflection: (text: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
    selectedLog,
    currentUser,
    modules,
    artifactUrl,
    setArtifactUrl,
    reflection,
    setReflection,
    onSubmit,
    onClose
}) => {
    const module = modules.find(m => m.id === selectedLog.moduleId);
    const myScore = selectedLog.scores.find(s => s.studentId === currentUser.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedLog.status === LogStatus.DRAFT ? 'Submit Your Work' : 'Session Feedback'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">{selectedLog.date} • {module?.name}</p>

                {/* Mentor's Feedback Section (Only show if APPROVED) */}
                {selectedLog.status === LogStatus.APPROVED && (
                    <div className="bg-indigo-50 rounded-xl p-5 mb-6 border border-indigo-100">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <Trophy size={18} /> Mentor's Assessment
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {Object.entries(myScore?.metrics || {}).map(([key, val]) => (
                                <div key={key} className="bg-white p-2 rounded border border-indigo-50 flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-600">{key}</span>
                                    <span className="text-sm font-bold text-indigo-700">{val as number}/5</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-indigo-100">
                            <p className="text-sm text-gray-700 italic">
                                "{myScore?.feedback || 'No specific feedback provided.'}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Student Submission Form */}
                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            Submit Your Work (Artifact URL)
                            {module?.expectedArtifactType && (
                                <span className="ml-2 text-xs font-normal bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                                    Expected: {module.expectedArtifactType}
                                </span>
                            )}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Provide a link to your code, document, or project related to this session.</p>
                        <input 
                            type="url" 
                            required
                            placeholder={
                                module?.expectedArtifactType === 'GITHUB' ? "https://github.com/..." :
                                module?.expectedArtifactType === 'FIGMA' ? "https://figma.com/..." :
                                "https://..."
                            }
                            className="w-full rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={artifactUrl}
                            onChange={e => setArtifactUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Self Reflection</label>
                        <p className="text-xs text-gray-500 mb-2">What did you learn? What was challenging? How will you improve?</p>
                        <textarea 
                            required
                            rows={4}
                            placeholder="I learned how to..." 
                            className="w-full rounded-lg border-gray-300 p-3 border focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={reflection}
                            onChange={e => setReflection(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold flex items-center gap-2">
                            <Send size={16} /> {selectedLog.status === LogStatus.DRAFT ? 'Submit Work' : 'Acknowledge & Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
