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
             <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8 uppercase tracking-tighter">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xl">
                    <Calendar size={24} />
                </div>
                My Schedule
             </h2>
             
             {moduleOrder.length === 0 ? (
                 <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
                     <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                         <Calendar size={36} className="text-gray-200" />
                     </div>
                     <p className="font-bold text-gray-500">No published classes scheduled.</p>
                     <p className="text-xs font-bold uppercase tracking-widest mt-2">Draft plans from admin are not visible here.</p>
                 </div>
             ) : (
                 <div className="space-y-12">
                     {moduleOrder.map(moduleId => {
                         const mod = modules.find(m => m.id === moduleId);
                         const plans = groupedPlans[moduleId];
                         
                         return (
                             <div key={moduleId} className="relative">
                                 {/* Module Header */}
                                 <div className="flex items-center gap-4 mb-8 sticky top-0 bg-gray-50/80 backdrop-blur-xl py-4 z-10">
                                     <div className="h-px bg-gray-200 flex-1"></div>
                                     <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-xl shadow-indigo-900/5">
                                         <div className="p-1.5 bg-indigo-50 rounded-lg">
                                            <FolderOpen size={16} className="text-indigo-600" />
                                         </div>
                                         <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">{mod?.name || 'Unknown Module'}</span>
                                         <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg shadow-indigo-600/20">{plans.length} Sessions</span>
                                     </div>
                                     <div className="h-px bg-gray-200 flex-1"></div>
                                 </div>

                                 <div className="grid gap-6">
                                     {plans.map(plan => {
                                         const isPast = plan.date < today;
                                         const isLogged = myLogs.some(l => l.date === plan.date && l.startTime === plan.startTime);
                                         
                                         return (
                                             <div key={plan.id} className={`group bg-white p-6 rounded-3xl border transition-all hover:shadow-2xl hover:-translate-y-1.5 flex flex-col md:flex-row md:items-center justify-between gap-6 ${isPast && !isLogged ? 'border-red-200 bg-red-50/20' : 'border-gray-100 shadow-xl shadow-gray-900/5'}`}>
                                                 <div className="flex gap-6 items-start">
                                                     <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px] shadow-lg ${isPast && !isLogged ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                                                         <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{new Date(plan.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                         <span className="text-2xl font-black tabular-nums leading-none mt-1">{new Date(plan.date).getDate()}</span>
                                                     </div>
                                                     <div>
                                                         <div className="flex items-center gap-3 text-[10px] mb-2 font-black uppercase tracking-widest">
                                                             <span className="text-gray-900">{plan.date}</span>
                                                             <span className="text-gray-200">/</span>
                                                             <span className="text-gray-400 flex items-center gap-1.5"><Clock size={12} className="opacity-70" /> {plan.startTime} - {plan.endTime}</span>
                                                             {isPast && !isLogged && (
                                                                <span className="flex items-center gap-1.5 text-[9px] bg-red-100 text-red-600 px-2.5 py-1 rounded-full animate-pulse ring-1 ring-red-200">
                                                                    <AlertOctagon size={10} /> Overdue
                                                                </span>
                                                             )}
                                                         </div>
                                                         <h3 className="font-black text-xl text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{plan.topic}</h3>
                                                         <div className="flex items-center gap-2 mt-2">
                                                             <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${plan.activityType === ActivityType.LECTURE ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                                 {plan.activityType}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div className="flex items-center gap-4">
                                                     {!isLogged && (
                                                         <button 
                                                             onClick={() => onStartLog(plan)}
                                                             className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                                                         >
                                                             <div className="p-1 bg-white/10 rounded-lg group-hover:bg-white/20">
                                                                <PlayCircle size={20} />
                                                             </div>
                                                             Log Session
                                                         </button>
                                                     )}
                                                     {isLogged && (
                                                         <div className="flex items-center gap-3 text-green-600 font-black text-xs uppercase tracking-widest bg-green-50 px-6 py-3.5 rounded-2xl border border-green-100 shadow-lg shadow-green-900/5">
                                                             <div className="p-1 bg-green-100 rounded-lg">
                                                                <CheckCircle size={18} />
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
