import React, { useMemo } from 'react';
import { CheckCircle, Clock, FileText, Play, Calendar } from 'lucide-react';
import { useData } from '../services/DataContext';
import { LogStatus, PlanStatus } from '../types';

export const CurriculumRoadmap: React.FC = () => {
  const { modules, lessonPlans, logs, currentUser } = useData();

  const roadmapData = useMemo(() => {
    if (!currentUser?.batchId) return [];

    // 1. Get modules for this student's batch
    const studentModules = modules
      .filter(m => m.batchId === currentUser.batchId)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    // 2. Map activities and determine status
    return studentModules.map((module, index) => {
      const modulePlans = lessonPlans.filter(p => p.moduleId === module.id && p.status === PlanStatus.PUBLISHED);
      const moduleLogs = logs.filter(l => l.moduleId === module.id && l.status === LogStatus.APPROVED);
      
      // Derive status:
      // - Completed: If there are approved logs and it's not the latest module with logs
      // - Current: The latest module that has at least one log, or the first one if none started
      // - Upcoming: Modules after the current one
      
      let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
      
      const hasLogs = moduleLogs.length > 0;
      const nextModuleHasLogs = studentModules[index + 1] 
        ? logs.some(l => l.moduleId === studentModules[index + 1].id && l.status === LogStatus.APPROVED)
        : false;

      if (hasLogs && nextModuleHasLogs) {
        status = 'completed';
      } else if (hasLogs || (index === 0 && !logs.some(l => l.status === LogStatus.APPROVED))) {
        status = 'current';
      } else {
        // If previous module was current or completed, and this one has no logs, it might be upcoming
        const prevModule = studentModules[index - 1];
        if (prevModule) {
          const prevHasLogs = logs.some(l => l.moduleId === prevModule.id && l.status === LogStatus.APPROVED);
          if (prevHasLogs && !hasLogs) status = 'current'; // First one without logs after one with logs
        }
      }

      // Final refinement: only one 'current'
      return {
        id: module.id,
        title: `${module.name}`,
        weeks: `Module ${index + 1}`, // Simplified for dynamic data
        hours: `${modulePlans.length} Sessions Planned`,
        activities: modulePlans.map(p => p.topic),
        outputs: module.expectedArtifactType ? [module.expectedArtifactType] : ['Project Output'],
        status
      };
    });
  }, [modules, lessonPlans, logs, currentUser]);

  // Ensure only the earliest available 'upcoming' module after a 'completed' one is 'current'
  // and only one is 'current'.
  const dynamicRoadmap = useMemo(() => {
    let foundCurrent = false;
    return roadmapData.map((m, i) => {
        if (m.status === 'current') {
            if (foundCurrent) return { ...m, status: 'upcoming' as const };
            foundCurrent = true;
            return m;
        }
        return m;
    });
  }, [roadmapData]);

  if (dynamicRoadmap.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500">No curriculum data available for your batch yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Curriculum Roadmap</h2>
        <p className="text-gray-500 mb-8">Overview of your learning journey and expected milestones.</p>
        
        <div className="relative border-l-2 border-indigo-100 ml-4 space-y-10">
          {dynamicRoadmap.map((module) => (
            <div key={module.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center
                ${module.status === 'completed' ? 'bg-green-500' : 
                  module.status === 'current' ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                {module.status === 'completed' && <CheckCircle size={12} className="text-white" />}
                {module.status === 'current' && <Play size={10} className="text-white ml-0.5" />}
              </div>

              <div className={`bg-white rounded-xl p-6 border shadow-sm transition-all
                ${module.status === 'current' ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'}
              `}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-lg font-bold ${module.status === 'current' ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {module.title}
                      </h3>
                      {module.status === 'current' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                          Current Phase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {module.weeks}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {module.hours}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Play size={14} className="text-indigo-500" /> Key Activities
                    </h4>
                    <ul className="space-y-2">
                      {module.activities.length > 0 ? module.activities.map((act, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                          {act}
                        </li>
                      )) : (
                        <li className="text-xs text-gray-400 italic">No published lesson plans yet.</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-indigo-50/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-indigo-500" /> Outputs / Artifacts
                    </h4>
                    <ul className="space-y-2">
                      {module.outputs.map((out, i) => (
                        <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                          <CheckCircle size={14} className="mt-0.5 shrink-0 text-indigo-400" />
                          {out}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
