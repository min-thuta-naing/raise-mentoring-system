import React, { useState } from 'react';
import { Scale, Plus, ToggleRight, ToggleLeft, Trash2 } from 'lucide-react';
import { Module, AssessmentCategory } from '../../types';

interface AssessmentBuilderProps {
  modules: Module[];
  onUpdateModule: (module: Module) => void;
}

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({ modules, onUpdateModule }) => {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
  const selectedModule = modules.find(m => m.id === selectedModuleId);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatWeight, setNewCatWeight] = useState(0);
  const [newCatLevels, setNewCatLevels] = useState<{ [key: number]: string }>({
    1: '', 2: '', 3: '', 4: '', 5: ''
  });

  const handleAddCategory = () => {
    if (!newCatName || !selectedModule) return;

    const newCat: AssessmentCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName,
      description: newCatDesc,
      weight: newCatWeight,
      isEnabled: true,
      levels: newCatLevels
    };

    const updatedModule = {
      ...selectedModule,
      assessmentConfig: [...(selectedModule.assessmentConfig || []), newCat]
    };
    onUpdateModule(updatedModule);

    setNewCatName('');
    setNewCatDesc('');
    setNewCatWeight(0);
    setNewCatLevels({ 1: '', 2: '', 3: '', 4: '', 5: '' });
  };

  const handleToggleCategory = (catId: string) => {
    if (!selectedModule) return;
    const updatedConfig = selectedModule.assessmentConfig?.map(cat =>
      cat.id === catId ? { ...cat, isEnabled: !cat.isEnabled } : cat
    );
    onUpdateModule({ ...selectedModule, assessmentConfig: updatedConfig });
  };

  const handleDeleteCategory = (catId: string) => {
    if (!selectedModule || !confirm('Are you sure you want to delete this category?')) return;
    const updatedConfig = selectedModule.assessmentConfig?.filter(cat => cat.id !== catId);
    onUpdateModule({ ...selectedModule, assessmentConfig: updatedConfig });
  };

  const handleImportTemplate = (sourceModuleId: string) => {
    if (!selectedModule || !sourceModuleId) return;
    const sourceModule = modules.find(m => m.id === sourceModuleId);
    if (sourceModule && confirm(`Overwrite current rubric with config from ${sourceModule.name}?`)) {
      onUpdateModule({
        ...selectedModule,
        assessmentConfig: sourceModule.assessmentConfig
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Scale size={20} className="text-indigo-600" /> Competency Settings (Rubric)
          </h3>
          <p className="text-sm text-gray-500 mt-1">Customize assessment criteria per module.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-lg border-gray-300 p-2 text-xs border"
            onChange={(e) => handleImportTemplate(e.target.value)}
            value=""
          >
            <option value="" disabled>Import Template...</option>
            {modules.filter(m => m.id !== selectedModuleId).map(m => (
              <option key={m.id} value={m.id}>From: {m.name}</option>
            ))}
          </select>
          <div className="w-64">
            <select
              className="w-full rounded-lg border-gray-300 p-2 text-sm border font-medium"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
            >
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="md:col-span-2 space-y-3">
          {selectedModule?.assessmentConfig?.length === 0 && (
            <div className="p-8 text-center bg-gray-50 rounded-lg text-gray-400 border border-dashed border-gray-200">
              No categories defined. Add one or Import from another module.
            </div>
          )}
          {selectedModule?.assessmentConfig?.map((cat) => (
            <div key={cat.id} className={`p-4 rounded-lg border flex items-center justify-between transition-all ${cat.isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-800">{cat.name}</h4>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-mono">Weight: {cat.weight}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 italic">"Score 5: {cat.description}"</p>
                {cat.levels && Object.values(cat.levels).some(l => l) && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} className="bg-gray-50 p-2 rounded border border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 mb-1">Level {lvl}</div>
                        <div className="text-[10px] text-gray-600 leading-tight">{cat.levels![lvl] || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`p-1.5 rounded-md transition-colors ${cat.isEnabled ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                  title="Toggle Enable/Disable"
                >
                  {cat.isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Form */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-fit">
          <h4 className="font-bold text-gray-700 mb-4 text-sm">Add New Category</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
              <input
                type="text"
                className="w-full rounded border-gray-300 p-2 text-sm"
                placeholder="e.g. Technical Skill"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Score 5 Description</label>
              <textarea
                rows={2}
                className="w-full rounded border-gray-300 p-2 text-sm"
                placeholder="Behavior at excellence level..."
                value={newCatDesc}
                onChange={e => setNewCatDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Weight (%)</label>
              <input
                type="number"
                className="w-full rounded border-gray-300 p-2 text-sm"
                placeholder="0-100"
                value={newCatWeight}
                onChange={e => setNewCatWeight(Number(e.target.value))}
              />
            </div>
            <div className="pt-2 border-t border-gray-200">
              <label className="block text-xs font-bold text-gray-700 mb-2">Detailed Scoring Levels (Optional)</label>
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} className="mb-2">
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Level {level}</label>
                  <input
                    type="text"
                    className="w-full rounded border-gray-300 p-1.5 text-xs"
                    placeholder={`Description for score ${level}...`}
                    value={newCatLevels[level]}
                    onChange={e => setNewCatLevels({ ...newCatLevels, [level]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAddCategory}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 mt-2 flex justify-center items-center gap-2"
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
