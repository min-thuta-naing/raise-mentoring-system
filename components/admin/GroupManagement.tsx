import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Edit, XCircle, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Group, Module, User, Role } from '../../types';

interface GroupManagementProps {
  groups: Group[];
  modules: Module[];
  users: User[];
  onSave: (group: Group) => void;
  onDelete: (id: string) => void;
}

export const GroupManagement: React.FC<GroupManagementProps> = ({ groups, modules, users, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const openModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setName(group.name);
      setModuleId(group.moduleId);
      setSelectedMentorIds(group.mentorIds);
      setSelectedStudentIds(group.studentIds);
    } else {
      setEditingGroup(null);
      setName('');
      setModuleId(modules[0]?.id || '');
      setSelectedMentorIds([]);
      setSelectedStudentIds([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !moduleId) {
      toast.error("Please fill in group name and select a module.");
      return;
    }
    const group: Group = {
      id: editingGroup ? editingGroup.id : `g-${Date.now()}`,
      name,
      moduleId,
      mentorIds: selectedMentorIds,
      studentIds: selectedStudentIds
    };
    onSave(group);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    setGroupToDelete({ id, name });
    setDeleteConfirmationName('');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (groupToDelete && deleteConfirmationName === groupToDelete.name) {
      onDelete(groupToDelete.id);
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      setDeleteConfirmationName('');
    }
  };

  const selectedModule = modules.find(m => m.id === moduleId);
  const availableStudents = users.filter(u => u.role === Role.STUDENT && (!selectedModule || u.batchId === selectedModule.batchId));
  const availableMentors = users.filter(u => u.role === Role.MENTOR);

  return (
    <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-100 col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-[#454040]/10 rounded-[1.5rem]">
              <Users size={20} className="text-[#454040]" />
            </div>
            Student Groups & Mentor Matching
          </h3>
          <p className="text-sm text-gray-500 mt-1">Assign students to groups and match them with mentors for a module.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-[#454040] text-white px-6 py-2.5 rounded-[1.5rem] text-sm font-black shadow-lg shadow-[#454040]/20 hover:bg-[#353030] transition-all active:scale-95">
          <Plus size={16} /> Create Group
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="p-3 border-b border-gray-100 rounded-tl-lg">Group Name</th>
              <th className="p-3 border-b border-gray-100">Module</th>
              <th className="p-3 border-b border-gray-100">Mentors</th>
              <th className="p-3 border-b border-gray-100">Students</th>
              <th className="p-3 border-b border-gray-100 rounded-tr-lg text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.map(g => {
              const mod = modules.find(m => m.id === g.moduleId);
              return (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-900">{g.name}</td>
                  <td className="p-3 text-gray-500">
                    <span className={`px-2.5 py-1 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider border ${mod ? 'bg-[#454040]/10 text-[#454040] border-[#454040]/20' : 'bg-gray-100 text-gray-400 border-gray-200 italic'}`}>
                      {mod ? mod.name : (g.moduleId ? `Module Deleted (${g.moduleId.substring(0, 8)}...)` : 'No Module')}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {g.mentorIds.length === 0 && <span className="text-xs text-gray-400">No mentors</span>}
                      {g.mentorIds.map(mid => {
                        const m = users.find(u => u.id === mid);
                        return (
                          <img
                            key={mid}
                            title={m?.fullName}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200"
                            src={m?.avatarUrl}
                            alt={m?.fullName}
                          />
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span className="font-medium">{g.studentIds.length}</span> Students
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openModal(g)}
                          className="text-gray-400 hover:text-[#454040] p-2 hover:bg-[#454040]/10 rounded-[1.5rem] transition-all"
                          title="Edit Group"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id, g.name)}
                          className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-[1.5rem] transition-all"
                          title="Delete Group"
                        >
                          <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-[#0a0a0f]/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[1.5rem] shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingGroup ? 'Edit Student Group' : 'Create New Group'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Group Alpha"
                    className="w-full border-slate-200 rounded-[1.5rem] p-3 text-sm focus:ring-4 focus:ring-[#454040]/10 focus:border-[#454040] text-gray-900 bg-slate-50 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                  <select
                    value={moduleId}
                    onChange={e => {
                      setModuleId(e.target.value);
                      setSelectedStudentIds([]);
                    }}
                    className="w-full border-slate-200 rounded-[1.5rem] p-3 text-sm focus:ring-4 focus:ring-[#454040]/10 focus:border-[#454040] text-gray-900 bg-slate-50 transition-all outline-none"
                  >
                    <option value="" disabled className="text-gray-500">Select Module</option>
                    {modules.map(m => <option key={m.id} value={m.id} className="text-gray-900">{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-[1.5rem] overflow-hidden flex flex-col h-64">
                  <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">Assign Mentors</div>
                  <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
                    {availableMentors.map(m => (
                      <label key={m.id} className="flex items-center gap-3 p-2 rounded-[1.5rem] cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selectedMentorIds.includes(m.id)} onChange={e => e.target.checked ? setSelectedMentorIds([...selectedMentorIds, m.id]) : setSelectedMentorIds(selectedMentorIds.filter(id => id !== m.id))} className="rounded text-[#454040]" />
                        <span className="text-sm text-gray-800">{m.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-[1.5rem] overflow-hidden flex flex-col h-64">
                  <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">Assign Students</div>
                  <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
                    {availableStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-2 rounded-[1.5rem] cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={e => e.target.checked ? setSelectedStudentIds([...selectedStudentIds, s.id]) : setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id))} className="rounded text-green-600" />
                        <span className="text-sm text-gray-800">{s.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-[1.5rem] text-sm">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#454040] text-white rounded-[1.5rem] hover:bg-[#353030] text-sm font-black flex items-center gap-2 shadow-lg shadow-[#454040]/20 transition-all active:scale-95"><CheckCircle size={16} /> Save Group</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && groupToDelete && createPortal(
        <div className="fixed inset-0 bg-[#0a0a0f]/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[1.5rem] shadow-2xl max-w-md w-full p-8 animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Group?</h3>
              <p className="text-gray-500">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{groupToDelete.name}"</span>? 
                This action is permanent and cannot be reversed.
              </p>
              
              <div className="w-full pt-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">
                  Type the group name to confirm
                </label>
                <input 
                  type="text"
                  value={deleteConfirmationName}
                  onChange={(e) => setDeleteConfirmationName(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  placeholder={groupToDelete.name}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[1.5rem] focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationName('');
                }} 
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-[1.5rem] font-semibold hover:bg-gray-200 transition-all border border-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={deleteConfirmationName !== groupToDelete.name}
                className={`flex-1 py-3 px-4 rounded-[1.5rem] font-semibold transition-all shadow-lg ${
                  deleteConfirmationName === groupToDelete.name 
                    ? 'bg-red-600 text-white shadow-red-200 hover:bg-red-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
