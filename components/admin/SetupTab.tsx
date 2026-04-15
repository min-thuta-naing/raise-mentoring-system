import React, { useState } from 'react';
import { Users, GraduationCap, Briefcase, Shield } from 'lucide-react';
import { Batch, Module, Group, User, Role, MentorType } from '../../types';
import { AssessmentBuilder } from './AssessmentBuilder';
import { GroupManagement } from './GroupManagement';

interface SetupTabProps {
  batches: Batch[];
  modules: Module[];
  groups: Group[];
  users: User[];
  onAddBatch: (b: Batch) => void;
  onUpdateModule: (m: Module) => void;
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
  onUpdateModule,
  onAddUser,
  onAddGroup,
  onUpdateGroup
}) => {


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
