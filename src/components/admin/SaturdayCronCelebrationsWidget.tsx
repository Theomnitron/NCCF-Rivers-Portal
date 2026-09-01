import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CorperProfile } from '../../types/corper';
import { Clock, RefreshCw, CheckCircle2, Cake, Sparkles, Home, Shield, Award, Calendar } from 'lucide-react';
import { evaluateTier, formatTruncatedName, getShortRoleTitle } from '../../utils/tierEvaluator';

export const SaturdayCronCelebrationsWidget: React.FC = () => {
  const { allUsers } = useAuth();
  const [isSimulatingCron, setIsSimulatingCron] = useState(false);
  const [cronResult, setCronResult] = useState<{
    timestamp: string;
    auditedCorpers: number;
    remindersSent: number;
    birthdaysFound: number;
  } | null>(null);

  // Target 7-Day Window Calculation ([today, today+6])
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matches: Array<{
      user: CorperProfile;
      birthdayDate: Date;
      formattedDate: string;
      isExactMatch: boolean;
      daysAway: number;
    }> = [];

    allUsers.forEach((user) => {
      if (!user.dateOfBirth) return;
      const parts = user.dateOfBirth.split('-');
      if (parts.length < 3) return;
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const day = parseInt(parts[2], 10);

      // Check each of the 7 days in the [today, today+6] window
      for (let i = 0; i < 7; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        if (testDate.getMonth() === month && testDate.getDate() === day) {
          const dayName = testDate.toLocaleDateString('en-US', { weekday: 'long' });
          const monthName = testDate.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = testDate.getDate();
          matches.push({
            user,
            birthdayDate: testDate,
            formattedDate: i === 0 ? `Today (${dayName}, ${monthName} ${dayNum})` : i === 1 ? `Tomorrow (${dayName}, ${monthName} ${dayNum})` : `${dayName}, ${monthName} ${dayNum}`,
            isExactMatch: true,
            daysAway: i,
          });
          break;
        }
      }
    });

    matches.sort((a, b) => a.birthdayDate.getTime() - b.birthdayDate.getTime());
    return matches;
  }, [allUsers]);

  const handleRunSaturdayCron = () => {
    setIsSimulatingCron(true);
    setCronResult(null);

    setTimeout(() => {
      setIsSimulatingCron(false);
      setCronResult({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        auditedCorpers: allUsers.length,
        remindersSent: Math.floor(allUsers.length * 0.4),
        birthdaysFound: upcomingBirthdays.length,
      });
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Card: Saturday Cron Automated Engine */}
      <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Birthday Fetcher & Audit Engine
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Automated weekly analyzer {/* executed every Saturday at 23:59 UTC+1 */}
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-500/20">
              ACTIVE
            </span>
          </div>

          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
            The system automatically scans for corpers celebrating their birthdays within the rolling 7-day window (today through the next 6 days).
          </p>

          {cronResult && (
            <div className="p-3.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 space-y-1.5 mb-4 animate-fadeIn">
              <div className="flex items-center space-x-2 text-xs font-bold text-zinc-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Fetch Executed at {cronResult.timestamp}</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 grid grid-cols-2 gap-2 font-mono pt-1">
                <div>
                  <span className="block font-bold text-zinc-900 dark:text-white">{cronResult.auditedCorpers}</span>
                  <span>Audited Corp Members</span>
                </div>
                <div>
                  <span className="block font-bold text-zinc-900 dark:text-white">{cronResult.birthdaysFound}</span>
                  <span>Upcoming Birthdays</span>
                </div>
                {/* <div>
                  <span className="block font-bold text-zinc-900 dark:text-white">{cronResult.remindersSent}</span>
                  <span>Dispatched SMS</span>
                </div> */}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleRunSaturdayCron}
          disabled={isSimulatingCron}
          className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer select-none"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulatingCron ? 'animate-spin' : ''}`} />
          <span>{isSimulatingCron ? 'Fetching and Auditing...' : 'Fetch Birthdays and Audit Records'}</span>
        </button>
      </div>

      {/* Right Card: Saturday Birthday Celebrations Card */}
      <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-start sm:items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-zinc-950 shadow-md">
                <Cake className="w-5 h-5 text-zinc-950" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5 ">
                  <span className="shrink-0">Birthday Roster</span>
                  <Sparkles className="w-4 h-4 text-amber-500 inline-block" />
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Birthdays for the week
                </p>
              </div>
            </div>
            <span className="px-3 py-1 whitespace-nowrap text-[0.7rem] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/30">
              {upcomingBirthdays.length} Celebrants
            </span>
          </div>

          <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
            {upcomingBirthdays.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-slate-900/5 dark:bg-black/40 rounded-xl border border-dashed border-slate-900/10 dark:border-white/10">
                No birthdays within the next 7 days.
              </div>
            ) : (
              upcomingBirthdays.map(({ user, formattedDate }) => {
                const tierInfo = evaluateTier(user);
                const hasExecPost = Boolean(user.executivePost && user.executivePost !== 'Member' && user.executivePost !== 'None');
                const roleBadgeText = getShortRoleTitle(user, tierInfo);

                return (
                  <div
                    key={user.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Corper Photo & Information */}
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {/* Avatar Image with tier accent border */}
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={user.displayName}
                          className="w-12 h-12 rounded-full object-cover shadow-sm"
                          style={{ border: `2px solid ${tierInfo.hexColor}` }}
                        />
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs"
                          style={{ backgroundColor: tierInfo.hexColor }}
                          title={tierInfo.categoryName}
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        {/* Full Name & Plain State Code (unpilled, bold/italic) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                            {user.displayName}
                          </span>
                          <span className="font-mono text-xs font-bold italic text-zinc-500 dark:text-zinc-400">
                            ({user.stateCode})
                          </span>
                        </div>

                        {/* Role Tier Badge (Tier Accent Color Pill) & Plain Room Name */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {/* Role Pill in Tier Accent Color */}
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-black rounded-full text-zinc-950 shadow-2xs shrink-0 select-none"
                            style={{ backgroundColor: tierInfo.hexColor }}
                          >
                            {/* {hasExecPost ? (
                              <Award className="w-3 h-3 text-zinc-950 shrink-0" />
                            ) : (
                              <Shield className="w-3 h-3 text-zinc-950 shrink-0" />
                            )} */}
                            <span className="truncate max-w-[140px] sm:max-w-[180px]">{roleBadgeText}</span>
                          </span>

                          {/* Plain Room Name Text */}
                          <span className="flex items-center space-x-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            <span className="text-zinc-400 dark:text-zinc-600">•</span>
                            <Home className="w-3 h-3 text-zinc-400 dark:text-zinc-500 inline-block" />
                            <span>{user.roomName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Exact Birthday Date Badge (Responsive full width on mobile) */}
                    <div className="flex flex-col sm:items-end justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5">
                      <div className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-600/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 shadow-2xs font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{formattedDate}</span>
                      </div>
                      <span className="hidden shrink-0 sm:block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                        🎂 Birthday Blessings!
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

