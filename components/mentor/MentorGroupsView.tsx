import React, { useState, useMemo } from 'react';
import { Users, MessageCircle, Shield, Hash, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useData } from '../../services/DataContext';
import { Role } from '../../types';
import { GroupChatDrawer } from './GroupChatDrawer';

export const MentorGroupsView: React.FC = () => {
    const { currentUser, groups, users, modules, unreadCounts } = useData();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedChatGroup, setSelectedChatGroup] = useState<any>(null);

    // 1. Find the groups this mentor belongs to
    const myGroups = useMemo(() => {
        if (!currentUser) return [];
        return groups.filter(g => g.mentorIds.includes(currentUser.id));
    }, [groups, currentUser]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    if (myGroups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[1.5rem] border border-dashed border-gray-200 animate-fade-in">
                <div className="p-8 bg-gray-50 rounded-full mb-6">
                    <Layers size={48} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-[#454040] uppercase tracking-widest">No Group Found</h3>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-2 opacity-50">You haven't been assigned to any mentoring groups yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {myGroups.map((group) => {
                const isExpanded = !!expandedGroups[group.id];
                const module = modules.find(m => m.id === group.moduleId);
                const unreadCount = unreadCounts[group.id] || 0;
                
                // Fetch members for THIS group
                const members = {
                    students: users.filter(u => u.role === Role.STUDENT && group.studentIds.includes(u.id)),
                    mentors: users.filter(u => u.role === Role.MENTOR && group.mentorIds.includes(u.id) && u.id !== currentUser?.id)
                };

                return (
                    <div key={group.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl group/card">
                        {/* Group Header Card */}
                        <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-[#454040] rounded-[1.2rem] shadow-xl shadow-[#454040]/5 flex items-center justify-center text-white shrink-0 group-hover/card:scale-105 transition-transform duration-500">
                                    <Hash size={24} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[9px] font-black bg-[#454040]/5 text-[#454040] px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-[#454040]/5">
                                            {module?.name || 'Classroom'}
                                        </span>
                                    </div>
                                    <h1 className="text-lg font-black text-[#454040] tracking-tight truncate">
                                        {group.name}
                                    </h1>
                                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-3">
                                        <Users size={12} className="text-gray-300" /> {group.studentIds.length} Students <span className="w-1 h-1 bg-gray-100 rounded-full"></span> {group.mentorIds.length} Mentors
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button 
                                    onClick={() => setSelectedChatGroup(group)}
                                    className="relative flex-1 md:flex-none px-6 py-3 bg-[#454040] text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-lg shadow-[#454040]/5 hover:bg-[#353030] transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <MessageCircle size={16} />
                                    Group Discussion
 
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleGroup(group.id);
                                    }}
                                    className={`p-3 rounded-xl transition-all border flex items-center justify-center shrink-0 ${
                                        isExpanded 
                                            ? 'bg-[#454040] border-[#454040] text-white shadow-lg' 
                                            : 'bg-white border-gray-100 text-[#454040] hover:bg-gray-50'
                                    }`}
                                >
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        <div className={`transition-all duration-500 ease-in-out border-t border-gray-50 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                            <div className="p-6 bg-gray-50/20 space-y-8">
                                {/* Mentors Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <Shield size={16} className="text-[#454040]/50" />
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#454040]/60">Co-Mentors</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {members.mentors.length > 0 ? members.mentors.map(mentor => (
                                            <div key={mentor.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:border-[#454040]/20 transition-all">
                                                <img src={mentor.avatarUrl} className="w-12 h-12 rounded-full border-2 border-gray-50 object-cover" alt="" />
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-[#454040] uppercase tracking-tight truncate text-xs">{mentor.fullName}</h3>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">Partner</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest px-2">No co-mentors</p>
                                        )}
                                    </div>
                                </div>
 
                                {/* Student Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <Users size={16} className="text-[#454040]/50" />
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#454040]/60">Mentored Students</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {members.students.map(student => (
                                            <div key={student.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 hover:bg-gray-50/50 transition-all group">
                                                <div className="relative">
                                                    <img src={student.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" alt="" />
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-black text-[#454040] uppercase tracking-tight truncate text-xs">{student.fullName}</h3>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">Student</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Group Chat Drawer */}
            {selectedChatGroup && (
                <GroupChatDrawer 
                    group={selectedChatGroup} 
                    onClose={() => setSelectedChatGroup(null)} 
                />
            )}
        </div>
    );
};
