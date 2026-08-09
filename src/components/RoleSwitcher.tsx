import React from 'react';
import { useAuth } from '../context/AuthContext';
import { evaluateTier } from '../utils/tierEvaluator';
import { Users, CheckCircle2 } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { allUsers, activeUser, switchUserById } = useAuth();

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-900/55 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-900/10 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-zinc-900 dark:bg-zinc-100 rounded-xl text-white dark:text-zinc-900 shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Role & Profile Switcher (Dev Context)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Select any profile to instantly switch authorization tier, category, and dues profile
            </p>
          </div>
        </div>

        <span className="text-xs bg-slate-900/5 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 font-bold px-3 py-1 rounded-full border border-slate-900/10 dark:border-white/10">
          {allUsers.length} Seed Profiles
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {allUsers.map((user) => {
          const tierInfo = evaluateTier(user);
          const isActive = user.id === activeUser.id;
          const totalTarget = (user?.targets?.maintenance ?? 15000) + (user?.targets?.feeding ?? 10000);

          return (
            <button
              key={user.id}
              onClick={() => switchUserById(user.id)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98] cursor-pointer select-none flex flex-col justify-between relative group ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md'
                  : 'bg-slate-900/5 dark:bg-black/40 hover:bg-slate-900/10 dark:hover:bg-white/5 border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-2.5 right-2.5 text-white dark:text-zinc-900">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full object-cover shadow-sm"
                    style={{ border: `2px solid ${tierInfo.hexColor}` }}
                  />
                  <div>
                    <div className="font-bold text-xs truncate max-w-[110px]" title={user.displayName}>
                      {user.displayName}
                    </div>
                    <div className="text-[10px] font-mono opacity-80">
                      {user.stateCode}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 my-1.5">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-zinc-900 shadow-2xs"
                    style={{ backgroundColor: tierInfo.hexColor }}
                  >
                    Tier {user.tier}
                  </span>
                  <span className={`text-[10px] font-medium opacity-80 truncate ${isActive ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {user.houseStatus}
                  </span>
                </div>

                <p className={`text-[11px] mt-1 line-clamp-1 ${isActive ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {user.serviceUnit}
                </p>
              </div>

              <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${isActive ? 'border-white/20 dark:border-black/20' : 'border-slate-900/10 dark:border-white/10'}`}>
                <span className={isActive ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'}>Targets:</span>
                <span className={`font-bold ${isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'}`}>
                  ₦{totalTarget.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
