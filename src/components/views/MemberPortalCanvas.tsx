import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import { evaluateTier } from '../../utils/tierEvaluator';
import { isValidStateCode } from '../../utils/sanitizers';
import { shouldDisplayUnit, formatServiceUnitText } from '../../utils/unitHelpers';
import { SubscriptionHub } from '../financial/SubscriptionHub';
import { ReceiptUploadModal } from '../financial/ReceiptUploadModal';
import { MonthDetailsModal } from '../financial/MonthDetailsModal';
import { getLiveUserLedger, saveUserLedger } from '../../data/initialLedger';
import { MonthLedgerEntry, PaymentType } from '../../types/ledger';
import { MemberRequestsView } from '../requests/MemberRequestsView';
import { SettingsTab } from '../settings/SettingsTab';
import { AnnouncementsTab } from '../announcements/AnnouncementsTab';
import { RevealOnScroll } from '../common/RevealOnScroll';
import {
  Coins,
  Home,
  GraduationCap,
  CheckCircle2,
  FileText,
  Clock,
  Send,
  BellRing,
} from 'lucide-react';

export const MemberPortalCanvas: React.FC<{ currentTab?: string }> = ({ currentTab = 'dashboard' }) => {
  const { activeUser } = useAuth();
  const { duesSubmissions } = useRequests();
  const tierInfo = evaluateTier(activeUser);
  const isStateCodeValid = isValidStateCode(activeUser.stateCode);

  // Financial Ledger State - computed live from Supabase duesSubmissions
  const ledgerEntries = useMemo(() => {
    return getLiveUserLedger(activeUser, duesSubmissions);
  }, [activeUser, duesSubmissions]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('AUG-2026');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalInitialMonth, setUploadModalInitialMonth] = useState<string>('AUG');
  const [selectedMonthEntryForModal, setSelectedMonthEntryForModal] = useState<MonthLedgerEntry | null>(null);
  const [isMonthDetailsModalOpen, setIsMonthDetailsModalOpen] = useState(false);

  const currentMonthEntry =
    ledgerEntries.find(
      (e) => `${e.monthKey}-${e.year}` === selectedMonthKey || e.monthKey === selectedMonthKey
    ) ||
    ledgerEntries.find((e) => e.monthKey === 'AUG' && e.year === 2026) ||
    ledgerEntries[0];

  const handleOpenUploadModal = (monthKey?: string) => {
    setUploadModalInitialMonth(monthKey || selectedMonthKey);
    setIsUploadModalOpen(true);
  };

  const handleOpenMonthDetails = (entry: MonthLedgerEntry) => {
    setSelectedMonthEntryForModal(entry);
    setIsMonthDetailsModalOpen(true);
  };

  const handleUploadSuccess = (
    monthKey: string,
    paymentType: PaymentType,
    amount: number,
    transactionId: string,
    fileName: string
  ) => {
    const updated = ledgerEntries.map((entry) => {
      if (entry.monthKey !== monthKey) return entry;

      let maintPaid = entry.maintenancePaid;
      let feedPaid = entry.feedingPaid;

      if (paymentType === 'maintenance') {
        maintPaid = amount;
      } else if (paymentType === 'feeding') {
        feedPaid = amount;
      } else {
        maintPaid = entry.maintenanceTarget;
        feedPaid = Math.max(0, amount - entry.maintenanceTarget);
      }

      return {
        ...entry,
        status: 'pending' as const,
        maintenancePaid: maintPaid,
        feedingPaid: feedPaid,
        transactionId,
        receiptFileName: fileName,
        submittedAt: new Date().toLocaleString(),
        paymentType,
      };
    });

    saveUserLedger(activeUser.id, updated);
  };

  if (currentTab === 'requests') {
    return <MemberRequestsView />;
  }

  if (currentTab === 'announcements') {
    return <AnnouncementsTab />;
  }

  if (currentTab === 'settings') {
    return <SettingsTab />;
  }

  // Default: Dashboard View
  return (
    <div className="space-y-6">
      {/* Welcome Banner / Profile Hero Card */}
      <RevealOnScroll>
        <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
              {/* Avatar image with colored accent dot */}
              <div className="relative flex-shrink-0 cursor-pointer" title={`${activeUser.displayName} (${tierInfo.categoryName})`}>
                <img
                  src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                  alt={activeUser.displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm transition-transform hover:scale-105 active:scale-95 duration-150"
                  style={{ border: `3px solid ${tierInfo.hexColor}` }}
                />
                <span
                  className="absolute bottom-0 right-0 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-md"
                  style={{ backgroundColor: tierInfo.hexColor }}
                />
              </div>

              {/* Profile Info Block */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight text-zinc-900 dark:text-white">
                    Welcome, {activeUser.displayName}!
                  </h1>
                  
                  {/* Desktop Tier Badge Pill */}
                  <span
                    className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide rounded-full text-zinc-900 shadow-2xs select-none"
                    style={{ backgroundColor: tierInfo.hexColor }}
                  >
                    {tierInfo.badgeText}
                  </span>
                </div>

                {/* Mobile 2-column side-by-side row: Tier Label on Left, State Code on Right */}
                <div className="grid grid-cols-2 gap-2 mt-3 sm:hidden">
                  <div
                    className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-full text-xs font-black text-zinc-900 shadow-xs truncate select-none"
                    style={{ backgroundColor: tierInfo.hexColor }}
                  >
                    {tierInfo.badgeText}
                  </div>
                  <div className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-white/60 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 border border-slate-300/80 dark:border-white/15 truncate backdrop-blur-md">
                    {activeUser.stateCode}
                  </div>
                </div>

                {/* Desktop State Code, Room & Service Unit */}
                <div className="hidden sm:flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="font-mono bg-white/60 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 px-2.5 py-0.5 rounded-md font-bold border border-slate-300/80 dark:border-white/15 backdrop-blur-md">
                    {activeUser.stateCode}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{activeUser.houseStatus === 'Executive' ? (activeUser.executivePost || activeUser.roomName) : `${activeUser.roomName} Room` } </span>
                  {activeUser.houseStatus === 'Executive' && activeUser.systemCategory === 'member' ? (
                    <>
                      <span className="text-zinc-400 dark:text-zinc-600">•</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 backdrop-blur-sm uppercase">
                        EXECUTIVE
                      </span>
                    </>
                  ) : shouldDisplayUnit(activeUser) ? (
                    <>
                      <span className="text-zinc-400 dark:text-zinc-600">•</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        Unit: <span className="font-bold text-zinc-900 dark:text-white">{formatServiceUnitText(activeUser)}</span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Subscription Hub with Dual Hero Gauges & Rolling Glass Ledger */}
      <RevealOnScroll delay={0.1}>
        <SubscriptionHub
          activeUser={activeUser}
          ledgerEntries={ledgerEntries}
          selectedMonthKey={selectedMonthKey}
          onSelectMonthKey={setSelectedMonthKey}
          onOpenMonthDetails={handleOpenMonthDetails}
          isReadOnly={true}
        />
      </RevealOnScroll>

      {/* Modal for Month Breakdown Inspection */}
      <MonthDetailsModal
        isOpen={isMonthDetailsModalOpen}
        onClose={() => setIsMonthDetailsModalOpen(false)}
        entry={selectedMonthEntryForModal}
      />

      {/* Member Details Grid: GENCO Info & House Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. GENCO Info Card */}
        <RevealOnScroll delay={0.15}>
          <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl py-5 px-5 sm:px-6 transition-all duration-200 h-full">
            <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 mb-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-2 items-start">
              <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-zinc-800 dark:text-zinc-200 flex-shrink-0" />
                <span>GENCO Info</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Full Name</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.firstName} {activeUser.middleName} {activeUser.lastName}</span>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">State of Origin</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.stateOfOrigin} State</span>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Course Studied</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-left xs:text-right">{activeUser.courseOfStudy}</span>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">School Attended</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-left xs:text-right">{activeUser.schoolGraduatedFrom}</span>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Marital Status</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.maritalStatus}</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* 2. House Info Card */}
        <RevealOnScroll delay={0.2}>
          <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl py-5 px-5 sm:px-6 transition-all duration-200 h-full">
            <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 mb-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-2 items-start">
              <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
                <Home className="w-5 h-5 text-zinc-800 dark:text-zinc-200 flex-shrink-0" />
                <span>House Info & Others</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">House Status</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.houseStatus}</span>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Room</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.roomName} Room</span>
              </div>

              {activeUser.houseStatus === 'Executive' && activeUser.systemCategory === 'member' ? (
                <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Service Unit</span>
                  <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-lg text-xs font-bold tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 backdrop-blur-sm uppercase">
                    EXECUTIVE
                  </span>
                </div>
              ) : shouldDisplayUnit(activeUser) && (
                <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Service Unit</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatServiceUnitText(activeUser)}</span>
                </div>
              )}

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Phone Number</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.phone}</span>
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 gap-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Presence Status</span>
                <span className="w-fit inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border backdrop-blur-md shadow-2xs bg-white/60 border-slate-300/80 text-slate-800 dark:bg-white/10 dark:border-white/15 dark:text-zinc-100">
                  {activeUser.presence}
                </span>
              </div>
            </div>
          </div>
        </RevealOnScroll>

      </div>
    </div>
  );
};

