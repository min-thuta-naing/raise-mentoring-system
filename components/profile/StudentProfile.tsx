import React, { useState } from 'react';
import { useData } from '../../services/DataContext';
import { LogStatus, AttendanceStatus } from '../../types';
import { User, Mail, GraduationCap, Award, CheckCircle, Clock, Camera, Save, X, Pencil, ImageIcon } from 'lucide-react';
import { PRESET_COVERS, DEFAULT_COVER, PRESET_AVATARS, DEFAULT_AVATAR } from '../../constants';

export const StudentProfile: React.FC = () => {
    const { currentUser, logs, updateProfile } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(currentUser?.fullName || '');
    const [newAvatar, setNewAvatar] = useState(currentUser?.avatarUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSelectingCover, setIsSelectingCover] = useState(false);
    const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);

    if (!currentUser) return null;

    // --- Statistics Calculation ---
    const studentLogs = logs.filter(log => 
        log.scores.some(s => s.studentId === currentUser.id)
    );

    const attendedLogs = studentLogs.filter(log => 
        log.scores.find(s => s.studentId === currentUser.id)?.attendance !== AttendanceStatus.ABSENT
    );

    const approvedLogs = studentLogs.filter(log => log.status === LogStatus.APPROVED);
    
    // Average Score calculation
    const allMetrics = studentLogs.flatMap(log => {
        const myScore = log.scores.find(s => s.studentId === currentUser.id);
        if (!myScore || myScore.attendance === AttendanceStatus.ABSENT) return [];
        return Object.values(myScore.metrics);
    });
    
    const avgScore = allMetrics.length > 0 
        ? (allMetrics.reduce((a, b) => a + b, 0) / allMetrics.length).toFixed(1) 
        : '0.0';

    const pendingReflections = studentLogs.filter(log => {
        const myScore = log.scores.find(s => s.studentId === currentUser.id);
        return log.status === LogStatus.DRAFT && (!myScore?.studentReflection || !myScore?.studentArtifactUrl);
    }).length;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile(newName, newAvatar);
            setIsEditing(false);
        } catch (error) {
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            {/* Header / Hero */}
            <div className="relative group/cover -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-20">
                {/* Cover Photo */}
                <div className="h-64 md:h-96 rounded-b-[3rem] overflow-hidden relative border-b border-white/10 shadow-2xl">
                    <img 
                        src={currentUser.coverPhotoUrl || DEFAULT_COVER} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent opacity-60"></div>
                    
                    {/* Pencil Button for Cover Selection */}
                    <button 
                        onClick={() => setIsSelectingCover(true)}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/20 transition-all opacity-0 group-hover/cover:opacity-100 active:scale-95"
                        title="Change Cover Photo"
                    >
                        <Pencil size={18} />
                    </button>
                </div>

                <div className="bg-black/40 border border-white/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center gap-8 -mt-24 mx-8 md:mx-auto max-w-4xl relative z-10 transition-all hover:bg-black/50">
                    <div className="relative group">
                        <img 
                            src={currentUser.avatarUrl || DEFAULT_AVATAR} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover shadow-2xl transition-transform group-hover:scale-105"
                        />
                        <button 
                            onClick={() => setIsSelectingAvatar(true)}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none outline-none"
                            title="Change Profile Picture"
                        >
                            <Camera className="text-white" size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                             {isEditing ? (
                                 <input 
                                     type="text" 
                                     value={newName}
                                     onChange={(e) => setNewName(e.target.value)}
                                     className="bg-white/10 border border-white/20 rounded-xl px-4 py-1 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#B8CFCE]/50 w-full md:w-auto"
                                     autoFocus
                                 />
                             ) : (
                                 <h1 className="text-3xl font-bold text-white tracking-tight">{currentUser.fullName}</h1>
                             )}
                             <span className="bg-[#B8CFCE]/10 text-[#B8CFCE] border border-[#B8CFCE]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">Student</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-100 font-medium">
                                <Mail size={16} />
                                <span className="text-sm">{currentUser.email}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-100 font-medium">
                                <GraduationCap size={16} />
                                <span className="text-sm">Batch: {currentUser.batchId || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {isEditing && (
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`bg-[#B8CFCE] hover:bg-[#AAB2C8] text-[#131010] px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#B8CFCE]/20 transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Name'}
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                if (isEditing) {
                                    setNewName(currentUser.fullName); // Reset on cancel
                                }
                                setIsEditing(!isEditing);
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isEditing ? <><X size={18} /> Cancel</> : <><User size={18} /> Edit Profile</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics & Settings Container */}
            <div className="px-4 md:px-0 space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle size={48} className="text-[#B8CFCE]" />
                        </div>
                        <p className="text-[#AAB2C8] text-xs font-bold uppercase tracking-widest mb-1">Sessions Attended</p>
                        <h3 className="text-3xl font-bold text-white">{attendedLogs.length}</h3>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[#B8CFCE] bg-[#B8CFCE]/10 border border-[#B8CFCE]/20 px-2 py-0.5 rounded-full w-fit">
                            {approvedLogs.length} Verified
                        </div>
                    </div>

                    <div className="bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Award size={48} className="text-orange-400" />
                        </div>
                        <p className="text-[#AAB2C8] text-xs font-bold uppercase tracking-widest mb-1">Avg Score</p>
                        <h3 className="text-3xl font-bold text-white">{avgScore}</h3>
                        <p className="text-[10px] text-[#AAB2C8] mt-4 font-bold tracking-tight">Latest Performance Metrics</p>
                    </div>

                    <div className="bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden group text-[#B8CFCE]/80">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock size={48} className="text-[#B8CFCE]" />
                        </div>
                        <p className="text-[#AAB2C8] text-xs font-bold uppercase tracking-widest mb-1">Pending Tasks</p>
                        <h3 className="text-3xl font-bold text-white">{pendingReflections}</h3>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full w-fit">
                            Action Required
                        </div>
                    </div>
                </div>

                {/* Edit Panel */}
                {isEditing && (
                    <div className="bg-white/5 border border-white/20 rounded-3xl p-8 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-xl font-bold text-white mb-6">Personal Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-[#AAB2C8] uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input 
                                    type="text" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B8CFCE]/50 focus:border-transparent transition-all"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-[#AAB2C8] uppercase tracking-widest mb-2 ml-1">Avatar URL</label>
                                <input 
                                    type="url" 
                                    value={newAvatar}
                                    onChange={(e) => setNewAvatar(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B8CFCE]/50 focus:border-transparent transition-all"
                                    placeholder="Enter image URL"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`bg-[#B8CFCE] hover:bg-[#AAB2C8] text-[#131010] px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-[#B8CFCE]/20 transition-all flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cover Selection Modal */}
            {isSelectingCover && (
                <div className="fixed inset-0 bg-[#131010]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#131010] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <ImageIcon className="text-[#B8CFCE]" size={24} />
                                Select Cover Photo
                            </h3>
                            <button onClick={() => setIsSelectingCover(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Default / Placeholder Option */}
                                <button 
                                    onClick={async () => {
                                        try {
                                            await updateProfile(undefined, undefined, '');
                                            setIsSelectingCover(false);
                                        } catch (error) {
                                            alert("Failed to reset cover photo.");
                                        }
                                    }}
                                     className="relative group rounded-2xl overflow-hidden aspect-video border-2 border-dashed border-white/20 hover:border-[#B8CFCE] transition-all flex flex-col items-center justify-center bg-white/5 active:scale-95"
                                >
                                    <img src={DEFAULT_COVER} alt="Default Placeholder" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="bg-black/40 backdrop-blur-sm p-3 rounded-full mb-2 group-hover:scale-110 transition-transform border border-white/10">
                                            <X size={20} className="text-white" />
                                        </div>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">Default</span>
                                    </div>
                                    {(!currentUser.coverPhotoUrl || currentUser.coverPhotoUrl === '') && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#B8CFCE]/10">
                                            <div className="bg-[#B8CFCE] text-[#131010] p-2.5 rounded-full shadow-2xl scale-125">
                                                <CheckCircle size={32} />
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {PRESET_COVERS.map((url, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={async () => {
                                            try {
                                                await updateProfile(undefined, undefined, url);
                                                setIsSelectingCover(false);
                                            } catch (error) {
                                                alert("Failed to update cover photo.");
                                            }
                                        }}
                                        className="relative group rounded-2xl overflow-hidden aspect-video border-2 border-transparent hover:border-[#B8CFCE] transition-all active:scale-95"
                                    >
                                        <img src={url} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        {currentUser.coverPhotoUrl === url && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#B8CFCE]/20">
                                                <div className="bg-[#B8CFCE] text-[#131010] p-2.5 rounded-full shadow-2xl scale-125">
                                                    <CheckCircle size={32} />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/5 flex justify-end">
                            <button 
                                onClick={() => setIsSelectingCover(false)}
                                className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Avatar Selection Modal */}
            {isSelectingAvatar && (
                <div className="fixed inset-0 bg-[#131010]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#131010] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <User className="text-[#B8CFCE]" size={24} />
                                Select Profile Picture
                            </h3>
                            <button onClick={() => setIsSelectingAvatar(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Default Avatar Option */}
                                <button 
                                    onClick={async () => {
                                        try {
                                            await updateProfile(undefined, '');
                                            setIsSelectingAvatar(false);
                                        } catch (error) {
                                            alert("Failed to reset avatar.");
                                        }
                                    }}
                                     className="relative group rounded-full overflow-hidden aspect-square border-2 border-dashed border-white/20 hover:border-[#B8CFCE] transition-all flex flex-col items-center justify-center bg-white/5 active:scale-95"
                                >
                                    <img src={DEFAULT_AVATAR} alt="Default" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <X size={20} className="text-white drop-shadow-lg" />
                                    </div>
                                    {(!currentUser.avatarUrl || currentUser.avatarUrl === '') && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#B8CFCE]/10">
                                            <div className="bg-[#B8CFCE] text-[#131010] p-2 rounded-full shadow-2xl scale-110">
                                                <CheckCircle size={28} />
                                            </div>
                                        </div>
                                    )}
                                </button>

                                {PRESET_AVATARS.map((url, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={async () => {
                                            try {
                                                await updateProfile(undefined, url);
                                                setIsSelectingAvatar(false);
                                            } catch (error) {
                                                alert("Failed to update avatar.");
                                            }
                                        }}
                                         className="relative group rounded-full overflow-hidden aspect-square border-2 border-transparent hover:border-[#B8CFCE] transition-all active:scale-95"
                                    >
                                        <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        {currentUser.avatarUrl === url && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#B8CFCE]/20">
                                                <div className="bg-[#B8CFCE] text-[#131010] p-2 rounded-full shadow-2xl scale-110">
                                                    <CheckCircle size={28} />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/5 flex justify-end">
                            <button 
                                onClick={() => setIsSelectingAvatar(false)}
                                className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
