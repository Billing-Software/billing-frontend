import React, { createContext, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((t) => {
            let bgColor = 'bg-white/95 border-[#e2e8f0]';
            let textColor = 'text-[#0b1c30]';
            let Icon = Info;
            let iconColor = 'text-[#006f66]';

            if (t.type === 'success') {
              bgColor = 'bg-[#e2f3eb]/95 border-[#b6e7d2]';
              textColor = 'text-[#1e8e3e]';
              Icon = CheckCircle2;
              iconColor = 'text-[#1e8e3e]';
            } else if (t.type === 'error') {
              bgColor = 'bg-[#ffdad6]/95 border-[#ffb4ab]';
              textColor = 'text-[#ba1a1a]';
              Icon = XCircle;
              iconColor = 'text-[#ba1a1a]';
            } else if (t.type === 'warning') {
              bgColor = 'bg-[#fff0d4]/95 border-[#ffe0b2]';
              textColor = 'text-[#b26a00]';
              Icon = AlertTriangle;
              iconColor = 'text-[#b26a00]';
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 ${bgColor}`}
              >
                <Icon size={18} className={`${iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`text-xs font-semibold font-sans ${textColor}`}>{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-gray-600 shrink-0 text-[10px] font-bold ml-1.5 focus:outline-none"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
