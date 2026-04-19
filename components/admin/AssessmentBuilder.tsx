import React, { useState, useMemo } from 'react';
import { Scale, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Module, AssessmentCategory, Rubric } from '../../types';
import { SYSTEM_FALLBACK_RUBRIC } from '../../constants';
import { useData } from '../../services/DataContext';

export const AssessmentBuilder: React.FC = () => {
    const { modules, rubrics, updateRubric } = useData();
    const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<AssessmentCategory | null>(null);
    const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});

    // Derived Data
    const selectedModule = useMemo(() => modules.find(m => m.id === selectedModuleId), [modules, selectedModuleId]);
    const currentRubric = useMemo(() => rubrics.find(r => r.moduleId === selectedModuleId), [rubrics, selectedModuleId]);
    
    const categories = currentRubric?.categories || [];
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    const isWeightValid = totalWeight === 100;

    // --- Handlers ---

    const handleDeleteCategory = (catId: string) => {
        toast.warning('Are you sure you want to delete this category?', {
            action: {
                label: 'Delete',
                onClick: async () => {
                    const updated = categories.filter(c => c.id !== catId);
                    try {
                        await updateRubric(selectedModuleId, updated);
                        toast.success('Category deleted successfully');
                    } catch (error) {
                        toast.error('Failed to delete category');
                    }
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
    };

    const handleToggleExpand = (id: string) => {
        setExpandedLevels(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openAddModal = () => {
        setEditingCat(null);
        setIsModalOpen(true);
    };

    const openEditModal = (cat: AssessmentCategory) => {
        setEditingCat(cat);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header / Module Selector */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase italic tracking-tight">
                        <Scale className="text-indigo-600 w-5 h-5" /> Module Configuration
                    </h3>
                    <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
                        Current Scope: <span className="text-indigo-600 font-black italic">"{selectedModule?.name || 'No Module Selected'}"</span>
                    </p>
                </div>
                
                <div className="w-full md:w-auto min-w-[320px]">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                            Select Module to Configure:
                        </label>
                        <div className="relative group">
                            <select 
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleId(e.target.value)}
                                className="w-full pl-5 pr-12 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none shadow-xl shadow-slate-200/50 transition-all cursor-pointer hover:border-indigo-300"
                            >
                                <option value="" disabled>--- Choose a Module ---</option>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none p-1.5 bg-slate-50 rounded-lg border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                                <ChevronDown className="text-slate-400 w-4 h-4 group-hover:text-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
                {!currentRubric && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-6">
                        <div className="flex gap-3">
                            <AlertCircle className="text-amber-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm italic">Falling back to System Default</h4>
                                <p className="text-xs text-amber-700 mt-1">
                                    No custom rubric defined for "{selectedModule?.name}". The system will use the default SFIA standards.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories List */}
                <div className="space-y-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{cat.name}</h4>
                                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100">
                                            {cat.weight}% WEIGHT
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-2xl font-medium">
                                        {cat.description}
                                    </p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEditModal(cat)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit Category"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Category"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Level Descriptions (Collapsible) */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => handleToggleExpand(cat.id)}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                                >
                                    {expandedLevels[cat.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    {expandedLevels[cat.id] ? 'Hide' : 'Show'} Level Details
                                </button>
                                
                                {expandedLevels[cat.id] && cat.levels && (
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                                        {[1, 2, 3, 4, 5].map(lvl => (
                                            <div key={lvl} className={`p-3 rounded-lg border flex flex-col gap-1.5 ${lvl === 5 ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Level {lvl}</div>
                                                <p className="text-[10px] text-slate-600 leading-snug font-medium italic">
                                                    {cat.levels![lvl] || 'No description set.'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add Button */}
                    <button 
                        onClick={openAddModal}
                        className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all group"
                    >
                        <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-100 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">Add New Category</span>
                    </button>
                </div>

                {/* Validation Footer */}
                <div className={`mt-8 p-4 rounded-xl flex items-center justify-between ${isWeightValid ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        {isWeightValid ? (
                            <CheckCircle2 className="text-emerald-500" />
                        ) : (
                            <AlertCircle className="text-red-500" />
                        )}
                        <div>
                            <p className={`text-sm font-bold ${isWeightValid ? 'text-emerald-900' : 'text-red-900'}`}>
                                Total Weight: {totalWeight}%
                            </p>
                            <p className={`text-xs ${isWeightValid ? 'text-emerald-700' : 'text-red-700'}`}>
                                {isWeightValid ? 'Rubric is balanced and active.' : 'Weight must equal exactly 100% to be valid.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Modal */}
            {isModalOpen && (
                <RubricModal 
                    onClose={() => setIsModalOpen(false)}
                    onSave={async (newCat) => {
                        const updated = editingCat 
                            ? categories.map(c => c.id === editingCat.id ? newCat : c)
                            : [...categories, newCat];
                        await updateRubric(selectedModuleId, updated);
                        setIsModalOpen(false);
                    }}
                    initialData={editingCat}
                    existingCategories={categories}
                />
            )}
        </div>
    );
};

// --- Modal Component ---

interface RubricModalProps {
    onClose: () => void;
    onSave: (cat: AssessmentCategory) => void;
    initialData: AssessmentCategory | null;
    existingCategories: AssessmentCategory[];
}

const RubricModal: React.FC<RubricModalProps> = ({ onClose, onSave, initialData, existingCategories }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [weight, setWeight] = useState(initialData?.weight || 0);
    const [levels, setLevels] = useState<Record<number, string>>(
        initialData?.levels || { 1: '', 2: '', 3: '', 4: '', 5: '' }
    );

    // Filter out the category we are currently editing from the calculation
    const otherCats = existingCategories.filter(c => c.id !== initialData?.id);
    const otherWeightTotal = otherCats.reduce((sum, c) => sum + c.weight, 0);
    const futureTotal = otherWeightTotal + weight;
    const isWeightOverflow = futureTotal > 100;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialData?.id || `cat-${Date.now()}`,
            name,
            description,
            weight,
            isEnabled: true,
            levels
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                            {initialData ? 'Edit Metric' : 'Add New Metric'}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Configuration Panel</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <form id="rubric-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Primary Information */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <Scale size={14} /> Basic Information
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Metric Title</label>
                                        <input 
                                            required
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Code Stability"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-tighter">Metric Description (Score 5 criteria)</label>
                                        <textarea 
                                            required
                                            rows={2}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="What does professional excellence look like?"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Weight Analysis */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                    <Scale size={14} /> Weight Balancing
                                </h4>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-tighter">Current Weight: <span className="text-indigo-600">{weight}%</span></label>
                                        <input 
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={weight}
                                            onChange={e => setWeight(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2 mt-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Current Rubric Metrics:</p>
                                        {otherCats.map(c => (
                                            <div key={c.id} className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500">{c.name}</span>
                                                <span className="font-bold text-slate-700">{c.weight}%</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                                            <span className="font-bold text-slate-400">Total Calculation:</span>
                                            <span className={`font-black ${isWeightOverflow ? 'text-red-600' : futureTotal === 100 ? 'text-emerald-600' : 'text-slate-900'}`}>{futureTotal}% / 100%</span>
                                        </div>
                                    </div>
                                </div>
                                {isWeightOverflow && (
                                    <div className="flex gap-2 p-3 bg-red-50 rounded-lg border border-red-100 italic">
                                        <AlertCircle className="text-red-500 shrink-0 w-4 h-4" />
                                        <p className="text-[10px] text-red-700 leading-tight">Weight overflow! Total cannot exceed 100%.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Level Definitions */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <Scale size={14} /> Level Definitions (Optional)
                            </h4>
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                {[1, 2, 3, 4, 5].map(lvl => (
                                    <div key={lvl}>
                                        <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Level {lvl}</label>
                                        <input 
                                            value={levels[lvl]}
                                            onChange={e => setLevels({ ...levels, [lvl]: e.target.value })}
                                            placeholder={`Outcome for score ${lvl}`}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        form="rubric-form"
                        disabled={isWeightOverflow}
                        className={`px-8 py-2.5 text-sm font-black text-white uppercase tracking-widest rounded-xl shadow-lg transition-all ${isWeightOverflow ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'}`}
                    >
                        {initialData ? 'Update Metric' : 'Add Metric'}
                    </button>
                </div>
            </div>
        </div>
    );
};
