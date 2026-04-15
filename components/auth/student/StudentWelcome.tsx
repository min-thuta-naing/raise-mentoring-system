import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';

export const StudentWelcome: React.FC = () => {
  return (
    <AuthLayout 
      title="Student Welcome" 
      subtitle="The RAISE Student Portal. Choose how you would like to continue."
    >
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/welcome/students/login"
          className="group flex items-center p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
        >
          <div className="p-4 rounded-xl bg-indigo-500/20 mr-6 group-hover:scale-110 transition-transform">
            <LogIn className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">Sign In</h3>
            <p className="text-slate-400 text-sm">Access your student dashboard and logs.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
        </Link>

        <Link
          to="/welcome/students/signup"
          className="group flex items-center p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
        >
          <div className="p-4 rounded-xl bg-indigo-500/20 mr-6 group-hover:scale-110 transition-transform">
            <UserPlus className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">New Student</h3>
            <p className="text-slate-400 text-sm">Create your profile and start the journey.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center space-x-2 text-slate-500">
        <GraduationCap className="w-5 h-5" />
        <span className="text-xs font-semibold tracking-widest uppercase">RAISE Academy Partner</span>
      </div>
    </AuthLayout>
  );
};
