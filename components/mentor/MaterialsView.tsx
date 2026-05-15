import React from 'react';
import { FolderOpen, Upload, FileText } from 'lucide-react';
import { MentoringLog } from '../../types';

interface MaterialsViewProps {
    myLogs: MentoringLog[];
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ myLogs }) => (
    <div className="animate-fade-in space-y-8 pb-20">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[#454040] rounded-[1.2rem] text-white shadow-xl shadow-[#454040]/10">
                <FolderOpen size={20} />
            </div>
            <h2 className="text-xl font-black text-[#454040] uppercase tracking-tighter italic">Teaching Materials</h2>
        </div>

        <div className="bg-white p-10 rounded-[1.5rem] border-2 border-dashed border-gray-100 text-center shadow-sm group hover:border-[#454040]/30 transition-all">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 group-hover:scale-110 group-hover:text-[#454040]/20 transition-all duration-500">
                 <Upload size={32} />
             </div>
             <h3 className="text-lg font-black text-[#454040] uppercase tracking-tighter italic">My Material Library</h3>
             <p className="text-[10px] font-black text-gray-300 mt-2 mb-8 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">Upload slides, PDFs, or link external resources for your classes here.</p>
             <button className="bg-[#454040] text-white px-8 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#353030] shadow-xl shadow-[#454040]/10 transition-all active:scale-95">
                 Upload New Resource
             </button>
        </div>
        
        {/* Auto-extracted from logs */}
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">Recent Artifacts from Logs</h3>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myLogs.filter(l => l.artifactUrl).slice(0, 6).map(l => (
                    <a 
                        key={l.id} 
                        href={l.artifactUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:border-[#454040]/30 hover:shadow-xl hover:shadow-[#454040]/5 hover:-translate-y-2 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-5">
                             <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-[#454040] transition-all duration-500">
                                <FileText size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                             </div>
                             <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{l.date}</span>
                        </div>
                        <p className="text-xs font-black text-[#454040] truncate group-hover:italic transition-all uppercase tracking-tighter mb-1.5">{l.summaryNote || 'Record of session data'}</p>
                        <p className="text-[9px] font-black text-gray-300 truncate opacity-60 group-hover:opacity-100 transition-opacity lowercase italic tracking-tight">{l.artifactUrl}</p>
                    </a>
                ))}
                {myLogs.filter(l => l.artifactUrl).length === 0 && (
                    <div className="col-span-full py-16 text-center bg-gray-50/50 rounded-[1.5rem] border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">No artifacts found in your recent logs</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);
