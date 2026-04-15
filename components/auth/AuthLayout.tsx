import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background with the generated image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 z-0"
        style={{ backgroundImage: 'url("/auth-bg.png")' }}
      />
      
      {/* Decorative Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-emerald-900/10 z-1" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] z-1 animate-pulse" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] z-1" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md px-6 py-12 md:px-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 mb-4 shadow-2xl">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              RAISE
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          {children}
        </div>
      </div>
    </div>
  );
};
