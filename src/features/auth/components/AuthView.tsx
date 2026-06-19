import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { User } from '../../../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [email, setEmail] = useState<string>('admin@smartbill.com');
  const [password, setPassword] = useState<string>('admin');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorText('');

    // Simulate safe server-side validation delay
    setTimeout(() => {
      setIsLoading(false);
      if (email === 'admin@smartbill.com' && password === 'admin') {
        onLoginSuccess({
          name: 'Sarah Jenkins',
          email: 'admin@smartbill.com',
          role: 'Platform Owner',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
        });
      } else {
        setErrorText('Invalid credentials. Hint: use default credentials below.');
      }
    }, 1200);
  };

  return (
    <div id="auth-terminal-root" className="w-full">
      {/* Main Branding Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-xl bg-[#000000] text-white items-center justify-center font-bold shadow-md shadow-[#000000]/10 mb-4">
          <Terminal size={24} className="text-[#86f2e4]" />
        </div>
        <h1 className="font-display text-2xl font-black text-[#0b1c30] tracking-tight">SmartBill Pro</h1>
        <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1.5">Administrative POS Gateway</p>
      </div>

      {/* Form panel Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Administrative Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] focus:ring-2 focus:ring-[#006a61]/10 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Gateway Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] focus:ring-2 focus:ring-[#006a61]/10 outline-none transition-all"
                required
              />
            </div>
          </div>

          {errorText && (
            <p className="text-[10.5px] font-bold text-[#ba1a1a] leading-tight text-center">
              {errorText}
            </p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#006a61] text-white font-display text-xs font-bold rounded-lg hover:bg-opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#006a61]/10"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                <span>Authorizing Gateway...</span>
              </>
            ) : (
              <>
                <span>Sign In To Workspace</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Assist HUD */}
        <div className="mt-6 pt-4 border-t border-[#e2e8f0]/60 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#006f66]">
            <ShieldCheck size={13} />
            <span>TEST BED DEMO CODE INJECTED</span>
          </div>
          <p className="text-[10.5px] text-[#7c839b] font-medium leading-relaxed">
            Use default credentials preloaded above to safely experience the complete suite of features.
          </p>
        </div>
      </div>

      {/* Footer legalities */}
      <p className="text-center font-sans text-[10px] text-[#7c839b] font-bold uppercase tracking-wider mt-6">
        Protected Workspace · ISO-27001 Gateway
      </p>
    </div>
  );
}
