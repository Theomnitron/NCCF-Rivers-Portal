import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnnouncements } from '../context/AnnouncementsContext';
import { useRequests } from '../context/RequestsContext';
import { useTheme } from '../context/ThemeContext';
import { evaluateTier } from '../utils/tierEvaluator';
import { formatTruncatedName } from '../utils/sanitizers';
import { NccfLogo } from './NccfLogo';
import { Sun, Moon, LogOut, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab }) => {
  const { activeUser, signOut, refetchRoster } = useAuth();
  const { refetchAnnouncements } = useAnnouncements();
  const { refetchRequests } = useRequests();
  const { theme, toggleTheme } = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);
  const tierInfo = evaluateTier(activeUser);

  // Compute truncated name (e.g., "Michael O.")
  const truncatedName = formatTruncatedName(activeUser.firstName, activeUser.lastName);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await Promise.all([
        refetchRoster ? refetchRoster() : Promise.resolve(),
        refetchAnnouncements ? refetchAnnouncements() : Promise.resolve(),
        refetchRequests ? refetchRequests() : Promise.resolve(),
      ]);
    } catch (e) {
      console.warn('Manual sync warning:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 dark:bg-zinc-950/80 dark:backdrop-blur-xl dark:border-white/10 shadow-sm py-2.5 px-4 sm:px-6 transition-colors duration-200">
      <div className="w-full flex items-center justify-between">
        
        {/* TOP LEFT: NCCF Logo + "NCCF" / "Rivers State" (No hamburger icon here) */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <NccfLogo className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex-shrink-0" />
          
          <div className="flex flex-col text-left">
            <span className="text-[1rem] sm:text-lg lg:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-none">
              NCCF Portal
            </span>
            <span className="text-[0.6875rem] sm:text-xs font-bold text-zinc-600 dark:text-zinc-400 leading-tight mt-0.5">
              Rivers State
            </span>
          </div>
        </div>

        {/* EXTREME RIGHT: Adaptive Layout across Mobile, Tablet, Desktop */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          
          {/* 0. Manual Data Sync Button */}
          {/* <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer select-none disabled:opacity-60"
            title="Sync & Refresh Database Data"
            aria-label="Refresh Data from Supabase"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
          </button> */}

          {/* 1. Light / Dark Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-800 dark:text-zinc-100 bg-white/70 dark:bg-zinc-800/70 hover:bg-white/90 dark:hover:bg-zinc-700/90 border border-white/80 dark:border-white/10 shadow-sm transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98] cursor-pointer select-none"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-zinc-700" />
            )}
          </button>

          {/* 2. User's Truncated Name (Visible on Tablet & Desktop) */}
          <span className="hidden sm:inline-block font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 max-w-[130px] md:max-w-[180px] truncate">
            {truncatedName}
          </span>

          {/* 3. Tier Label in Cylindrical / Pill Background (Visible on Tablet & Desktop) */}
          <div
            className="hidden sm:inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold text-zinc-900 shadow-sm transition-transform hover:scale-105 select-none"
            style={{ backgroundColor: tierInfo.hexColor }}
            title={`Tier ${activeUser.tier} • ${tierInfo.categoryName}`}
          >
            {tierInfo.badgeText}
          </div>

          {/* 4. Avatar Image with Tier Border & Colored Accent Dot (Click to navigate to Settings) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('settings')}
            className="relative flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-full"
            title={`${activeUser.displayName} — Click to open Profile & Settings`}
            aria-label="Open User Settings"
          >
            <img
              src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={activeUser.displayName}
              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full object-cover shadow-sm transition-transform hover:scale-105 active:scale-95"
              style={{
                border: `2px solid ${tierInfo.hexColor}`,
              }}
            />
            {/* Accent Color Dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm"
              style={{ backgroundColor: tierInfo.hexColor }}
            />
          </button>

        </div>

      </div>
    </header>
  );
};
