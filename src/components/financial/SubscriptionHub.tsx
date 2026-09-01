import React, { useRef, useEffect } from 'react';
import { CorperProfile } from '../../types/corper';
import { MonthLedgerEntry } from '../../types/ledger';
import { CircularGauge } from './CircularGauge';
import { Coins, Upload, Calendar, FileText } from 'lucide-react';
import { calculateWaterfallDues, getCurrentActiveLedgerMonth } from '../../utils/duesCalculator';

interface SubscriptionHubProps {
  activeUser: CorperProfile;
  ledgerEntries: MonthLedgerEntry[];
  selectedMonthKey: string;
  onSelectMonthKey: (monthKey: string) => void;
  onOpenUploadModal?: (monthKey?: string) => void;
  onOpenMonthDetails?: (entry: MonthLedgerEntry) => void;
  isReadOnly?: boolean;
}

export const SubscriptionHub: React.FC<SubscriptionHubProps> = ({
  activeUser,
  ledgerEntries,
  selectedMonthKey,
  onSelectMonthKey,
  onOpenUploadModal,
  onOpenMonthDetails,
  isReadOnly = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const selectedBtnRef = useRef<HTMLButtonElement>(null);

  // Find current active month entry matching monthKey or monthKey-year
  const activeMonthInfo = getCurrentActiveLedgerMonth();
  const currentMonthEntry =
    ledgerEntries.find(
      (e) => `${e.monthKey}-${e.year}` === selectedMonthKey || e.monthKey === selectedMonthKey
    ) ||
    ledgerEntries.find((e) => e.monthKey === activeMonthInfo.monthCode && e.year === activeMonthInfo.year) ||
    ledgerEntries[0];

  useEffect(() => {
    if (selectedBtnRef.current && trackRef.current) {
      selectedBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedMonthKey]);

  const maintTarget = currentMonthEntry.maintenanceTarget || activeUser?.targets?.maintenance || 15000;
  const feedTarget = currentMonthEntry.feedingTarget ?? activeUser?.targets?.feeding ?? 10000;

  // Calculate total paid in this month from current month entry or waterfall calculation
  const totalMonthPaidRaw = (currentMonthEntry.maintenancePaid || 0) + (currentMonthEntry.feedingPaid || 0);

  const waterfall = calculateWaterfallDues(totalMonthPaidRaw, activeUser);

  const maintPaid = waterfall.maintPaid;
  const feedPaid = waterfall.feedPaid;
  const totalAssessed = maintTarget + feedTarget;
  const totalPaid = waterfall.totalPaid;

  const isExempt =
    Boolean(activeUser.isExempted) ||
    activeUser.systemCategory === 'admin' ||
    activeUser.systemCategory === 'tripartite' ||
    activeUser.houseStatus === 'Tripartite' ||
    activeUser.houseStatus === 'Admin' ||
    activeUser.houseStatus === 'Delegate';

  const isGee = activeUser.houseStatus === 'Gee';

  // Maintenance Status
  let maintBadgeText = 'Unsettled';
  let maintStatus: 'paid' | 'pending' | 'unpaid' | 'upcoming' = 'unpaid';

  if (isExempt) {
    maintBadgeText = 'Exempt';
    maintStatus = 'paid';
  } else if (maintPaid >= maintTarget && maintTarget > 0) {
    maintBadgeText = 'Fully Settled';
    maintStatus = 'paid';
  } else if (maintPaid > 0) {
    maintBadgeText = 'Partially Settled';
    maintStatus = 'pending';
  } else if (currentMonthEntry.status === 'pending') {
    maintBadgeText = 'Under Review';
    maintStatus = 'pending';
  } else if (currentMonthEntry.status === 'upcoming') {
    maintBadgeText = 'Upcoming';
    maintStatus = 'upcoming';
  } else {
    maintBadgeText = 'Unsettled';
    maintStatus = 'unpaid';
  }

  // Feeding Status
  let feedBadgeText = 'Unsettled';
  let feedStatus: 'paid' | 'pending' | 'unpaid' | 'upcoming' = 'unpaid';

  if (isExempt || feedTarget === 0) {
    feedBadgeText = feedTarget === 0 ? 'Tripartite Exempt' : 'Exempt';
    feedStatus = 'paid';
  } else if (feedPaid >= feedTarget) {
    feedBadgeText = 'Fully Settled';
    feedStatus = 'paid';
  } else if (feedPaid > 0) {
    feedBadgeText = 'Partially Settled';
    feedStatus = 'pending';
  } else if (currentMonthEntry.status === 'pending') {
    feedBadgeText = 'Under Review';
    feedStatus = 'pending';
  } else if (currentMonthEntry.status === 'upcoming') {
    feedBadgeText = 'Upcoming';
    feedStatus = 'upcoming';
  } else {
    feedBadgeText = 'Unsettled';
    feedStatus = 'unpaid';
  }

  const isFeedingSubsidized =
    !isExempt &&
    !isGee &&
    (activeUser.serviceUnit.toLowerCase().includes('welfare') ||
      activeUser.serviceUnit.toLowerCase().includes('kitchen') ||
      activeUser.houseStatus === 'Executive' ||
      activeUser.houseStatus === 'Room Gov');

  const formattedMonthHeader = `${currentMonthEntry.monthName} ${currentMonthEntry.year}`;

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-3xl p-4 sm:p-6 transition-all duration-300 space-y-5">
      
      {/* 1. Header with Active Context Title */}
      <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-2xl bg-zinc-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-inner">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black leading-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Subscription — {formattedMonthHeader}</span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Interactive payment engine & rolling glass ledger
            </p>
          </div>
        </div>

        {/* <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="px-3 py-1 text-xs font-extrabold tracking-wide rounded-full border backdrop-blur-md shadow-2xs bg-white/70 border-slate-300 text-zinc-900 dark:bg-white/10 dark:border-white/15 dark:text-zinc-100 font-mono">
            TIER {activeUser.tier} • {activeUser.systemCategory.toUpperCase()}
          </span>
        </div> */}
      </div>

      {/* 2. Unified Rolling Glass Ledger Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 px-1">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Rolling Ledger Timeline
          </span>
          <span className="text-[10px] text-zinc-500 font-normal">
            Tap node to view gauge
          </span>
        </div>

        {/* Rolling Glass Segmented Track */}
        <div
          ref={trackRef}
          className="flex items-center gap-2 p-1.5 bg-slate-900/10 dark:bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-x-auto scrollbar-none snap-x focus:outline-none scroll-smooth"
        >
          {ledgerEntries.map((entry, idx) => {
            const entryKey = `${entry.monthKey}-${entry.year}`;
            const isSelected =
              selectedMonthKey === entryKey ||
              (selectedMonthKey === entry.monthKey && entry.year === currentMonthEntry.year);

            const showYearAnchor = idx === 0 || ledgerEntries[idx - 1].year !== entry.year;

            let dotClass = 'bg-slate-400/30';
            if (entry.status === 'paid') {
              dotClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
            } else if (entry.status === 'pending') {
              dotClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
            } else if (entry.status === 'unpaid') {
              dotClass = 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,113,0.8)]';
            }

            return (
              <React.Fragment key={entryKey}>
                {showYearAnchor && (
                  <div className="px-2.5 py-1 text-[10px] font-bold tracking-widest bg-white/10 text-slate-700 dark:text-zinc-300 rounded-lg shrink-0 border border-white/15 font-mono select-none">
                    {entry.year}
                  </div>
                )}
                <button
                  ref={isSelected ? selectedBtnRef : null}
                  type="button"
                  onClick={() => onSelectMonthKey(entryKey)}
                  className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider shrink-0 transition-all duration-200 active:scale-95 cursor-pointer select-none font-mono ${
                    isSelected
                      ? 'bg-white/25 dark:bg-white/15 border border-white/40 text-zinc-900 dark:text-white shadow-md scale-105 backdrop-blur-md font-black'
                      : 'hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-transparent'
                  }`}
                  title={`${entry.monthName} ${entry.year}: ${entry.status.toUpperCase()}`}
                >
                  <span>{entry.monthKey}</span>
                  <span className={`w-1 h-1 rounded-full mt-1 ${dotClass}`} />
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Circular Gauges Section */}
      <div className="flex flex-row items-center justify-around gap-2 sm:gap-4 my-2 min-w-0">
        {isExempt ? (
          <CircularGauge
            title="Dues Assessment"
            subtitle="Exempted Role"
            currentPaid={0}
            targetAmount={0}
            status="paid"
            statusBadgeText="Exempted"
          />
        ) : isGee ? (
          /* Single Gauge for Gees: "Full Assessment" */
          <CircularGauge
            title="Full Assessment"
            subtitle="House Dues"
            currentPaid={maintPaid}
            targetAmount={15000}
            status={maintStatus}
            statusBadgeText={maintBadgeText}
          />
        ) : (
          /* Standard Dual Gauges */
          <>
            <CircularGauge
              title="Maintenance Dues"
              subtitle="House Care (₦15,000)"
              currentPaid={maintPaid}
              targetAmount={maintTarget}
              status={maintStatus}
              statusBadgeText={maintBadgeText}
            />

            <CircularGauge
              title="Feeding Dues"
              subtitle={
                feedTarget === 0
                  ? 'Exempted'
                  : isFeedingSubsidized
                  ? 'Subsidized (₦5,000)'
                  : 'Standard Rate (₦10,000)'
              }
              currentPaid={feedPaid}
              targetAmount={feedTarget}
              status={feedStatus}
              statusBadgeText={feedBadgeText}
              isSubsidized={isFeedingSubsidized}
            />
          </>
        )}
      </div>

      {/* 4. Assessed Target Banner & Action Triggers */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 mb-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono truncate max-w-full">
              <span className="hidden xs:inline">ASSESSED TARGET FOR {currentMonthEntry.monthName.toUpperCase()} '{currentMonthEntry.year.toString().slice(-2)}</span>
              <span className="xs:hidden">ASSESSED TARGET ({currentMonthEntry.monthKey} '{currentMonthEntry.year.toString().slice(-2)})</span>
            </span>
            <span
              className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                isExempt
                  ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  : waterfall.paymentStatus === 'Maint ONLY'
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30'
                  : waterfall.paymentStatus === 'Fully Paid'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  : waterfall.paymentStatus === 'Partially Paid'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                  : currentMonthEntry.status === 'pending'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                  : 'bg-rose-950/80 text-rose-400 border-rose-500/30'
              }`}
            >
              {isExempt
                ? 'EXEMPT'
                : waterfall.paymentStatus === 'Maint ONLY'
                ? 'MAINT ONLY'
                : waterfall.paymentStatus === 'Fully Paid'
                ? 'FULLY PAID'
                : waterfall.paymentStatus === 'Partially Paid'
                ? 'PARTIALLY PAID'
                : currentMonthEntry.status === 'pending'
                ? 'UNDER REVIEW'
                : 'UNPAID'}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              ₦{totalPaid.toLocaleString()}
            </span>
            <span className="text-sm font-mono text-zinc-400 font-bold">
              / ₦{totalAssessed.toLocaleString()} TARGET
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-1">
            {isExempt ? (
              <span className="text-emerald-400 font-semibold">Corper is exempted from paying dues.</span>
            ) : isGee ? (
              <span>Full Assessment Target: <span className="text-white font-mono font-bold">₦15,000</span></span>
            ) : (
              <span>Maintenance: <span className="text-white font-mono font-bold">₦{maintTarget.toLocaleString()}</span> • Welfare: <span className="text-white font-mono font-bold">₦{feedTarget.toLocaleString()}</span></span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {onOpenMonthDetails && (
            <button
              type="button"
              onClick={() => onOpenMonthDetails(currentMonthEntry)}
              className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] cursor-pointer min-h-[44px]"
            >
              <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>Inspect Month Ledger</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
