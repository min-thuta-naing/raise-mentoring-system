import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../../services/DataContext';
import { Role } from '../../../types';
import { AuthLayout } from '../AuthLayout';
import { GraduationCap, ArrowRight, Mail, Lock } from 'lucide-react';

export const StudentLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password, Role.STUDENT);
      navigate('/student');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Student Login" 
      subtitle="Continue your learning journey and track progress."
      theme="light"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#482121] transition-colors" />
            <input
              type="email"
              placeholder="Student Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/[0.03] border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#482121]/20 focus:border-[#482121]/30 transition-all font-medium"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#482121] transition-colors" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/[0.03] border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#482121]/20 focus:border-[#482121]/30 transition-all font-medium"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-600 text-sm animate-shake">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-black/10 bg-black/5 text-[#482121] focus:ring-[#482121]/40" />
            <label htmlFor="remember" className="text-sm text-slate-500">Remember me</label>
          </div>
          <a href="#" className="text-sm text-[#482121] hover:underline transition-colors font-medium">Forgot Password?</a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full group relative flex items-center justify-center p-4 rounded-2xl bg-[#482121] text-white font-bold text-lg shadow-xl hover:bg-[#5a2a2a] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
        >
          <span className="relative z-10">{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          {!isSubmitting && <ArrowRight className="relative z-10 w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="mt-8 text-center text-slate-500 text-sm">
        Don't have a student account?{' '}
        <Link to="/welcome/students/signup" className="text-[#482121] font-bold hover:underline transition-colors">
          Sign up as Student
        </Link>
      </div>
    </AuthLayout>
  );
};
