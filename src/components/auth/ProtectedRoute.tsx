import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from './LoginPage';
import { ResetPasswordView } from './ResetPasswordView';
import { supabase } from '../../lib/supabase';
import { NccfLogo } from '../NccfLogo';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, corperProfile, loading } = useAuth();
  const [isResetPasswordFlow, setIsResetPasswordFlow] = useState<boolean>(() => {
    const search = window.location.search;
    const hash = window.location.hash;
    return search.includes('mode=resetPassword') || hash.includes('type=recovery');
  });

  useEffect(() => {
    // Listen for Supabase PASSWORD_RECOVERY event when user opens recovery link from email
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordFlow(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // If password reset recovery link opened, render ResetPasswordView
  if (isResetPasswordFlow) {
    return (
      <ResetPasswordView
        onSuccessRedirect={() => {
          setIsResetPasswordFlow(false);
        }}
        onCancel={() => {
          setIsResetPasswordFlow(false);
          if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }}
      />
    );
  }

  // 1. Loading state: Sleek glassmorphic ambient loading backdrop matching LoginPage
  if (loading) {
    return (
      <div className="dark min-h-[100dvh] w-full max-w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Atmospheric Backdrop Image with Elegant Blur */}
        <div 
          className="absolute -inset-8 bg-cover bg-center filter blur-[10px] scale-110 pointer-events-none opacity-90 transition-all duration-500" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80')` }}
        />
        
        {/* Subtle Translucent Dark Tint */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />

        {/* Translucent Glassmorphic Loading Box */}
        <div className="relative z-10 flex flex-col items-center space-y-5 text-center p-8 sm:p-10 rounded-3xl bg-zinc-900/40 border border-white/10 backdrop-blur-2xl shadow-2xl max-w-sm w-full mx-4">
          <div className="relative">
            <NccfLogo className="w-16 h-16 animate-pulse" />
            <div className="absolute -inset-2 border border-blue-500/30 rounded-full animate-ping pointer-events-none" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">NCCF RIVERS PORTAL</h2>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Verifying Portal Access...</p>
          </div>

          <div className="flex items-center space-x-2 text-slate-300 text-xs pt-1">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="font-medium">Authenticating session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render LoginPage
  if (!user && !corperProfile) {
    return <LoginPage />;
  }

  // 3. Authenticated: Render portal contents
  return <>{children}</>;
};
