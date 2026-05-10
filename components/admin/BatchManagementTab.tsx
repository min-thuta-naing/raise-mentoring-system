import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Plus, Layers, CheckCircle2, XCircle, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { Batch } from '../../types';

interface BatchManagementTabProps {
  batches: Batch[];
  onAddBatch: (b: Batch) => Promise<void>;
  onUpdateBatch: (b: Batch) => Promise<void>;
}

export const BatchManagementTab: React.FC<BatchManagementTabProps> = ({ batches, onAddBatch, onUpdateBatch }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'CLOSED'
  });

  const handleEditOpen = (batch: Batch) => {
    setEditingBatch(batch);
    setEditFormData({
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('End date must be later than the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newBatch: Batch = {
        id: `b-${Date.now()}`,
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'ACTIVE'
      };

      await onAddBatch(newBatch);
      setFormData({ 
        name: '', 
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]
      });
      toast.success('Batch created successfully!');
    } catch (error) {
      console.error('Failed to create batch:', error);
      toast.error('Failed to create batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    if (new Date(editFormData.endDate) <= new Date(editFormData.startDate)) {
      toast.error('End date must be later than the start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedBatch: Batch = {
        ...editingBatch,
        name: editFormData.name,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        status: editFormData.status
      };

      await onUpdateBatch(updatedBatch);
      setEditingBatch(null);
      toast.success('Batch updated successfully!');
    } catch (error) {
      console.error('Failed to update batch:', error);
      toast.error('Failed to update batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in px-1">
      {/* Creation Form */}
      <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-[#454040]/10 rounded-[1.5rem]">
            <Plus className="w-6 h-6 text-[#454040]" />
          </div>
          Create New Batch
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700">Batch Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Batch X"
                className="w-full rounded-[1.5rem] border-gray-200 p-3 border focus:ring-4 focus:ring-[#454040]/10 focus:border-[#454040] outline-none transition-all bg-slate-50 focus:bg-white"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Start Date</label>
              <input
                required
                type="date"
                className="w-full rounded-[1.5rem] border-gray-200 p-3 border focus:ring-4 focus:ring-[#454040]/10 focus:border-[#454040] outline-none transition-all appearance-none bg-slate-50 focus:bg-white"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">End Date</label>
              <input
                required
                type="date"
                min={formData.startDate}
                className="w-full rounded-[1.5rem] border-gray-200 p-3 border focus:ring-4 focus:ring-[#454040]/10 focus:border-[#454040] outline-none transition-all appearance-none bg-slate-50 focus:bg-white"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-12 py-3 bg-[#454040] text-white rounded-[1.5rem] font-black shadow-lg shadow-[#454040]/20 hover:bg-[#353030] transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Register Batch'}
            </button>
          </div>
        </form>
      </div>

      {/* Batch List */}
      <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-[1.5rem]">
            <Layers className="w-6 h-6 text-slate-600" />
          </div>
          Existing Batches
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(batch => (
            <div key={batch.id} className="p-6 rounded-[1.5rem] border border-gray-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group relative">
              <button 
                onClick={() => handleEditOpen(batch)}
                className="absolute top-4 right-4 p-2 bg-white rounded-[1.5rem] text-slate-400 hover:text-[#454040] hover:shadow-sm transition-all border border-transparent hover:border-[#454040]/10"
              >
                <Pencil size={14} />
              </button>

              <div className="flex justify-between items-start mb-4 pr-8">
                <h4 className="font-bold text-lg text-gray-800 group-hover:text-#454040 transition-colors">{batch.name}</h4>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${batch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {batch.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {batch.status}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Start: {new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>End: {new Date(batch.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal - Rendered via Portal */}
      {editingBatch && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0a0a0f]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="bg-white w-full max-w-2xl rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-[1.5rem] text-#454040">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Edit Batch</h3>
                  <p className="text-sm text-slate-500">Modify cohort details and scheduling</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingBatch(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                type="button"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700">Batch Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-[1.5rem] border-slate-200 p-3 border focus:ring-4 focus:ring-#454040/10 focus:border-#454040 outline-none transition-all"
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Start Date</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-[1.5rem] border-slate-200 p-3 border focus:ring-4 focus:ring-#454040/10 focus:border-#454040 outline-none transition-all"
                    value={editFormData.startDate}
                    onChange={e => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">End Date</label>
                  <input
                    required
                    type="date"
                    min={editFormData.startDate}
                    className="w-full rounded-[1.5rem] border-slate-200 p-3 border focus:ring-4 focus:ring-#454040/10 focus:border-#454040 outline-none transition-all"
                    value={editFormData.endDate}
                    onChange={e => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700">Status</label>
                  <select
                    className="w-full rounded-[1.5rem] border-slate-200 p-3 border focus:ring-4 focus:ring-#454040/10 focus:border-#454040 outline-none transition-all"
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value as 'ACTIVE' | 'CLOSED' })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="flex-1 px-8 py-3 bg-slate-100 text-slate-600 rounded-[1.5rem] font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-3 bg-#454040 text-white rounded-[1.5rem] font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-#454040/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
