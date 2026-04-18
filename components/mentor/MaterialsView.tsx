import React from 'react';
import { FolderOpen, Upload, FileText } from 'lucide-react';
import { MentoringLog } from '../../types';

interface MaterialsViewProps {
    myLogs: MentoringLog[];
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ myLogs }) => (
    <div className="animate-fade-in space-y-8 pb-20">
        <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xl shadow-indigo-600/20">
                <FolderOpen size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Teaching Materials</h2>
        </div>

        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-100 text-center shadow-xl shadow-gray-900/5 group hover:border-indigo-200 transition-all">
             <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-300 group-hover:scale-110 transition-transform">
                 <Upload size={40} />
             </div>
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">My Material Library</h3>
             <p className="text-sm font-medium text-gray-500 mt-2 mb-8 max-w-sm mx-auto">Upload slides, PDFs, or link external resources for your classes here for quick access during sessions.</p>
             <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 transition-all active:scale-95">
                 Upload New File
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
                        className="block bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-gray-900/5 hover:border-indigo-300 hover:shadow-indigo-900/10 hover:-translate-y-1.5 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                             <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                <FileText className="text-gray-400 group-hover:text-indigo-600" />
                             </div>
                             <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-tighter">{l.date}</span>
                        </div>
                        <p className="text-sm font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight mb-1">{l.summaryNote || 'Record of session data'}</p>
                        <p className="text-[10px] font-bold text-gray-400 truncate opacity-60 group-hover:opacity-100 transition-opacity lowercase">{l.artifactUrl}</p>
                    </a>
                ))}
                {myLogs.filter(l => l.artifactUrl).length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-3xl border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No artifacts found in your recent logs</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);
