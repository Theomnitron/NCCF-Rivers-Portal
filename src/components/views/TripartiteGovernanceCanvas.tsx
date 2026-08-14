import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { evaluateTier } from '../../utils/tierEvaluator';
import { isValidStateCode } from '../../utils/sanitizers';
import { shouldDisplayUnit, formatServiceUnitText } from '../../utils/unitHelpers';
import { MemberPortalCanvas } from './MemberPortalCanvas';
import { ApprovalsView } from '../approvals/ApprovalsView';
import { AnnouncementsTab } from '../announcements/AnnouncementsTab';
import { HrDashboardOverview } from '../dashboard/HrDashboardOverview';
import { SaturdayCronCelebrationsWidget } from '../admin/SaturdayCronCelebrationsWidget';
import { CorperRosterTable } from '../admin/CorperRosterTable';
import { CorperFullProfileModal } from '../admin/CorperFullProfileModal';
import { RevealOnScroll } from '../common/RevealOnScroll';
import { CorperProfile } from '../../types/corper';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Check,
  X,
  Send,
  GraduationCap,
  Home,
  Clock,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';

export const TripartiteGovernanceCanvas: React.FC<{ currentTab?: string; onNavigateTab?: (tab: string) => void }> = ({
  currentTab = 'dashboard',
  onNavigateTab,
}) => {
  const { allUsers, activeUser } = useAuth();
  const tierInfo = evaluateTier(activeUser);
  const isStateCodeValid = isValidStateCode(activeUser.stateCode);

  // Search & Filters for Roster
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Interactive Travel Permit Queue State
  const [travelPermits, setTravelPermits] = useState([
    {
      id: 'TP-201',
      corperName: 'Samuel D. (Samuel Danladi)',
      stateCode: 'RV/24B/0150',
      destination: 'Kaduna State (Family Emergency)',
      departureDate: '2026-07-28',
      returnDate: '2026-08-05',
      status: 'Pending Executive Sign-off',
    },
    {
      id: 'TP-202',
      corperName: 'David D. (David Dogara)',
      stateCode: 'RV/24A/0200',
      destination: 'Abuja FCT (NYSC Orientation Duties)',
      departureDate: '2026-08-01',
      returnDate: '2026-08-08',
      status: 'Pending Executive Sign-off',
    },
  ]);

  // Interactive Dues Waiver Queue State
  const [waiverRequests, setWaiverRequests] = useState([
    {
      id: 'WR-501',
      corperName: 'Blessing A. (Blessing Adeleke)',
      stateCode: 'RV/24C/0102',
      reason: 'Welfare Duty Subsidy Rate Verification',
      requestedTarget: '₦20,000 → ₦15,000',
      status: 'Pending Executive Approval',
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<CorperProfile | null>(null);

  if (currentTab === 'approvals') {
    return <ApprovalsView />;
  }

  if (currentTab === 'announcements') {
    return <AnnouncementsTab />;
  }

  if (currentTab === 'requests' || currentTab === 'settings') {
    return <MemberPortalCanvas currentTab={currentTab} />;
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprovePermit = (id: string) => {
    setTravelPermits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Approved by State Executive' } : p))
    );
    showToast(`Travel Permit ${id} Approved by Executive Council`);
  };

  const handleDeclinePermit = (id: string) => {
    setTravelPermits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Declined' } : p))
    );
    showToast(`Travel Permit ${id} Declined`);
  };

  const handleApproveWaiver = (id: string) => {
    setWaiverRequests((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'Waiver Granted' } : w))
    );
    showToast(`Dues Waiver ${id} Approved`);
  };

  const handleDeclineWaiver = (id: string) => {
    setWaiverRequests((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'Waiver Rejected' } : w))
    );
    showToast(`Dues Waiver ${id} Rejected`);
  };

  // Filtered Roster for Executive Review
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.stateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.roomName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || u.houseStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Telemetry Metrics
  const totalCorpers = allUsers.length;
  const totalAssessedDues = allUsers.reduce(
    (acc, u) => acc + (u?.targets?.maintenance ?? 15000) + (u?.targets?.feeding ?? 10000),
    0
  );
  const pendingPermitsCount = travelPermits.filter(
    (p) => p.status.includes('Pending')
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-zinc-900 text-white shadow-xl text-xs sm:text-sm font-bold flex items-center space-x-2 border border-zinc-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tripartite Executive Identity Profile Header */}
      <RevealOnScroll delay={0.05}>
        <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
              {/* Avatar image with Gold Tripartite border accent */}
              <div className="relative flex-shrink-0 cursor-pointer">
                <img
                  src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250'}
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
                    Welcome, {activeUser.firstName} {activeUser.lastName}
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

                {/* Desktop State Code & Post */}
                <div className="hidden sm:flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="font-mono bg-white/60 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 px-2.5 py-0.5 rounded-md font-bold border border-slate-300/80 dark:border-white/15 backdrop-blur-md">
                    {activeUser.stateCode}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {activeUser.executivePost || (activeUser.systemCategory === 'tripartite' ? activeUser.roomName : `${activeUser.roomName} Room`)}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <span className="text-[11px] font-bold tracking-wide bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {activeUser.hasTripartitePrivileges
                      ? 'DELEGATED AUTHORITY'
                      : 'SPECIAL AUTHORITY'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* HR Operational Overview Dashboard */}
      <HrDashboardOverview onNavigateTab={onNavigateTab} />

      {/* Saturday Birthday Cron Celebrations Widget */}
      <RevealOnScroll delay={0.15}>
        <SaturdayCronCelebrationsWidget />
      </RevealOnScroll>

      {/* Tripartite Executive GENCO & House Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. GENCO Info Card */}
        <RevealOnScroll delay={0.2}>
          <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl py-5 px-5 sm:px-6 transition-all duration-200 h-full">
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
        <RevealOnScroll delay={0.25}>
          <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl py-5 px-5 sm:px-6 transition-all duration-200 h-full">
            <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 mb-3.5 flex flex-col xs:flex-row xs:items-center justify-between gap-2 items-start">
              <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
                <Home className="w-5 h-5 text-zinc-800 dark:text-zinc-200 flex-shrink-0" />
                <span>House Info</span>
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

              {activeUser.houseStatus === 'Executive' && activeUser.systemCategory === 'tripartite' ? (
                <div className="flex flex-col xs:flex-row xs:items-center justify-between py-1.5 border-b border-slate-900/10 dark:border-white/10 gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">Service Unit</span>
                  <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-lg text-xs font-bold tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 backdrop-blur-sm uppercase">
                    TRIPARTITE
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
                <span className="w-fit inline-block px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border backdrop-blur-md shadow-2xs bg-white/60 border-slate-300/80 text-slate-800 dark:bg-white/10 dark:border-white/15 dark:text-zinc-100">
                  {activeUser.presence}
                </span>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>

      {/* Read-Only Statewide Corper Roster & Telemetry Directory */}
      <RevealOnScroll delay={0.3}>
        <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 space-y-4 transition-all duration-200">
          <CorperRosterTable
            users={allUsers}
            readOnly={true}
            onViewProfile={(user) => setViewingProfileUser(user)}
          />
        </div>
      </RevealOnScroll>

      {/* Stripped Full Profile Modal for Tripartite Users */}
      {viewingProfileUser && (
        <CorperFullProfileModal
          user={viewingProfileUser}
          readOnly={true}
          onClose={() => setViewingProfileUser(null)}
        />
      )}
    </div>
  );
};
