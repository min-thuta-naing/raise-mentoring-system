import React, { useState } from 'react';
import { Users, BookOpen, GraduationCap, Briefcase, Shield, X, Edit, Trash2, Plus } from 'lucide-react';
import { Batch, Module, Group, User, Role, MentorType } from '../../types';
import { AssessmentBuilder } from './AssessmentBuilder';
import { GroupManagement } from './GroupManagement';

interface SetupTabProps {
  batches: Batch[];
  modules: Module[];
  groups: Group[];
  users: User[];
  onAddBatch: (b: Batch) => void;
  onAddModule: (m: Module) => void;
  onUpdateModule: (m: Module) => void;
  onDeleteModule: (id: string) => void;
  onAddUser: (u: User) => void;
  onAddGroup: (g: Group) => void;
  onUpdateGroup: (g: Group) => void;
}

export const SetupTab: React.FC<SetupTabProps> = ({
  batches,
  modules,
  groups,
  users,
  onAddBatch,
  onAddModule,
  onUpdateModule,
  onAddUser,
  onAddGroup,
  onUpdateGroup,
  onDeleteModule
}) => {
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  // Forms State (User Registration)
  const [userForm, setUserForm] = useState({
    role: Role.STUDENT,
    fullName: '',
    email: '',
    batchId: '',
    mentorType: MentorType.NONE
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple Duplicate Check (by Email)
    if (users.some(u => u.email === userForm.email)) {
      alert("Error: A user with this email already exists.");
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      role: userForm.role,
      fullName: userForm.fullName,
      email: userForm.email,
      avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
      batchId: userForm.role === Role.STUDENT ? userForm.batchId : undefined,
      mentorType: userForm.role === Role.MENTOR ? userForm.mentorType : undefined
    };
    onAddUser(newUser);

    // Reset
    setUserForm(prev => ({
      ...prev,
      fullName: '',
      email: ''
    }));

    alert(`${userForm.role === Role.MENTOR ? 'Mentor' : 'Student'} added successfully!`);
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newModuleName && selectedBatchId) {
      if (editingModule) {
        onUpdateModule({
          ...editingModule,
          name: newModuleName,
          batchId: selectedBatchId
        });
      } else {
        onAddModule({ 
          id: `m-${Date.now()}`, 
          batchId: selectedBatchId, 
          name: newModuleName, 
          assessmentConfig: [] 
        });
      }
      setIsModuleModalOpen(false);
      setNewModuleName('');
      setEditingModule(null);
    }
  }

  const openModuleModal = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setNewModuleName(module.name);
      setSelectedBatchId(module.batchId);
    } else {
      setEditingModule(null);
      setNewModuleName('');
      setSelectedBatchId(batches[0]?.id || '');
    }
    setIsModuleModalOpen(true);
  };

  const handleDeleteModule = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    onDeleteModule(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Assessment Builder Section */}
      <div className="md:col-span-2">
        <AssessmentBuilder modules={modules} onUpdateModule={onUpdateModule} />
      </div>

      {/* Group Management Section */}
      <div className="md:col-span-2">
        <GroupManagement
          groups={groups}
          modules={modules}
          users={users}
          onSave={(g) => {
            const exists = groups.find(ex => ex.id === g.id);
            if (exists) onUpdateGroup(g);
            else onAddGroup(g);
          }}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" /> Modules
          </h3>
          <button
            onClick={() => openModuleModal()}
            className="flex items-center gap-1 bg-indigo-50 text-[#1A3263] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <Plus size={14} /> Add Module
          </button>
        </div>
        <ul className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 mb-2">
          {modules.map(m => (
            <li key={m.id} className="p-3 bg-gray-50 rounded-lg text-sm flex justify-between items-center group hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100">
              <span className="font-medium text-gray-700">{m.name}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openModuleModal(m)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteModule(m.id, m.name)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
          {modules.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-xs italic">
              No modules added yet.
            </div>
          )}
        </ul>
      </div>

      {/* Module Creation/Edit Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-indigo-600" /> {editingModule ? 'Edit Module' : 'New Module'}
              </h3>
              <button 
                onClick={() => {
                  setIsModuleModalOpen(false);
                  setEditingModule(null);
                  setNewModuleName('');
                }} 
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Module Title</label>
                <input
                  required
                  autoFocus
                  type="text"
                  placeholder="e.g. Advanced AI Integration"
                  className="w-full rounded-xl border-gray-200 p-3 border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={newModuleName}
                  onChange={e => setNewModuleName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Batch</label>
                <select
                  required
                  className="w-full rounded-xl border-gray-200 p-3 border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                >
                  <option value="" disabled>Select Batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsModuleModalOpen(false);
                    setEditingModule(null);
                    setNewModuleName('');
                  }}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  {editingModule ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-red-50">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <Trash2 className="text-red-600" size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Module?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-700">"{deleteConfirm.name}"</span>? 
              This action will remove all associated data and cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
                className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Registration with Mentor Type */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> User Registration
        </h3>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setUserForm({ ...userForm, role: Role.STUDENT })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex justify-center items-center gap-2 ${userForm.role === Role.STUDENT ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            <GraduationCap size={16} /> Student
          </button>
          <button
            type="button"
            onClick={() => setUserForm({ ...userForm, role: Role.MENTOR })}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex justify-center items-center gap-2 ${userForm.role === Role.MENTOR ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
          >
            <Briefcase size={16} /> Mentor
          </button>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              className="w-full rounded-lg border-gray-300 p-2 border focus:ring-2 focus:ring-indigo-500"
              value={userForm.fullName}
              onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full rounded-lg border-gray-300 p-2 border focus:ring-2 focus:ring-indigo-500"
              value={userForm.email}
              onChange={e => setUserForm({ ...userForm, email: e.target.value })}
            />
          </div>

          {userForm.role === Role.STUDENT && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batch</label>
              <select
                required
                className="w-full rounded-lg border-gray-300 p-2 border focus:ring-2 focus:ring-indigo-500"
                value={userForm.batchId}
                onChange={e => setUserForm({ ...userForm, batchId: e.target.value })}
              >
                <option value="">Select a Batch...</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mentor Type Selection */}
          {userForm.role === Role.MENTOR && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-3 mt-4">
              <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                <Shield size={14} /> Mentor Classification
              </h4>
              <div>
                <label className="block text-xs text-indigo-500 mb-1 uppercase font-bold">Type</label>
                <select
                  required
                  className="w-full rounded border-gray-300 p-2 border text-sm"
                  value={userForm.mentorType}
                  onChange={e => setUserForm({ ...userForm, mentorType: e.target.value as MentorType })}
                >
                  <option value={MentorType.NONE}>-- Select Type --</option>
                  <option value={MentorType.INTERNAL}>Internal (University Staff)</option>
                  <option value={MentorType.EXTERNAL}>External (Industry Expert)</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-4">
            Register {userForm.role === Role.STUDENT ? 'Student' : 'Mentor'}
          </button>
        </form>
      </div>
    </div>
  );
};
