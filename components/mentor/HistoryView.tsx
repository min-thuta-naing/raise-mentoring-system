import React, { useMemo } from 'react';
import { History, Clock, Edit3 } from 'lucide-react';
import { MentoringLog, Module, LogStatus } from '../../types';

interface HistoryViewProps {
    myLogs: MentoringLog[];
    historyFilter: 'ALL' | LogStatus;
    setHistoryFilter: (filter: 'ALL' | LogStatus) => void;
    modules: Module[];
    onEditLog: (log: MentoringLog) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
    myLogs, historyFilter, setHistoryFilter, modules, onEditLog
}) => {
    const filteredLogs = useMemo(() => {
        if (historyFilter === 'ALL') return myLogs;
        return myLogs.filter(l => l.status === historyFilter);
    }, [myLogs, historyFilter]);

    return (
        <div className="animate-fade-in space-y-6 pb-20">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    {/* <div className="p-3 bg-[#454040] rounded-[1.5rem] text-white shadow-xl shadow-[#454040]/10">
                        <History size={28} />
                    </div> */}
                    <h2 className="text-2xl font-black text-[#454040] tracking-tighter">Log History</h2>
                </div>
                
                <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100">
                    {['ALL', LogStatus.PENDING, LogStatus.APPROVED, LogStatus.REJECTED].map((filter) => (
                        <button 
                            key={filter}
                            onClick={() => setHistoryFilter(filter as any)}
                            className={`px-8 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                historyFilter === filter 
                                    ? 'bg-[#454040] text-white shadow-lg shadow-[#454040]/20' 
                                    : 'text-gray-400 hover:text-[#454040] hover:bg-white'
                            }`}
                        >
                            {filter === 'ALL' ? 'Everything' : 
                             filter === LogStatus.PENDING ? 'Reviewing' : 
                             filter === LogStatus.APPROVED ? 'Verified' : 'Rejected'}
                        </button>
                    ))}
                </div>
             </div>

             <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                 {filteredLogs.length === 0 ? (
                     <div className="p-24 text-center">
                         <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
                             <History size={32} className="text-gray-200" />
                         </div>
                         <p className="font-bold text-gray-500">No logs found.</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-4 py-1 bg-gray-100 rounded-full inline-block">
                             Filter: {historyFilter === 'ALL' ? 'Everything' : historyFilter}
                         </p>
                     </div>
                 ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="p-6">Date & Time</th>
                                    <th className="p-6">Module</th>
                                    <th className="p-6">Duration</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Action</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-100">
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 group transition-all">
                                        <td className="p-5">
                                            <div className="font-black text-[#454040] uppercase tracking-tighter text-sm">{log.date}</div>
                                            <div className="text-[9px] font-bold text-gray-300 flex items-center gap-2 mt-1.5 uppercase tracking-widest">
                                                <Clock size={12} className="opacity-60" /> {log.startTime} - {log.endTime}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-[#454040]/5 text-[#454040] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border border-[#454040]/5">
                                                {modules.find(m => m.id === log.moduleId)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="p-5 font-black text-[#454040] tabular-nums text-base">{log.durationMinutes}<span className="text-[9px] text-gray-300 ml-1.5 font-black uppercase tracking-widest">min</span></td>
                                        <td className="p-5">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                                    log.status === LogStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    log.status === LogStatus.PENDING ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                                    log.status === LogStatus.DRAFT ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {log.status === LogStatus.APPROVED ? 'VERIFIED' : log.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            {(log.status !== LogStatus.APPROVED) && (
                                                <button 
                                                    onClick={() => onEditLog(log)} 
                                                    className="inline-flex items-center gap-2 bg-white text-[#454040] hover:bg-[#454040] hover:text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.15em] transition-all border border-gray-100 shadow-sm active:scale-95"
                                                >
                                                    <Edit3 size={14} />
                                                    Edit Log
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
             </div>
        </div>
    );
};
