import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { NccfLogo } from '../NccfLogo';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ResetPasswordViewProps {
  onSuccessRedirect?: () => void;
  onCancel?: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onSuccessRedirect,
  onCancel,
}) => {
  const { updateUserPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Validation
  const isMinLength = newPassword.length >= 6;
  const isMatching = newPassword !== '' && newPassword === confirmPassword;
  const isValid = isMinLength && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const { error } = await updateUserPassword(newPassword);

      if (error) {
        setStatusMsg({
          type: 'error',
          text: error.message || 'Failed to update password. The reset link may have expired.',
        });
        setIsSubmitting(false);
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Your password has been successfully reset! Redirecting to portal...',
        });
        setIsSubmitting(false);

        // Clear hash and mode parameter from URL
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        setTimeout(() => {
          if (onSuccessRedirect) {
            onSuccessRedirect();
          } else {
            window.location.href = window.location.origin;
          }
        }, 1800);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setStatusMsg({
        type: 'error',
        text: 'An unexpected error occurred while setting your new password.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto font-sans select-none">
      {/* Background Decor */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-[12px] scale-105 pointer-events-none opacity-80"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950 pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-slate-100"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-3 shadow-inner">
            <KeyRound className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Set New Password
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Create a secure new password for your NCCF Rivers State portal account.
          </p>
        </div>

        {/* Alert Feedback Banner */}
        {statusMsg && (
          <div
            className={`mb-5 p-3.5 rounded-2xl text-xs font-medium flex items-start space-x-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="p-3 bg-zinc-950/50 rounded-2xl space-y-1.5 text-[11px]">
            <div className={`flex items-center space-x-2 ${isMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>At least 6 characters long</span>
            </div>
            <div className={`flex items-center space-x-2 ${isMatching ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Passwords match</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving New Password...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {onCancel && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
