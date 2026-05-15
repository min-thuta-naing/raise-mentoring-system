import React, { useMemo } from 'react';
import { Calendar, FolderOpen, Clock, AlertOctagon, CheckCircle, PlayCircle } from 'lucide-react';
import { LessonPlan, Module, MentoringLog, PlanStatus, ActivityType } from '../../types';

interface ScheduleViewProps {
    lessonPlans: LessonPlan[];
    currentUser: { id: string };
    myLogs: MentoringLog[];
    modules: Module[];
    today: string;
    onStartLog: (plan: LessonPlan) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
    lessonPlans, currentUser, myLogs, modules, today, onStartLog
}) => {
    const sortedPlans = useMemo(() => {
        return lessonPlans
            .filter(p => p.mentorId === currentUser.id && p.status === PlanStatus.PUBLISHED)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [lessonPlans, currentUser.id]);

    const groupedPlans = useMemo(() => {
        const groups: Record<string, LessonPlan[]> = {};
        sortedPlans.forEach(plan => {
            if (!groups[plan.moduleId]) groups[plan.moduleId] = [];
            groups[plan.moduleId].push(plan);
        });
        return groups;
    }, [sortedPlans]);

    const moduleOrder = useMemo(() => {
        return Object.keys(groupedPlans).sort((a, b) => {
            const dateA = new Date(groupedPlans[a][0].date).getTime();
            const dateB = new Date(groupedPlans[b][0].date).getTime();
            return dateA - dateB;
        });
    }, [groupedPlans]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
             <h2 className="text-2xl font-black text-[#454040] flex items-center gap-4 mb-10 tracking-tighter">
                {/* <div className="p-3 bg-[#454040] rounded-[1.5rem] text-white shadow-xl shadow-[#454040]/10">
                    <Calendar size={28} />
                </div> */}
                My Schedule
             </h2>
             
             {moduleOrder.length === 0 ? (
                 <div className="p-20 text-center bg-white rounded-[1.5rem] border border-dashed border-gray-100 text-gray-400">
                     <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                         <Calendar size={44} className="text-gray-200" />
                     </div>
                     <p className="font-black text-[#454040] uppercase tracking-widest">No published classes scheduled.</p>
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-3 opacity-50">Draft plans from admin are not visible here.</p>
                 </div>
             ) : (
                 <div className="space-y-12">
                     {moduleOrder.map(moduleId => {
                         const mod = modules.find(m => m.id === moduleId);
                         const plans = groupedPlans[moduleId];
                         
                         return (
                             <div key={moduleId} className="relative">
                                 {/* Module Header */}
                                    <div className="flex items-center gap-4 mb-10 sticky top-0 bg-[#EDE9E6] backdrop-blur-xl py-6 z-10">
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-[1.5rem] border border-gray-100 shadow-xl shadow-[#454040]/5">
                                                <div className="p-2 bg-[#454040]/5 rounded-xl">
                                                    <FolderOpen size={18} className="text-[#454040]" />
                                                </div>
                                                <span className="text-sm font-black text-[#454040] uppercase tracking-[0.2em]">{mod?.name || 'Unknown Module'}</span>
                                                <span className="bg-[#454040] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-[#454040]/20 tracking-widest">{plans.length} SESSIONS</span>
                                            </div>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>

                                 <div className="grid gap-6">
                                     {plans.map(plan => {
                                         const isPast = plan.date < today;
                                         const isLogged = myLogs.some(l => l.date === plan.date && l.startTime === plan.startTime);
                                         
                                         return (
                                             <div key={plan.id} className={`group bg-white p-5 rounded-[1.5rem] border transition-all hover:shadow-2xl hover:-translate-y-1.5 flex flex-col md:flex-row md:items-center justify-between gap-6 ${isPast && !isLogged ? 'border-red-100 bg-red-50/20' : 'border-gray-100 shadow-sm'}`}>
                                                 <div className="flex gap-6 items-start">
                                                     <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[75px] shadow-lg ${isPast && !isLogged ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#454040] text-white shadow-[#454040]/20'}`}>
                                                         <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{new Date(plan.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                         <span className="text-xl font-black tabular-nums leading-none mt-2">{new Date(plan.date).getDate()}</span>
                                                     </div>
                                                     <div>
                                                         <div className="flex items-center gap-4 text-[9px] mb-2 font-black uppercase tracking-[0.25em]">
                                                             <span className="text-[#454040]/50">{plan.date}</span>
                                                             <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                             <span className="text-gray-300 flex items-center gap-2 font-bold"><Clock size={12} className="opacity-60" /> {plan.startTime} - {plan.endTime}</span>
                                                             {isPast && !isLogged && (
                                                                <span className="flex items-center gap-2 text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse ring-1 ring-red-200">
                                                                    <AlertOctagon size={10} /> OVERDUE
                                                                </span>
                                                             )}
                                                         </div>
                                                         <h3 className="font-black text-lg text-[#454040] group-hover:translate-x-1 transition-transform uppercase tracking-tighter leading-tight">{plan.topic}</h3>
                                                         <div className="flex items-center gap-3 mt-3">
                                                             <span className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${plan.activityType === ActivityType.LECTURE ? 'bg-[#454040]/5 text-[#454040] border-[#454040]/10' : 'bg-emerald-50/50 text-emerald-600 border-emerald-100'}`}>
                                                                 {plan.activityType}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-4">
                                                     {!isLogged && (
                                                         <button 
                                                             onClick={() => onStartLog(plan)}
                                                             className="w-full md:w-auto bg-[#454040] text-white px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.25em] hover:bg-[#353030] shadow-xl shadow-[#454040]/10 transition-all active:scale-95 flex items-center justify-center gap-4 group/btn border border-white/10"
                                                         >
                                                             <div className="p-1 bg-white/10 rounded-lg group-hover/btn:bg-white/20 transition-colors">
                                                                <PlayCircle size={18} />
                                                             </div>
                                                             Log Session
                                                         </button>
                                                     )}
                                                     {isLogged && (
                                                         <div className="flex items-center gap-4 text-emerald-600 font-black text-[9px] uppercase tracking-[0.25em] bg-emerald-50 px-6 py-3 rounded-[1.5rem] border border-emerald-100 shadow-lg shadow-emerald-900/5">
                                                             <div className="p-1 bg-emerald-100 rounded-lg">
                                                                <CheckCircle size={16} />
                                                             </div>
                                                             Completed
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
        </div>
    );
};
