import React, { useState, useMemo } from 'react';
import { Users, MessageCircle, Shield, Hash, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useData } from '../../services/DataContext';
import { Role } from '../../types';
import { GroupChatDrawer } from '../mentor/GroupChatDrawer';

export const MyGroupView: React.FC = () => {
    const { currentUser, groups, users, modules, unreadCounts } = useData();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedChatGroup, setSelectedChatGroup] = useState<any>(null);

    // 1. Find the groups this student belongs to
    const myGroups = useMemo(() => {
        if (!currentUser) return [];
        return groups.filter(g => g.studentIds.includes(currentUser.id));
    }, [groups, currentUser]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    if (myGroups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200 animate-fade-in shadow-2xl shadow-indigo-900/5">
                <div className="p-8 bg-gray-50 rounded-full mb-6">
                    <Layers size={48} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Group Found</h3>
                <p className="text-sm text-gray-500 mt-2">You haven't been assigned to a mentoring group yet.</p>
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
                    friends: users.filter(u => u.role === Role.STUDENT && group.studentIds.includes(u.id) && u.id !== currentUser?.id),
                    mentors: users.filter(u => u.role === Role.MENTOR && group.mentorIds.includes(u.id))
                };

                return (
                    <div key={group.id} className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-indigo-900/10">
                        {/* Group Header Card */}
                        <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30 flex items-center justify-center text-white shrink-0">
                                    <Hash size={32} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                                            {module?.name || 'Classroom'}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic truncate">
                                        {group.name}
                                    </h1>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                        <Users size={12} /> {group.studentIds.length} Members • {group.mentorIds.length} Mentors
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button 
                                    onClick={() => setSelectedChatGroup(group)}
                                    className="relative flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <MessageCircle size={16} />
                                    GROUP DISCUSSION

                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleGroup(group.id);
                                    }}
                                    className={`p-4 rounded-2xl transition-all border-2 flex items-center justify-center shrink-0 ${
                                        isExpanded 
                                            ? 'bg-gray-900 border-gray-900 text-white shadow-xl' 
                                            : 'bg-white border-gray-100 text-indigo-600 hover:border-indigo-100'
                                    }`}
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        <div className={`transition-all duration-500 ease-in-out border-t border-gray-50 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                            <div className="p-8 bg-gray-50/30 space-y-10">
                                {/* Mentors Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 px-2">
                                        <Shield size={18} className="text-indigo-600" />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Assigned Mentors</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {members.mentors.map(mentor => (
                                            <div key={mentor.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-lg shadow-indigo-900/5 flex items-center gap-4 group hover:border-indigo-200 transition-colors">
                                                <img src={mentor.avatarUrl} className="w-12 h-12 rounded-xl border-2 border-gray-50 shadow-sm object-cover" alt="" />
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-gray-900 uppercase tracking-tight truncate text-sm">{mentor.fullName}</h3>
                                                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.1em] mt-0.5">Expert Guidance</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Peer Group Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 px-2">
                                        <Users size={18} className="text-indigo-600" />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Student Partners</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {members.friends.map(friend => (
                                            <div key={friend.id} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-lg shadow-indigo-900/5 flex items-center gap-4 hover:bg-indigo-50/50 transition-all group">
                                                <div className="relative">
                                                    <img src={friend.avatarUrl} className="w-12 h-12 rounded-xl border-2 border-white shadow-md object-cover" alt="" />
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-black text-gray-800 uppercase tracking-tight truncate text-sm">{friend.fullName}</h3>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Partner</p>
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
