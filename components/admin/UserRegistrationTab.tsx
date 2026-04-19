import React, { useState } from 'react';
import { Users, GraduationCap, Briefcase, Shield, CheckCircle2, Search, Filter, ShieldCheck, Mail, Clock, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Batch, User, Role, MentorType, UserStatus } from '../../types';

interface UserRegistrationTabProps {
  batches: Batch[];
  users: User[];
  onApproveUser: (userId: string, role: Role, data: Partial<User>) => Promise<void>;
  onRejectUser: (userId: string, role: Role) => Promise<void>;
}

export const UserRegistrationTab: React.FC<UserRegistrationTabProps> = ({
  batches,
  users,
  onApproveUser,
  onRejectUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Local state for assignments during approval
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, { batchId?: string, mentorType?: MentorType }>>({});

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);
  const activeUsers = users.filter(u => u.status === UserStatus.APPROVED && u.role !== Role.ADMIN);

  const filteredActiveUsers = activeUsers.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAssignmentChange = (userId: string, key: string, value: string) => {
    setPendingAssignments(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [key]: value
      }
    }));
  };

  const handleApprove = async (user: User) => {
    const assignment = pendingAssignments[user.id];
    
    if (user.role === Role.STUDENT && !assignment?.batchId) {
      toast.error('Please assign a batch to the student.');
      return;
    }
    if (user.role === Role.MENTOR && (!assignment?.mentorType || assignment.mentorType === MentorType.NONE)) {
      toast.error('Please assign a mentor classification.');
      return;
    }

    setIsProcessing(user.id);
    console.log(`[AUTH] Attempting approval for ${user.fullName} (${user.id})`);
    
    // Sanitize data to avoid sending 'undefined' to Firestore
    const dataToUpdate: Partial<User> = {};
    if (user.role === Role.STUDENT) {
      dataToUpdate.batchId = assignment?.batchId;
    } else {
      dataToUpdate.mentorType = assignment?.mentorType;
    }

    try {
      await onApproveUser(user.id, user.role, dataToUpdate);
      console.log(`[AUTH] Approval successful for ${user.id}`);
      toast.success(`${user.fullName} approved successfully!`);
    } catch (err: any) {
      console.error(`[AUTH] Approval failed for ${user.id}:`, err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = (user: User) => {
    toast.warning(`Are you sure you want to decline registration for ${user.fullName}?`, {
      action: {
        label: 'Decline',
        onClick: async () => {
          setIsProcessing(user.id);
          console.log(`[AUTH] Attempting rejection for ${user.fullName} (${user.id})`);
          try {
            await onRejectUser(user.id, user.role);
            console.log(`[AUTH] Rejection successful for ${user.id}`);
            toast.info(`Registration for ${user.fullName} declined.`);
          } catch (err: any) {
            console.error(`[AUTH] Rejection failed for ${user.id}:`, err);
            toast.error(`Error: ${err.message}`);
          } finally {
            setIsProcessing(null);
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Pending Approvals Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            Pending Approvals
            <span className="ml-2 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {pendingUsers.length}
            </span>
          </h3>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="text-slate-800 font-bold mb-1">Queue is clear!</h4>
            <p className="text-slate-500 text-sm">No new registrations currently waiting for approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{user.fullName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${user.role === Role.STUDENT ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {user.role}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Mail size={12} /> {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {user.role === Role.STUDENT ? (
                    <div className="sm:col-span-2">
                       <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 ml-1">Assign Batch</label>
                       <select 
                        className="w-full bg-slate-50 border-slate-100 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                        value={pendingAssignments[user.id]?.batchId || ''}
                        onChange={e => handleAssignmentChange(user.id, 'batchId', e.target.value)}
                       >
                        <option value="">Select a Batch...</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5 ml-1">Classification</label>
                      <select 
                        className="w-full bg-slate-50 border-slate-100 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all outline-none"
                        value={pendingAssignments[user.id]?.mentorType || ''}
                        onChange={e => handleAssignmentChange(user.id, 'mentorType', e.target.value)}
                       >
                        <option value="">Select Type...</option>
                        <option value={MentorType.INTERNAL}>Internal (Gov/Academic)</option>
                        <option value={MentorType.EXTERNAL}>External (Industry)</option>
                       </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[UI] Approve button clicked');
                      handleApprove(user);
                    }}
                    disabled={isProcessing === user.id}
                    className={`relative z-50 cursor-pointer px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-lg active:scale-95 ${user.role === Role.STUDENT ? 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing === user.id ? 'Processing...' : 'Approve Access'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[UI] Decline button clicked');
                      handleReject(user);
                    }}
                    disabled={isProcessing === user.id}
                    className="relative z-50 cursor-pointer px-6 py-3 rounded-2xl font-black text-xs transition-all border-2 border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Users Directory Section */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Active Directory</h3>
              <p className="text-slate-500 text-xs">Manage current students and mentors</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="pl-11 pr-4 py-2.5 bg-slate-50 border-slate-100 rounded-xl text-sm w-full md:w-64 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl">
              {(['ALL', Role.STUDENT, Role.MENTOR] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${roleFilter === role ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {role === 'ALL' ? 'Everyone' : role === Role.STUDENT ? 'Students' : 'Mentors'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="pb-4 pt-1 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                <th className="pb-4 pt-1 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Type</th>
                <th className="pb-4 pt-1 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment</th>
                <th className="pb-4 pt-1 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredActiveUsers.map(user => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[9px] w-fit font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${user.role === Role.STUDENT ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {user.role}
                      </span>
                      {user.mentorType && (
                        <span className="text-[10px] text-slate-400 font-bold ml-1">{user.mentorType}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {user.role === Role.STUDENT ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Layers size={14} className="text-indigo-400" />
                          {batches.find(b => b.id === user.batchId)?.name || 'Unassigned'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Briefcase size={14} className="text-emerald-400" />
                          Mentoring System
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActiveUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-sm italic">
                    No active users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
