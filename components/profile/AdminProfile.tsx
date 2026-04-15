import React, { useState } from 'react';
import { useData } from '../../services/DataContext';
import { LogStatus } from '../../types';
import { User, Mail, Shield, CheckCircle, Box, Users, Camera, Save, X } from 'lucide-react';

export const AdminProfile: React.FC = () => {
    const { currentUser, logs, modules, users, updateProfile } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(currentUser?.fullName || '');
    const [newAvatar, setNewAvatar] = useState(currentUser?.avatarUrl || '');
    const [isSaving, setIsSaving] = useState(false);

    if (!currentUser) return null;

    // --- Statistics Calculation ---
    // Total verifications (where actor was this admin)
    const totalVerifications = logs.reduce((acc, log) => {
        const adminActions = log.history.filter(h => h.actorId === currentUser.id && (h.action.includes('Approved') || h.action.includes('Rejected'))).length;
        return acc + adminActions;
    }, 0);

    const activeModules = modules.length;
    const totalSystemUsers = users.length;

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
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header / Hero */}
            <div className="relative">
                <div className="h-32 bg-gradient-to-r from-rose-600 to-orange-600 rounded-3xl opacity-20 blur-2xl absolute inset-0 -z-10"></div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <img 
                            src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=random`} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-3xl border-4 border-rose-500/30 object-cover shadow-2xl transition-transform group-hover:scale-105"
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                             <h1 className="text-3xl font-bold text-white tracking-tight">{currentUser.fullName}</h1>
                             <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">Administrator</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400">
                                <Mail size={16} />
                                <span className="text-sm">{currentUser.email}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400">
                                <Shield size={16} />
                                <span className="text-sm">System Access Level: Root</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isEditing ? <><X size={18} /> Cancel</> : <><User size={18} /> Edit Profile</>}
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle size={48} className="text-rose-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Verifications Processed</p>
                    <h3 className="text-3xl font-bold text-white">{totalVerifications}</h3>
                    <p className="text-[10px] text-slate-500 mt-4 font-bold tracking-tight">Audit Trail Volume</p>
                </div>

                <div className="bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Box size={48} className="text-orange-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Active Modules</p>
                    <h3 className="text-3xl font-bold text-white">{activeModules}</h3>
                    <p className="text-[10px] text-slate-500 mt-4 font-bold tracking-tight">Curriculum Management</p>
                </div>

                <div className="bg-[#0f172a] border border-white/10 p-6 rounded-3xl shadow-lg relative overflow-hidden group text-rose-500/80">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={48} className="text-rose-400" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total System Users</p>
                    <h3 className="text-3xl font-bold text-white">{totalSystemUsers}</h3>
                    <p className="text-[10px] text-slate-500 mt-4 font-bold tracking-tight">Platform Scale</p>
                </div>
            </div>

            {/* Edit Panel */}
            {isEditing && (
                <div className="bg-white/5 border border-white/20 rounded-3xl p-8 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">Personal Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                            <input 
                                type="text" 
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full bg-[#050510] border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Avatar URL</label>
                            <input 
                                type="url" 
                                value={newAvatar}
                                onChange={(e) => setNewAvatar(e.target.value)}
                                className="w-full bg-[#050510] border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-rose-600/20 transition-all flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                        >
                            {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
