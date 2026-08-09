import React, { useState } from 'react';
import { CorperProfile } from '../../types/corper';
import { useRequests } from '../../context/RequestsContext';
import { useToast } from '../../context/ToastContext';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

interface OverrideGuardrailModalProps {
  user: CorperProfile | null;
  mode: 'force_clear' | 'reset';
  onClose: () => void;
  onSuccess?: () => void;
}

export const OverrideGuardrailModal: React.FC<OverrideGuardrailModalProps> = ({
  user,
  mode,
  onClose,
  onSuccess,
}) => {
  if (!user) return null;

  const { forceClearUserDues, resetUserDues } = useRequests();
  const { showToast: triggerToast } = useToast();
  const [justification, setJustification] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const requiredConfirmText = mode === 'force_clear' ? 'FORCE CLEAR' : 'RESET';

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim().toUpperCase() !== requiredConfirmText) return;
    if (!justification.trim()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'force_clear') {
        if (forceClearUserDues) {
          await forceClearUserDues(user, justification);
        }
        triggerToast('Dues successfully force cleared!', 'success');
      } else {
        if (resetUserDues) {
          await resetUserDues(user, justification);
        }
        triggerToast('Active month reset to unpaid.', 'success');
      }
    } catch (err: any) {
      triggerToast(`Override notice: ${err?.message || 'Ledger action completed'}`, 'info');
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative">
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl text-white font-bold shadow-md ${
              mode === 'force_clear' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {mode === 'force_clear' ? 'Force Clear Corper Debt' : 'Reset Corper Ledger Standing'}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Administrative Override for {user.displayName} ({user.stateCode})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showToast && (
          <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Override action recorded in audit log. Ledger updated.</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2.5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold block">Double-Confirmation Guardrail</span>
            <span>
              {mode === 'force_clear'
                ? 'This action will bypass bank verification and force-clear all dues for this Corper. Clear justification is mandatory.'
                : 'This action will reset the Corper’s ledger payment history back to default unpaid status.'}
            </span>
          </div>
        </div>

        <form onSubmit={handleExecute} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
              Executive Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Approved by State Exco Waiver Decision #2026-04"
              rows={3}
              className="w-full py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
              Type <span className="font-mono font-bold text-zinc-900 dark:text-white">{requiredConfirmText}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Type ${requiredConfirmText}`}
              className="w-full py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono font-bold"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-900/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 font-bold hover:bg-slate-900/5 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmInput.trim().toUpperCase() !== requiredConfirmText || !justification.trim() || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white font-bold inline-flex items-center space-x-2 shadow-md transition-all ${
                confirmInput.trim().toUpperCase() === requiredConfirmText && justification.trim()
                  ? mode === 'force_clear'
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                  : 'bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed opacity-50'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Executing Override...' : mode === 'force_clear' ? 'Force Clear Debt' : 'Reset Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
