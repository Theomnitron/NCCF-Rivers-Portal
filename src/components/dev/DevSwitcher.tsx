import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { evaluateTier } from '../../utils/tierEvaluator';
import { hasTripartiteAccess } from '../../types/corper';
import { Wrench, Check, ChevronUp, ChevronDown, RefreshCw, X, Shield, Users, Award } from 'lucide-react';

export const DevSwitcher: React.FC = () => {
  const { allUsers, activeUser, setActiveUser, resetToSeedData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const activeTierInfo = evaluateTier(activeUser);

  const filteredUsers = allUsers.filter((user) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'admin') return user.systemCategory === 'admin';
    if (selectedFilter === 'tripartite') return hasTripartiteAccess(user);
    if (selectedFilter === 'room gov') return user.houseStatus === 'Room Gov';
    if (selectedFilter === 'executive') return user.houseStatus === 'Executive';
    if (selectedFilter === 'delegate') return user.houseStatus === 'Delegate';
    if (selectedFilter === 'gee') return user.houseStatus === 'Gee';
    if (selectedFilter === 'member') return user.houseStatus === 'Member';
    return true;
  });

  return (
    <div className="fixed bottom-16 md:bottom-4 right-3 sm:right-4 z-50">
      {/* Popup Menu */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white/80 backdrop-blur-2xl border border-white/90 dark:bg-zinc-900/90 dark:border-white/10 shadow-[0_16px_48px_0_rgba(0,0,0,0.25)] rounded-2xl p-4 text-zinc-900 dark:text-zinc-100 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 transition-colors">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-900/10 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg shadow-sm">
                <Wrench className="w-4 h-4" />
              </div>
              <h4 className="text-[0.875rem] font-black tracking-tight text-zinc-900 dark:text-white">
                Dev Role & User Switcher
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[0.75rem] text-zinc-600 dark:text-zinc-400">
            Select any profile to test system authorization categories, view routing, tier rules, and dues:
          </p>

          {/* Quick Filter Pill Bar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {[
              { id: 'all', label: `All (${allUsers.length})` },
              { id: 'admin', label: `Admin (${allUsers.filter(u => u.systemCategory === 'admin').length})` },
              { id: 'tripartite', label: `Tripartite (${allUsers.filter(u => hasTripartiteAccess(u)).length})` },
              { id: 'executive', label: `Executives (${allUsers.filter(u => u.houseStatus === 'Executive').length})` },
              { id: 'room gov', label: `Room Gov (${allUsers.filter(u => u.houseStatus === 'Room Gov').length})` },
              { id: 'delegate', label: `Delegates (${allUsers.filter(u => u.houseStatus === 'Delegate').length})` },
              { id: 'gee', label: `Gees (${allUsers.filter(u => u.houseStatus === 'Gee').length})` },
              { id: 'member', label: `Members (${allUsers.filter(u => u.houseStatus === 'Member').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap active:scale-[0.98] transition-all cursor-pointer select-none ${
                  selectedFilter === tab.id
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-slate-900/5 dark:bg-black/40 text-zinc-700 dark:text-zinc-300 hover:bg-slate-900/10 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1 scrollbar-none">
            {filteredUsers.map((user) => {
              const tierInfo = evaluateTier(user);
              const isCurrent = user.id === activeUser.id;

              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setActiveUser(user);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer select-none ${
                    isCurrent
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md'
                      : 'bg-slate-900/5 dark:bg-black/40 hover:bg-slate-900/10 dark:hover:bg-white/5 border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full object-cover shadow-sm"
                        style={{ border: `2px solid ${tierInfo.hexColor}` }}
                      />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-900"
                        style={{ backgroundColor: tierInfo.hexColor }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[0.8125rem] truncate leading-tight">
                          {user.displayName}
                        </span>
                        {/* <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full font-mono uppercase ${
                            isCurrent
                              ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900'
                              : 'bg-slate-900/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {user.houseStatus}
                        </span> */}
                      </div>

                      <div
                        className={`text-[0.6875rem] font-medium truncate mt-0.5 ${
                          isCurrent
                            ? 'text-zinc-300 dark:text-zinc-700'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="font-bold">{user.roomName} Room</span> {' '} • {' '}
                        <span className="font-mono font-bold">{user.stateCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-black text-zinc-900 shadow-2xs select-none"
                      style={{ backgroundColor: tierInfo.hexColor }}
                    >
                      {tierInfo.badgeText}
                    </span>
                    {isCurrent && <Check className="w-4 h-4 text-white dark:text-zinc-900" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Reset Action */}
          <div className="pt-2.5 border-t border-slate-900/10 dark:border-white/10 flex justify-between items-center text-[0.75rem]">
            <button
              onClick={resetToSeedData}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center space-x-1 font-bold active:scale-[0.98] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Seed Users</span>
            </button>
            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
              7 Roles
            </span>
          </div>
        </div>
      )}

      {/* Floating Pill Button - Docked & Responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white py-2 px-3 sm:py-2.5 sm:px-4 rounded-full shadow-xl border border-zinc-800 dark:border-zinc-200 font-medium text-xs sm:text-[0.8125rem] flex items-center space-x-1.5 sm:space-x-2 active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer select-none group"
      >
        <span>🛠️</span>
        <span className="hidden sm:inline">
          User: <strong className="font-extrabold">{activeUser.displayName}</strong> ({activeUser.houseStatus} / {activeUser.systemCategory})
        </span>
        <span className="sm:hidden font-bold">
          {activeUser.displayName.split(' ')[0]} ({activeUser.systemCategory})
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full ml-0.5 sm:ml-1 shadow-sm flex-shrink-0"
          style={{ backgroundColor: activeTierInfo.hexColor }}
        />
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
        ) : (
          <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />
        )}
      </button>
    </div>
  );
};

