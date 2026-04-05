import React from 'react';
import { CheckCircle, Clock, FileText, Play, Calendar } from 'lucide-react';

const ROADMAP_DATA = [
  {
    id: 'm1',
    title: 'M1: Foundation & AI-Driven Design',
    weeks: 'Week 1 - 2',
    hours: '12h Theory / 24h Practical',
    activities: ['Introduction to AI Tools', 'Design Thinking Workshop', 'UI/UX Prototyping with Figma'],
    outputs: ['Figma Prototype', 'User Journey Map'],
    status: 'completed'
  },
  {
    id: 'm2',
    title: 'M2: Frontend Development',
    weeks: 'Week 3 - 5',
    hours: '18h Theory / 36h Practical',
    activities: ['React Fundamentals', 'State Management', 'API Integration'],
    outputs: ['Interactive Web App', 'GitHub Repository'],
    status: 'current'
  },
  {
    id: 'm3',
    title: 'M3: Backend & Architecture',
    weeks: 'Week 6 - 8',
    hours: '18h Theory / 36h Practical',
    activities: ['Node.js & Express', 'Database Design (SQL/NoSQL)', 'Authentication & Security'],
    outputs: ['RESTful API', 'Database Schema'],
    status: 'upcoming'
  },
  {
    id: 'm4',
    title: 'M4: AI Integration & Advanced Features',
    weeks: 'Week 9 - 11',
    hours: '18h Theory / 36h Practical',
    activities: ['Prompt Engineering', 'RAG Implementation', 'AI Feature Optimization'],
    outputs: ['AI-Powered Feature', 'Technical Documentation'],
    status: 'upcoming'
  },
  {
    id: 'm5',
    title: 'M5: Final Project & Pitching',
    weeks: 'Week 12 - 14',
    hours: '10h Theory / 40h Practical',
    activities: ['MVP Development', 'Pitch Deck Creation', 'Demo Day Preparation'],
    outputs: ['Final Product (MVP)', 'Pitch Deck'],
    status: 'upcoming'
  }
];

export const CurriculumRoadmap: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Curriculum Roadmap</h2>
        <p className="text-gray-500 mb-8">Overview of the entire curriculum structure from M1 to M5.</p>
        
        <div className="relative border-l-2 border-indigo-100 ml-4 space-y-10">
          {ROADMAP_DATA.map((module, index) => (
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
                      {module.activities.map((act, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
                          {act}
                        </li>
                      ))}
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
