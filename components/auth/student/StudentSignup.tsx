import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../../services/DataContext';
import { Role } from '../../../types';
import { AuthLayout } from '../AuthLayout';
import { ArrowRight, Mail, Lock, User, Users } from 'lucide-react';
import { PasswordRequirements } from '../PasswordRequirements';

export const StudentSignup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useData();
  const navigate = useNavigate();

  const isPasswordValid = (pass: string) => {
    return (
      /[A-Z]/.test(pass) &&
      /[a-z]/.test(pass) &&
      /[0-9]/.test(pass) &&
      /[!@#$%^&*(),.?":{}|<> ]/.test(pass) &&
      pass.length >= 8
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      await signup({
        email,
        fullName,
        role: Role.STUDENT,
      }, password);
      navigate('/welcome/students/signup/approval_request');
    } catch (err: any) {
      setError(err.message || 'Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AuthLayout 
      title="Student Signup" 
      subtitle="Success starts here. Join the community and grow."
      theme="light"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#482121] transition-colors" />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
            <input
              type="email"
              placeholder="Student Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
              <input
                type="password"
                placeholder="Create Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-medium shadow-sm"
              />
            </div>
            <PasswordRequirements password={password} activeColor="cyan" theme="light" />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isPasswordValid(password) || isSubmitting}
          className="w-full group relative flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
        >
          <span className="relative z-10">
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </span>
          {!isSubmitting && <ArrowRight className="relative z-10 w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="mt-6 text-center text-slate-500 text-sm font-medium">
        Already have a student account?{' '}
        <Link to="/welcome/students/login" className="text-cyan-600 font-bold hover:text-cyan-500 transition-colors underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
