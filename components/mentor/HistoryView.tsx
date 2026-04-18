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
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xl shadow-indigo-600/20">
                        <History size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Log History</h2>
                </div>
                
                <div className="flex bg-white p-1.5 rounded-2xl shadow-xl shadow-indigo-900/5 border border-gray-100 ring-1 ring-gray-900/5">
                    {['ALL', LogStatus.PENDING, LogStatus.APPROVED, LogStatus.REJECTED].map((filter) => (
                        <button 
                            key={filter}
                            onClick={() => setHistoryFilter(filter as any)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                historyFilter === filter 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {filter === 'ALL' ? 'All' : 
                             filter === LogStatus.PENDING ? 'Pending' : 
                             filter === LogStatus.APPROVED ? 'Verified' : 'Rejected'}
                        </button>
                    ))}
                </div>
             </div>

             <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-gray-100 overflow-hidden ring-1 ring-gray-900/5">
                 {filteredLogs.length === 0 ? (
                     <div className="p-24 text-center">
                         <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
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
                                    <tr key={log.id} className="hover:bg-indigo-50/30 group transition-all">
                                        <td className="p-6">
                                            <div className="font-black text-gray-900 uppercase tracking-tight">{log.date}</div>
                                            <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mt-1 uppercase">
                                                <Clock size={12} className="opacity-60" /> {log.startTime} - {log.endTime}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                                {modules.find(m => m.id === log.moduleId)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="p-6 font-black text-gray-900 tabular-nums">{log.durationMinutes}<span className="text-[10px] text-gray-400 ml-1 font-bold uppercase">min</span></td>
                                        <td className="p-6">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ring-4 ring-offset-0 ${
                                                    log.status === LogStatus.APPROVED ? 'bg-green-50 text-green-700 border-green-200 ring-green-50/50' : 
                                                    log.status === LogStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-50/50' : 
                                                    log.status === LogStatus.DRAFT ? 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-50/50' : 'bg-red-50 text-red-700 border-red-200 ring-red-50/50'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            {(log.status !== LogStatus.APPROVED) && (
                                                <button 
                                                    onClick={() => onEditLog(log)} 
                                                    className="inline-flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] transition-all border border-indigo-100 shadow-xl shadow-indigo-900/5 active:scale-95 whitespace-nowrap"
                                                >
                                                    <Edit3 size={14} />
                                                    Edit Entry
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
