import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import { getStoredUserLedger } from '../../data/initialLedger';
import { calculateWaterfallDues, getCurrentActiveLedgerMonth } from '../../utils/duesCalculator';
import { TIER_DEFINITIONS } from '../../utils/tierEvaluator';
import { RevealOnScroll } from '../common/RevealOnScroll';
import { ALL_SERVICE_UNITS } from '../../types/corper';
import {
  Users,
  Coins,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plane,
  Building,
  Layers,
  Sparkles,
} from 'lucide-react';

const SERVICE_UNITS_LIST = ALL_SERVICE_UNITS;

interface HrDashboardOverviewProps {
  onNavigateTab?: (tab: string) => void;
}

export const HrDashboardOverview: React.FC<HrDashboardOverviewProps> = ({ onNavigateTab }) => {
  const { allUsers } = useAuth();
  const { duesSubmissions, travelRequests, profileRequests, pendingRegistrations } = useRequests();

  // Active financial month derived dynamically from real-life date
  const { monthCode: activeMonthCode, year: activeYear, activeMonthLabel, monthName: activeMonthName } = getCurrentActiveLedgerMonth();

  // Filter non-admin and non-exempt corpers for dues calculation
  const memberCorpers = allUsers.filter(
    (u) =>
      !u.isExempted &&
      u.systemCategory !== 'admin' &&
      u.systemCategory !== 'tripartite' &&
      u.houseStatus !== 'Admin' &&
      u.houseStatus !== 'Tripartite' &&
      u.houseStatus !== 'Delegate'
  );
  const totalMemberCorpers = memberCorpers.length;

  // Single-Month Financial Engine Calculations
  let fullyPaidCount = 0;
  let maintOnlyCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;
  let totalRevenueCollectedAugust = 0;

  memberCorpers.forEach((user) => {
    const userLedger = getStoredUserLedger(user, duesSubmissions);
    // Strict isolation: filter for active month entry ONLY
    const augEntry = userLedger.find(
      (e) => e.year === activeYear && (e.monthKey === activeMonthCode || e.monthName === activeMonthName)
    );

    if (augEntry) {
      const totalPaidAug = (augEntry.maintenancePaid || 0) + (augEntry.feedingPaid || 0);

      // Accumulate strict active month revenue (no bleed from past/future)
      totalRevenueCollectedAugust += totalPaidAug;

      const waterfall = calculateWaterfallDues(totalPaidAug, user);
      if (waterfall.isTripartiteExempt || waterfall.targetTotal === 0) {
        // Exempt user - do not count towards unpaid
      } else if (waterfall.paymentStatus === 'Fully Paid') {
        fullyPaidCount += 1;
      } else if (waterfall.paymentStatus === 'Maint ONLY') {
        maintOnlyCount += 1;
      } else if (waterfall.paymentStatus === 'Partially Paid') {
        partiallyPaidCount += 1;
      } else {
        unpaidCount += 1;
      }
    } else {
      unpaidCount += 1;
    }
  });

  // Headcount & Presence Split
  const presentCount = allUsers.filter((u) => u.presence === 'Present').length;
  const travelledCount = allUsers.filter((u) => u.presence === 'Travelled').length;

  // Pending Governance Queue Count
  const pendingDuesCount = duesSubmissions.filter((d) => d.status === 'pending').length;
  const pendingTravelCount = travelRequests.filter((t) => t.status === 'pending').length;
  const pendingProfileCount = profileRequests.filter((p) => p.status === 'pending').length;
  const pendingRegistrationsCount = (pendingRegistrations || []).filter((r) => r.status === 'pending').length;
  const totalPendingQueue = pendingDuesCount + pendingTravelCount + pendingProfileCount + pendingRegistrationsCount;

  // Population Breakdown By Governance Tier
  const tierBreakdown = [
    {
      label: 'Executive',
      count: allUsers.filter((u) => u.houseStatus === 'Executive' || u.systemCategory === 'tripartite').length,
      bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    },
    {
      label: 'Gee',
      count: allUsers.filter((u) => u.houseStatus === 'Gee').length,
      bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    {
      label: 'Room Gov',
      count: allUsers.filter((u) => u.houseStatus === 'Room Gov').length,
      bg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
    },
    {
      label: 'Delegate',
      count: allUsers.filter((u) => u.houseStatus === 'Delegate').length,
      bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
    {
      label: 'Member',
      count: allUsers.filter((u) => u.houseStatus === 'Member' && u.systemCategory === 'member').length,
      bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
    },
  ];

  // Population Breakdown By Service Unit
  const unitBreakdown = SERVICE_UNITS_LIST.map((unitName) => {
    const count = allUsers.filter((u) => {
      if (Array.isArray(u.serviceUnits) && u.serviceUnits.some((su) => su.trim().toLowerCase() === unitName.toLowerCase())) {
        return true;
      }
      if (u.serviceUnit) {
        const parts = u.serviceUnit.split(',').map((s) => s.trim().toLowerCase());
        return parts.includes(unitName.toLowerCase());
      }
      return false;
    }).length;

    return {
      name: unitName,
      count,
    };
  });

  return (
    <div className="space-y-5">
      {/* 4 PRIMARY OPERATIONAL METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Single-Month Financial Clearance */}
        <RevealOnScroll delay={0.05}>
          <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between h-full">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  {activeMonthLabel} Dues
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono">
                ₦{totalRevenueCollectedAugust.toLocaleString()}
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Isolated Month Revenue
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 grid grid-cols-4 gap-1 text-[11px] font-mono">
              <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-1 rounded-lg text-center" title="Fully Paid">
                <span className="block font-bold leading-none">{fullyPaidCount}</span>
                <span className="text-[8px] uppercase font-sans font-medium text-emerald-600 dark:text-emerald-400">Paid</span>
              </div>
              <div className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 p-1 rounded-lg text-center" title="Maintenance Only">
                <span className="block font-bold leading-none">{maintOnlyCount}</span>
                <span className="text-[8px] uppercase font-sans font-medium text-cyan-600 dark:text-cyan-400">Maint</span>
              </div>
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-300 p-1 rounded-lg text-center" title="Partially Paid">
                <span className="block font-bold leading-none">{partiallyPaidCount}</span>
                <span className="text-[8px] uppercase font-sans font-medium text-amber-600 dark:text-amber-400">Partial</span>
              </div>
              <div className="bg-rose-500/10 text-rose-700 dark:text-rose-300 p-1 rounded-lg text-center" title="Unpaid">
                <span className="block font-bold leading-none">{unpaidCount}</span>
                <span className="text-[8px] uppercase font-sans font-medium text-rose-600 dark:text-rose-400">Unpaid</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* CARD 2: Headcount & Presence */}
        <RevealOnScroll delay={0.1}>
          <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between h-full">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Family House Headcount
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {totalMemberCorpers} <span className="text-xs font-normal text-zinc-500">Corpers</span>
              </div>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                Active Resident Roster
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-1.5 rounded-lg flex items-center justify-between px-2">
                <span className="text-[10px] font-sans font-bold">Present</span>
                <span className="font-black text-xs">{presentCount}</span>
              </div>
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-300 p-1.5 rounded-lg flex items-center justify-between px-2">
                <span className="text-[10px] font-sans font-bold">Travelled</span>
                <span className="font-black text-xs">{travelledCount}</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* CARD 3: Pending Governance Queue */}
        <RevealOnScroll delay={0.15}>
          <div
            onClick={() => onNavigateTab?.('approvals')}
            className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between h-full cursor-pointer hover:border-amber-500/50 hover:shadow-lg transition-all active:scale-[0.99] group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigateTab?.('approvals');
              }
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Pending Approvals
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono flex items-center space-x-2">
                <span>{totalPendingQueue}</span>
                {totalPendingQueue > 0 && (
                  <span className="text-[10px] font-sans font-bold bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full uppercase animate-pulse">
                    Action Needed
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Pending Clearances & Requests • Click to Open Approvals
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-900/5 dark:bg-white/5 whitespace-nowrap">
                Dues: <b className="text-zinc-900 dark:text-white">{pendingDuesCount}</b>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900/5 dark:bg-white/5 whitespace-nowrap">
                Travel: <b className="text-zinc-900 dark:text-white">{pendingTravelCount}</b>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900/5 dark:bg-white/5 whitespace-nowrap">
                Profile: <b className="text-zinc-900 dark:text-white">{pendingProfileCount}</b>
              </span>
              <span className={`px-1.5 py-0.5 rounded whitespace-nowrap ${pendingRegistrationsCount > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30' : 'bg-slate-900/5 dark:bg-white/5'}`}>
                Admissions: <b className={pendingRegistrationsCount > 0 ? 'text-amber-800 dark:text-amber-200' : 'text-zinc-900 dark:text-white'}>{pendingRegistrationsCount}</b>
              </span>
            </div>
          </div>
        </RevealOnScroll>

        {/* CARD 4: Active Ledger Indicator */}
        <RevealOnScroll delay={0.2}>
          <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between h-full">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400">
                  Active Financial Month
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                {activeMonthLabel}
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-medium">
                Single-Month Ledger Engine
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-purple-500" />
                <span>Verified: Today</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                Isolated
              </span>
            </div>
          </div>
        </RevealOnScroll>

      </div>

      {/* POPULATION BREAKDOWN GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* GRID 1: Role-Tier Population Distribution */}
        <RevealOnScroll delay={0.25}>
          <div className="bg-white/60 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md rounded-2xl p-4 sm:p-5 space-y-3 h-full">
            <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Role-Tier Population Distribution</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">Total: {allUsers.length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.values(TIER_DEFINITIONS).map((t) => {
                const count = allUsers.filter((u) => u.tier === t.tier).length;
                return (
                  <div
                    key={t.tier}
                    className="p-2 rounded-xl border border-slate-900/10 dark:border-white/5 bg-slate-900/5 dark:bg-black/50 shadow-inner flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-2xs"
                        style={{ backgroundColor: t.hexColor }}
                      />
                      <span className="text-[9px] font-bold font-mono text-zinc-600 dark:text-zinc-400">
                        T{t.tier}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-zinc-900 dark:text-white mt-1 truncate" title={t.badgeText}>
                      {t.badgeText}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </RevealOnScroll>

        {/* GRID 2: By Service Unit Health */}
        <RevealOnScroll delay={0.3}>
          <div className="bg-white/60 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md rounded-2xl p-4 sm:p-5 space-y-3 h-full">
            <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-500" />
                <span>Service Units Population Distribution</span>
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">{SERVICE_UNITS_LIST.length} Units</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {unitBreakdown.map((unit) => (
                <div
                  key={unit.name}
                  className="p-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 flex items-center justify-between px-2.5"
                >
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate pr-1">
                    {unit.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-[11px]">
                    {unit.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>

      </div>
    </div>
  );
};
