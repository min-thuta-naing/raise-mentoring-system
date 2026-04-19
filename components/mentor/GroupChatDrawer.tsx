import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageCircle, Clock, Hash, Shield, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../../services/DataContext';
import { Message, Group, Role } from '../../types';

interface GroupChatDrawerProps {
    group: Group;
    onClose: () => void;
}

export const GroupChatDrawer: React.FC<GroupChatDrawerProps> = ({ group, onClose }) => {
    const { currentUser, messages, sendMessage, users, markGroupAsRead } = useData();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter messages for this specific group
    const groupMessages = messages.filter(m => m.groupId === group.id);

    // Auto-scroll to bottom and CLEAR notifications
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        // Clear notifications for this group
        markGroupAsRead(group.id);
    }, [groupMessages.length, group.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(group.id, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Could not send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const formatTimestamp = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
                    {/* Header */}
                    <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Hash size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">{group.name}</h2>
                                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Group Discussion</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Messages List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
                    >
                        {groupMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                <div className="p-6 bg-white rounded-full border border-dashed border-gray-300">
                                    <MessageCircle size={48} className="text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 uppercase tracking-widest text-xs">No messages yet</p>
                                    <p className="text-[10px] font-medium text-gray-500">Start the conversation with your group!</p>
                                </div>
                            </div>
                        ) : (
                            groupMessages.map((msg) => {
                                const isSelf = msg.senderId === currentUser?.id;
                                // Fallback role lookup for legacy messages
                                const senderRole = msg.senderRole || users.find(u => u.id === msg.senderId)?.role || Role.STUDENT;
                                const isMentor = senderRole === Role.MENTOR;

                                return (
                                    <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex max-w-[85%] gap-3 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar with Role Badge - Bulletproof Positioning */}
                                            <div className="relative w-12 h-12 shrink-0">
                                                <img 
                                                    src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}`} 
                                                    className={`w-full h-full rounded-2xl object-cover shadow-sm border-2 ${
                                                        isMentor ? 'border-amber-400' : 'border-indigo-400'
                                                    }`} 
                                                    alt="" 
                                                />
                                                <div 
                                                    style={{ position: 'absolute', bottom: '-6px', right: '-6px' }}
                                                    className={`w-7 h-7 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center z-20 ${
                                                        isMentor ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'
                                                    }`}
                                                >
                                                    {isMentor ? <Shield size={14} strokeWidth={3} /> : <GraduationCap size={14} strokeWidth={3} />}
                                                </div>
                                            </div>
                                            
                                            <div className={`space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                                                <div className={`flex items-center gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                        {msg.senderName}
                                                    </span>
                                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-[0.2em] border ${
                                                        isMentor 
                                                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                                                            : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                                    }`}>
                                                        {isMentor ? 'Mentor' : 'Student'}
                                                    </span>
                                                </div>
                                                <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                                                    isSelf 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest px-1">
                                                    {formatTimestamp(msg.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message your group..."
                                className="flex-1 bg-gray-100 border-none rounded-2xl p-4 pr-14 text-sm font-bold placeholder:text-gray-400 focus:ring-2 ring-indigo-500/20 transition-all"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                                    newMessage.trim() && !isSending
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 active:scale-95'
                                        : 'bg-gray-200 text-gray-400'
                                }`}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                        <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-4">
                            Real-time Messaging Active
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
