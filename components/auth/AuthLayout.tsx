import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  align?: 'center' | 'left' | 'right';
  theme?: 'light' | 'dark';
  sideContent?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  backgroundImage = "/auth-bg.png",
  align = 'center',
  theme = 'dark',
  sideContent
}) => {
  return (
    <div className={`min-h-screen w-full relative overflow-hidden flex flex-col lg:flex-row transition-colors duration-500 ${
      theme === 'light' ? 'bg-[#FFFDF6]' : 'bg-slate-950'
    }`}>
      {/* Background with the image */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-100 z-0"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
        />
      )}

      {/* Side Content (Optional, Left side) */}
      {sideContent && (
        <div className="relative z-10 flex-1 hidden lg:flex items-center justify-center p-12 lg:pl-32">
          {sideContent}
        </div>
      )}
      
      {/* Main Content Container */}
      <div className={`relative z-10 flex-1 flex items-center ${
        align === 'center' ? 'justify-center' : align === 'left' ? 'justify-start px-6 md:pl-32' : 'justify-end px-6 md:pr-32'
      }`}>
        <div className="w-full max-w-md py-12">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-2xl backdrop-blur-xl border mb-4 shadow-2xl ${
            theme === 'light' ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
          }`}>
            <span className={`text-2xl font-bold bg-clip-text text-transparent ${
              theme === 'light' 
                ? 'bg-gradient-to-r from-[#482121] to-[#6b3a3a]' 
                : 'bg-gradient-to-r from-indigo-400 to-emerald-400'
            }`}>
              RAISE
            </span>
          </div>
          <h1 className={`text-3xl font-bold tracking-tight mb-2 ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {title}
          </h1>
          <p className={theme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
            {subtitle}
          </p>
        </div>

        <div className={`backdrop-blur-2xl border rounded-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] ${
          theme === 'light' ? 'bg-white/70 border-white/20' : 'bg-white/5 border-white/10'
        }`}>
          {children}
        </div>
      </div>
    </div>
  </div>
);
};
