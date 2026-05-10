import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../AuthLayout';
import { ArrowRight } from 'lucide-react';

export const StudentApprovalRequest: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout 
      title="Application Received!" 
      subtitle="Your student registration has been submitted successfully."
      theme="light"
    >
      <div className="text-center space-y-6 py-8">
        <div className="relative">
          <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-cyan-600 -rotate-90" />
            </div>
          </div>
          {/* Pulsing rings */}
          <div className="absolute inset-0 w-20 h-20 bg-cyan-400/10 rounded-full mx-auto animate-ping opacity-20"></div>
        </div>

        <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Under Review</h3>
            <p className="text-slate-500 text-sm leading-relaxed px-4">
              Our academic team is currently reviewing your registration. 
              You will receive access to the student portal once your account is approved.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/welcome/students/login')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          Go to Login
        </button>
      </div>
    </AuthLayout>
  );
};
