import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';

export const MentorWelcome: React.FC = () => {
  return (
    <AuthLayout 
      title="Mentor Welcome" 
      subtitle="The RAISE Mentor Portal. Manage your students and sessions."
    >
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/welcome/mentor/login"
          className="group flex items-center p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
          <div className="p-4 rounded-xl bg-emerald-500/20 mr-6 group-hover:scale-110 transition-transform">
            <LogIn className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">Sign In</h3>
            <p className="text-slate-400 text-sm">Access your mentor dashboard and tools.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
        </Link>

        <Link
          to="/welcome/mentor/signup"
          className="group flex items-center p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
          <div className="p-4 rounded-xl bg-emerald-500/20 mr-6 group-hover:scale-110 transition-transform">
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider">New Mentor</h3>
            <p className="text-slate-400 text-sm">Request access to start your coaching journey.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center space-x-2 text-slate-500">
        <BookOpen className="w-5 h-5" />
        <span className="text-xs font-semibold tracking-widest uppercase">RAISE Mentor Partner</span>
      </div>
    </AuthLayout>
  );
};
