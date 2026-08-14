import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NccfLogo } from '../NccfLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
  X,
  Users,
  HeartHandshake,
  FileCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, claimAccount, resetPassword } = useAuth();
  const { showToast } = useToast();

  // Mode: 'signin' | 'claim'
  const [authMode, setAuthMode] = useState<'signin' | 'claim'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleModeSwitch = (mode: 'signin' | 'claim') => {
    setAuthMode(mode);
    clearFeedback();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrorMsg(error.message || 'Invalid email or password. Please check your credentials.');
        showToast(error.message || 'Invalid email or password.', 'error');
      } else {
        setSuccessMsg('Successfully authenticated! Welcome back.');
        showToast('Successfully authenticated! Welcome back.', 'success');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected authentication error occurred.');
      showToast(err?.message || 'Authentication error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!email.trim() || !stateCode.trim() || !password) {
      setErrorMsg('Please complete all required fields: Email, State Code, and Password.');
      return;
    }

    // Basic state code validation (e.g. RV/26B/1234 or similar)
    const formattedStateCode = stateCode.trim().toUpperCase();
    if (formattedStateCode.length < 5) {
      setErrorMsg('Please enter a valid NYSC State Code (e.g., RV/26B/1590).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await claimAccount(email.trim(), formattedStateCode, password);
      if (error) {
        setErrorMsg(error.message || 'Account claim failed. Verify your email and State Code matches our roster.');
        showToast(error.message || 'Account claim failed.', 'error');
      } else {
        setSuccessMsg('Account claimed and activated successfully! Signing you in...');
        showToast('Account claimed & activated successfully!', 'success');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An error occurred while claiming your account.');
      showToast(err?.message || 'Claim error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);

    if (!resetEmail.trim()) {
      setResetMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setResetSubmitting(true);
    try {
      const { error } = await resetPassword(resetEmail.trim());
      if (error) {
        setResetMsg({ type: 'error', text: error.message || 'Failed to send password reset request.' });
      } else {
        setResetMsg({
          type: 'success',
          text: 'Password reset link sent! Check your inbox for instructions.',
        });
      }
    } catch (err: any) {
      setResetMsg({ type: 'error', text: err?.message || 'An error occurred while requesting password reset.' });
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans relative selection:bg-blue-600 selection:text-white transition-colors duration-200">

      {/* 1. ATMOSPHERIC BACKDROP IMAGE WITH SLIGHT ELEGANT BLUR */}
      <div
        className="absolute -inset-8 bg-cover bg-center filter blur-[10px] scale-110 pointer-events-none opacity-90 transition-all duration-500"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80')` }}
      />

      {/* 2. SUBTLE TRANSLUCENT TINT FOR CRISP TEXT LEGIBILITY (NOT CLOUDED) */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* LEFT PANEL (Desktop 60% Width Split-Screen) */}
      <div className="hidden lg:flex lg:w-[60%] flex-col justify-between p-12 lg:p-16 bg-zinc-900/20 relative overflow-hidden border-r border-white/10 backdrop-blur-xl">

        {/* Decorative Glass Halos */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo + Title */}
        <div className="flex items-center space-x-3 z-10">
          <div className="relative flex items-center justify-center p-2">
            {/* <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping pointer-events-none" />
            <div className="absolute -inset-1 rounded-full bg-blue-500/40 animate-pulse pointer-events-none blur-xs" /> */}
            <NccfLogo className="w-16 h-16 animted-pulse relative z-10" />
            <div className="absolute -inset-2 border border-blue-500/30 rounded-full animate-ping pointer-events-none" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
              NCCF RIVERS STATE
            </h1>
            <p className="text-[0.9rem] font-bold text-blue-400 uppercase tracking-widest mt-1">
              Nigeria Christian Corpers' Fellowship
            </p>
          </div>
        </div>

        {/* Middle Glassmorphic Floating Highlight Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="my-auto z-10 space-y-6 max-w-xl"
        >
          <div className="inline-flex items-center space-x-3 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[0.7rem]">NCCF Rivers State Family Portal</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight shrink-0">
            Jesus Corpers' Management Portal
          </h2>

          <p className="text-slate-300 text-base leading-relaxed font-normal">
            Welcome to the official portal for NCCF Corpers in Rivers State. Access house dues clearance, submit exeat requests, track unit activities, and manage your profile seamlessly.
          </p>

          {/* Feature Highlights Grid - Low Opacity Glass Cards */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/10 backdrop-blur-xl shadow-sm hover:bg-zinc-900/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Fellowship</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Family House Roster</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/10 backdrop-blur-xl shadow-sm hover:bg-zinc-900/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Clearance</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Dues & Exeats</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/10 backdrop-blur-xl shadow-sm hover:bg-zinc-900/40 transition-all">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">Administrative</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Executive Governance</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Footer Info */}
        <div className="z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-4">
          <span>© 2026 NCCF Rivers State Secretariat</span>
          <span className="font-semibold">Port Harcourt, Rivers State</span>
        </div>
      </div>

      {/* RIGHT PANEL (Desktop 40% Width / Mobile Main Container) */}
      <div className="flex-1 lg:w-[40%] flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto min-h-[100dvh] lg:min-h-0 z-10 py-6 lg:py-12">

        {/* Mobile Header (< lg) */}
        <div className="lg:hidden flex flex-col items-center text-center mb-4 z-10">
          <div className="relative flex items-center justify-center p-2 mb-2">
            {/* <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping pointer-events-none" /> */}
            <div className="absolute -inset-2 border border-blue-500/30 rounded-full animate-ping pointer-events-none" />
            <NccfLogo className="w-16 h-16 animate-pulse relative z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NCCF RIVERS STATE</h1>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">Family House Portal</p>
        </div>

        {/* Main Sleek Transparent Glassmorphic Auth Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md backdrop-blur-2xl bg-zinc-900/40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 rounded-3xl relative z-10"
        >
          {/* Segmented Toggle Control */}
          <div className="grid grid-cols-2 p-1.5 bg-zinc-950/50 rounded-2xl border border-white/10 mb-6 relative">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className={`py-2.5 text-xs rounded-xl transition-all duration-200 z-10 cursor-pointer ${authMode === 'signin'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white font-medium'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('claim')}
              className={`py-2.5 text-xs rounded-xl transition-all duration-200 z-10 cursor-pointer ${authMode === 'claim'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-white font-medium'
                }`}
            >
              Claim Account
            </button>
          </div>

          {/* Form Header Info */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {authMode === 'signin' ? 'Welcome Back, Corper' : 'Claim Your Account'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {authMode === 'signin'
                ? 'Enter your registered email address and password to log in.'
                : 'Verify your NYSC State Code and activate your account password.'}
            </p>
          </div>

          {/* Feedback Alert Banners */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2.5 backdrop-blur-md"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start space-x-2.5 backdrop-blur-md"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode 1: SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., acpapa.michael@nccf-rivers.org"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Mode 2: CLAIM ACCOUNT FORM */
            <form onSubmit={handleClaimAccount} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., acpapa.michael@nccf-rivers.org"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* State Code Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  NYSC State Code
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                    placeholder="e.g., RV/26B/1590"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono tracking-wider font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Must match your State Code in the Corper Roster.</p>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Claiming...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Activate Account</span>
                  </>
                )}
              </button>
            </form>
          )}

        </motion.div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl relative text-slate-100"
            >
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setResetMsg(null);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Reset Password</h4>
                  <p className="text-xs text-slate-400">Receive password reset instructions</p>
                </div>
              </div>

              {resetMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-start space-x-2 ${resetMsg.type === 'success'
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    }`}
                >
                  {resetMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span>{resetMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g., acpapa.michael@nccf-rivers.org"
                    required
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                >
                  {resetSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Send Reset Email</span>
                  )}
                </button>

                {/* Dev & Testing Helper */}
                {/* <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      window.location.search = '?mode=resetPassword';
                    }}
                    className="text-[11px] font-semibold text-blue-400 hover:underline cursor-pointer"
                  >
                    Preview Reset Password Form
                  </button>
                </div> */}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
