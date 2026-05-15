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
                    <div className="p-5 bg-[#454040] text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-[1.2rem] backdrop-blur-sm">
                                <Hash size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter uppercase italic">{group.name}</h2>
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-0.5">Group Chat</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/30"
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
                                        <div className={`flex max-w-[85%] gap-4 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar with Role Badge */}
                                            <div className="relative w-10 h-10 shrink-0">
                                                <img 
                                                    src={msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}`} 
                                                    className={`w-full h-full rounded-xl object-cover shadow-sm border-2 ${
                                                        isMentor ? 'border-amber-400' : 'border-[#454040]/30'
                                                    }`} 
                                                    alt="" 
                                                />
                                                <div 
                                                    style={{ position: 'absolute', bottom: '-4px', right: '-4px' }}
                                                    className={`w-6 h-6 rounded-full border-[2px] border-white shadow-xl flex items-center justify-center z-20 ${
                                                        isMentor ? 'bg-amber-500 text-white' : 'bg-[#454040] text-white'
                                                    }`}
                                                >
                                                    {isMentor ? <Shield size={10} strokeWidth={3} /> : <GraduationCap size={10} strokeWidth={3} />}
                                                </div>
                                            </div>
                                            
                                            <div className={`space-y-1.5 ${isSelf ? 'items-end' : 'items-start'}`}>
                                                <div className={`flex items-center gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                        {msg.senderName}
                                                    </span>
                                                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.2em] border ${
                                                        isMentor 
                                                            ? 'bg-amber-50 border-amber-200 text-amber-600' 
                                                            : 'bg-gray-50 border-gray-200 text-[#454040]'
                                                    }`}>
                                                        {isMentor ? 'Mentor' : 'Student'}
                                                    </span>
                                                </div>
                                                <div className={`p-3.5 rounded-[1.5rem] shadow-sm text-[13px] font-bold leading-relaxed ${
                                                    isSelf 
                                                        ? 'bg-[#454040] text-white rounded-tr-none shadow-lg shadow-[#454040]/10' 
                                                        : 'bg-white text-gray-800 border border-gray-50 rounded-tl-none'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest px-2">
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
                    <div className="p-5 bg-white border-t border-gray-100">
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message your group..."
                                className="flex-1 bg-gray-50 border-none rounded-[1.2rem] p-4 pr-14 text-xs font-bold placeholder:text-gray-300 focus:ring-4 ring-[#454040]/5 transition-all outline-none"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className={`absolute right-2 p-2.5 rounded-xl transition-all ${
                                    newMessage.trim() && !isSending
                                        ? 'bg-[#454040] text-white shadow-lg shadow-[#454040]/10 active:scale-95'
                                        : 'bg-gray-100 text-gray-200'
                                }`}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <p className="text-center text-[8px] font-black text-gray-200 uppercase tracking-[0.2em] mt-3">
                            Real-time Messaging Active
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
