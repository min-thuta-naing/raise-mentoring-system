import React from 'react';
import { Check, Circle } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
  activeColor?: 'indigo' | 'emerald' | 'rose';
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ 
  password, 
  activeColor = 'indigo' 
}) => {
  const requirements = [
    { label: 'Upper Case Character', regex: /[A-Z]/ },
    { label: 'Lower Case Character', regex: /[a-z]/ },
    { label: 'Special Character', regex: /[!@#$%^&*(),.?":{}|<>]/ },
    { label: 'Numeric Character', regex: /[0-9]/ },
    { label: 'Minimum 8 Characters', regex: /^.{8,}$/ },
  ];

  const colorMap = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
  };

  const bgMap = {
    indigo: 'bg-indigo-500/10',
    emerald: 'bg-emerald-500/10',
    rose: 'bg-rose-500/10'
  };

  return (
    <div className={`p-4 rounded-2xl border border-white/5 bg-white/5 space-y-2 mt-4 animate-fade-in`}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
        Password Requirements
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {requirements.map((req, index) => {
          const isMet = req.regex.test(password);
          return (
            <div 
              key={index} 
              className={`flex items-center space-x-2 transition-all duration-300 ${isMet ? 'opacity-100' : 'opacity-40'}`}
            >
              <div className={`p-1 rounded-full transition-colors ${isMet ? bgMap[activeColor] : 'bg-white/5'}`}>
                {isMet ? (
                  <Check className={`w-3 h-3 ${colorMap[activeColor]}`} />
                ) : (
                  <Circle className="w-3 h-3 text-slate-500" />
                )}
              </div>
              <span className={`text-[11px] font-medium transition-colors ${isMet ? 'text-white' : 'text-slate-500'}`}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
