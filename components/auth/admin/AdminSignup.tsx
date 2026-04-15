import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../../services/DataContext';
import { Role } from '../../../types';
import { AuthLayout } from '../AuthLayout';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';
import { PasswordRequirements } from '../PasswordRequirements';

export const AdminSignup: React.FC = () => {
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
        role: Role.ADMIN,
      }, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Admin Enrollment" 
      subtitle="Initialize your administrative access and start managing."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
            />
          </div>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            <input
              type="email"
              placeholder="Admin Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
              <input
                type="password"
                placeholder="Create Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/50 transition-all"
              />
            </div>
            <PasswordRequirements password={password} activeColor="rose" />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isPasswordValid(password) || isSubmitting}
          className="w-full group relative flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
        >
          <span className="relative z-10">
            {isSubmitting ? 'Accessing Secure Core...' : 'Initialize Administrator'}
          </span>
          {!isSubmitting && <ArrowRight className="relative z-10 w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      <div className="mt-6 text-center text-slate-400 text-sm">
        Already have an admin account?{' '}
        <Link to="/auth/portal-secure-v8821-admin/login" className="text-rose-400 font-semibold hover:text-rose-300 transition-colors">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
