import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { hasTripartiteAccess } from '../../types/corper';
import { Header } from '../Header';
import { DeveloperSupportFab } from '../DeveloperSupportFab';
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Settings,
  Menu,
  PanelLeftClose,
  ShieldCheck,
  LogOut,
  Loader2,
} from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Shell: React.FC<ShellProps> = ({ children, activeTab, setActiveTab }) => {
  const { activeUser, signOut, isLoadingRoster } = useAuth();
  const { theme } = useTheme();

  // Desktop Left Sidebar Expanded/Collapsed state - Defaults to EXPANDED on Desktop
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const isApprovalsRole = hasTripartiteAccess(activeUser);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: activeUser.systemCategory === 'member' ? 'Member Portal' : 'Command Center',
    },
    ...(isApprovalsRole
      ? [
        {
          id: 'approvals',
          label: 'Approvals',
          icon: ShieldCheck,
          description: 'Evaluation & Approvals Queue',
        },
      ]
      : [
        {
          id: 'requests',
          label: 'Requests',
          icon: FileText,
          description: 'Dues Proofs & Travel Permits',
        },
      ]),
    {
      id: 'announcements',
      label: 'Notices',
      icon: Megaphone,
      description: 'House Announcements & Events',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Profile Updates & Security',
    },
  ];

  return (
    <div className="h-[100dvh] w-full max-w-full overflow-hidden text-zinc-900 dark:text-zinc-100 font-sans flex flex-col antialiased selection:bg-zinc-900 selection:text-white relative bg-transparent">

      {/* Fixed Wallpaper Canvas Engine (Zero-Flash Theme Switching) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-200 dark:bg-zinc-950">
        {/* Light Theme Background Wallpaper */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop"
          alt="Light Theme Ambient Background"
          className={`w-full h-full object-cover scale-105 filter blur-[10px] absolute inset-0 transition-opacity duration-300 ${theme === 'light' ? 'opacity-100' : 'opacity-0'
            }`}
        />
        {/* Dark Theme Background Wallpaper */}
        <img
          src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop"
          alt="Dark Theme Ambient Background"
          className={`w-full h-full object-cover scale-105 filter blur-[10px] absolute inset-0 transition-opacity duration-300 ${theme === 'dark' ? 'opacity-90' : 'opacity-0'
            }`}
        />
        {/* Subtle Dark Mode Gradient Tint for Contrast & Readability */}
        <div className="absolute inset-0 bg-transparent dark:bg-black/30 pointer-events-none" />
      </div>

      {/* Pinned Top Header */}
      <Header onNavigateTab={setActiveTab} />

      {/* Live Sync Banner */}
      {isLoadingRoster && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/85 text-white backdrop-blur-md border border-white/20 shadow-xl text-[0.75rem] font-semibold animate-pulse pointer-events-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Updating...</span>
        </div>
      )}

      {/* Shell Body with Sidebar & Canvas */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden relative">

        {/* Desktop Collapsible Left Sidebar */}
        <aside
          className={`hidden md:flex flex-col h-full shrink-0 z-40 overflow-y-auto border-r border-slate-200/80 dark:border-white/10 bg-white/80 backdrop-blur-xl shadow-sm dark:bg-zinc-950/80 dark:backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${isSidebarExpanded ? 'w-[260px]' : 'w-[70px]'
            }`}
        >
          {/* Top Collapse Button Bar */}
          <div className="p-3 border-b border-slate-900/10 dark:border-white/10 flex items-center justify-between">
            {isSidebarExpanded && (
              <span className="text-[0.75rem] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-2">
                Navigations
              </span>
            )}
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/80 active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] mx-auto cursor-pointer flex items-center justify-center overflow-hidden"
              title={isSidebarExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isSidebarExpanded ? 'expanded' : 'collapsed'}
                  initial={{ rotate: isSidebarExpanded ? -90 : 90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: isSidebarExpanded ? 90 : -90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex items-center justify-center"
                >
                  {isSidebarExpanded ? (
                    <PanelLeftClose className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full py-3 px-3 min-h-[44px] rounded-xl font-medium text-[0.875rem] flex items-center space-x-3 transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98] cursor-pointer select-none group ${isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-zinc-800/80'
                    }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 group-active:scale-95 transition-transform duration-150" />
                  {isSidebarExpanded && (
                    <div className="text-left overflow-hidden whitespace-nowrap">
                      <div className="font-bold leading-none text-[0.875rem]">{item.label}</div>
                      <div className={`text-[0.6875rem] mt-0.5 ${isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sign Out Button in Sidebar */}
          <div className="p-2 border-t border-slate-900/10 dark:border-white/10">
            <button
              onClick={() => signOut()}
              className="w-full py-3 px-3 min-h-[44px] rounded-xl font-bold text-[0.875rem] flex items-center space-x-3 transition-all duration-150 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 active:scale-[0.98] cursor-pointer group"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-150" />
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden">Sign Out</span>
              )}
            </button>
          </div>

          {/* {/* Sidebar Footer Info }
          {isSidebarExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-900/10 dark:border-white/10 text-[0.75rem] text-zinc-500 dark:text-zinc-400">
              <div className="font-bold text-zinc-800 dark:text-zinc-200">NCCF Rivers Portal</div>
              <div>System Category: <span className="font-mono text-zinc-900 dark:text-zinc-100 uppercase font-semibold">{activeUser.systemCategory}</span></div>
            </div>
          )} */}
        </aside>

        {/* Central Canvas Area with Mobile Padding Optimization & Clearance */}
        <main className="flex-1 h-full overflow-y-auto scrollbar-thin overscroll-stretch py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-full pb-36 md:pb-12">
          {children}
        </main>

      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 dark:bg-zinc-950/80 dark:backdrop-blur-xl py-2 px-3 shadow-lg">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-2 px-2 min-h-[44px] rounded-xl flex flex-col items-center justify-center space-y-1 transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98] cursor-pointer select-none group ${isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-md'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 group-hover:scale-110 group-active:scale-95 transition-transform duration-150" />
                <span className="text-[0.6875rem] font-medium leading-none truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Developer Support Floating Action Button */}
      <DeveloperSupportFab />

    </div>
  );
};
