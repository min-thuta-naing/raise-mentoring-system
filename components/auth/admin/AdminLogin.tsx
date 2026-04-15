import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../../services/DataContext';
import { Role } from '../../../types';
import { AuthLayout } from '../AuthLayout';
import { Shield, ArrowRight, Mail, Lock } from 'lucide-react';

export const AdminLogin: React.FC = () => {
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
      await login(email, password, Role.ADMIN);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to access admin console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Admin Console" 
      subtitle="Secure management and oversight for the RAISE platform."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <input
              type="email"
              placeholder="Admin Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-rose-500/30 text-rose-400 text-sm animate-shake backdrop-blur-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full group relative flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-lg shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden disabled:opacity-50"
        >
          <span className="relative z-10">{isSubmitting ? 'Authenticating...' : 'Access Admin Dashboard'}</span>
          {!isSubmitting && <ArrowRight className="relative z-10 w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="mt-8 text-center text-slate-400 text-sm">
        Authorized personnel only.{' '}
        <Link to="/auth/portal-secure-v8821-admin/enroll" className="text-rose-400 font-semibold hover:text-rose-300 transition-colors underline underline-offset-4">
          Request Admin Privileges
        </Link>
      </div>
    </AuthLayout>
  );
};
