import React, { useState } from 'react';
import { Users, Plus, Edit, XCircle, CheckCircle, Trash2 } from 'lucide-react';
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
      alert("Please fill in group name and select a module.");
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" /> Student Groups & Mentor Matching
          </h3>
          <p className="text-sm text-gray-500 mt-1">Assign students to groups and match them with mentors for a module.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
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
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs border border-indigo-100">
                      {mod?.name}
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
                        className="text-gray-500 hover:text-indigo-600 p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Edit Group"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id, g.name)}
                        className="text-gray-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto flex flex-col">
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
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
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
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  >
                    <option value="" disabled className="text-gray-500">Select Module</option>
                    {modules.map(m => <option key={m.id} value={m.id} className="text-gray-900">{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-64">
                  <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">Assign Mentors</div>
                  <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
                    {availableMentors.map(m => (
                      <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selectedMentorIds.includes(m.id)} onChange={e => e.target.checked ? setSelectedMentorIds([...selectedMentorIds, m.id]) : setSelectedMentorIds(selectedMentorIds.filter(id => id !== m.id))} className="rounded text-indigo-600" />
                        <span className="text-sm text-gray-800">{m.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-64">
                  <div className="bg-gray-50 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">Assign Students</div>
                  <div className="overflow-y-auto p-2 space-y-1 bg-white flex-1">
                    {availableStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={e => e.target.checked ? setSelectedStudentIds([...selectedStudentIds, s.id]) : setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id))} className="rounded text-green-600" />
                        <span className="text-sm text-gray-800">{s.fullName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"><CheckCircle size={16} /> Save Group</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && groupToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationName('');
                }} 
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border border-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={deleteConfirmationName !== groupToDelete.name}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all shadow-lg ${
                  deleteConfirmationName === groupToDelete.name 
                    ? 'bg-red-600 text-white shadow-red-200 hover:bg-red-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
