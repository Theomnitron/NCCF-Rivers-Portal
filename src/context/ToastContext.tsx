import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]); // Keep at most 4 active toasts

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Unified Pro Mobile Bottom-Center Toast Stack */}
      <div className="fixed bottom-5 sm:bottom-8 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none px-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl border backdrop-blur-xl max-w-sm sm:max-w-md w-auto transition-all ${
                toast.type === 'success'
                  ? 'bg-zinc-950/95 text-white border-emerald-500/40 shadow-emerald-950/30'
                  : toast.type === 'warning'
                  ? 'bg-zinc-950/95 text-white border-amber-500/40 shadow-amber-950/30'
                  : toast.type === 'error'
                  ? 'bg-zinc-950/95 text-white border-rose-500/40 shadow-rose-950/30'
                  : 'bg-zinc-950/95 text-white border-sky-500/40 shadow-sky-950/30'
              }`}
            >
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {toast.type === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              )}

              <span
                className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : toast.type === 'warning'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : toast.type === 'error'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                }`}
              >
                {toast.type}
              </span>

              <p className="text-xs font-semibold text-zinc-100 leading-snug truncate max-w-[220px] sm:max-w-xs">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

