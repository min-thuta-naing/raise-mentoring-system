import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { AuthLayout } from '../AuthLayout';

export const StudentWelcome: React.FC = () => {
  const sideContent = (
    <div className="text-left font-outfit select-none">
      <h2 className="text-4xl md:text-5xl font-medium text-slate-900 leading-tight">
        Welcome to
      </h2>
      <h1 className="text-8xl md:text-9xl font-black text-[#482121] tracking-tighter -mt-2 drop-shadow-sm">
        RAISE
      </h1>
      <p className="text-xl md:text-2xl font-light text-slate-600 mt-4 tracking-widest uppercase">
        AI mentoring platform
      </p>
    </div>
  );

  return (
    <AuthLayout 
      title="Student Portal" 
      subtitle="Choose how you would like to continue."
      backgroundImage="/student_welcome.png"
      align="right"
      theme="light"
      sideContent={sideContent}
    >
      <div className="grid grid-cols-1 gap-4">
        <Link
          to="/welcome/students/login"
          className="group flex items-center p-6 rounded-2xl border border-black/5 bg-black/[0.03] hover:bg-black/[0.05] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(72,33,33,0.1)]"
        >
          <div className="p-4 rounded-xl bg-[#482121]/10 mr-6 group-hover:scale-110 transition-transform">
            <LogIn className="w-8 h-8 text-[#482121]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1 uppercase tracking-wider">Sign In</h3>
            <p className="text-slate-600 text-sm">Access your student dashboard and logs.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-[#482121] group-hover:translate-x-2 transition-all" />
        </Link>

        <Link
          to="/welcome/students/signup"
          className="group flex items-center p-6 rounded-2xl border border-black/5 bg-black/[0.03] hover:bg-black/[0.05] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(72,33,33,0.1)]"
        >
          <div className="p-4 rounded-xl bg-[#482121]/10 mr-6 group-hover:scale-110 transition-transform">
            <UserPlus className="w-8 h-8 text-[#482121]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1 uppercase tracking-wider">New Student</h3>
            <p className="text-slate-600 text-sm">Create your profile and start the journey.</p>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-[#482121] group-hover:translate-x-2 transition-all" />
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-center space-x-2 text-slate-500">
        <GraduationCap className="w-5 h-5" />
        <span className="text-xs font-semibold tracking-widest uppercase">Mae Fah Luang University</span>
      </div>
    </AuthLayout>
  );
};
