import React, { useState } from 'react';
import { Users, GraduationCap, Briefcase, Shield } from 'lucide-react';
import { Batch, User, Role, MentorType } from '../../types';

interface UserRegistrationTabProps {
  batches: Batch[];
  users: User[];
  onAddUser: (u: User) => void;
}

export const UserRegistrationTab: React.FC<UserRegistrationTabProps> = ({
  batches,
  users,
  onAddUser
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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* User Registration Card */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          User Registration
        </h3>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => setUserForm({ ...userForm, role: Role.STUDENT })}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${userForm.role === Role.STUDENT ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <GraduationCap size={18} /> Student
          </button>
          <button
            type="button"
            onClick={() => setUserForm({ ...userForm, role: Role.MENTOR })}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${userForm.role === Role.MENTOR ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Briefcase size={18} /> Mentor
          </button>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input
                required
                type="text"
                placeholder="Enter full name"
                className="w-full rounded-xl border-gray-200 p-3 border focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={userForm.fullName}
                onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input
                required
                type="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border-gray-200 p-3 border focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={userForm.email}
                onChange={e => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>
          </div>

          {userForm.role === Role.STUDENT && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-gray-700 mb-2">Assign to Batch</label>
              <select
                required
                className="w-full rounded-xl border-gray-200 p-3 border focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
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

          {userForm.role === Role.MENTOR && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                <Shield size={16} /> Mentor Classification
              </h4>
              <div>
                <label className="block text-[10px] text-indigo-500 mb-2 uppercase font-black tracking-wider">Classification Type</label>
                <select
                  required
                  className="w-full rounded-xl border-indigo-200 p-3 border text-sm bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] mt-4"
          >
            Register {userForm.role === Role.STUDENT ? 'Student' : 'Mentor'}
          </button>
        </form>
      </div>
    </div>
  );
};
