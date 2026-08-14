import React, { useState } from 'react';
import { CorperProfile } from '../../types/corper';
import { getStoredUserLedger } from '../../data/initialLedger';
import { calculateWaterfallDues } from '../../utils/duesCalculator';
import { evaluateTier } from '../../utils/tierEvaluator';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import {
  X,
  User,
  GraduationCap,
  Home,
  Edit3,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  HeartPulse,
  PhoneCall,
} from 'lucide-react';

interface CorperFullProfileModalProps {
  user: CorperProfile | null;
  onClose: () => void;
  readOnly?: boolean;
  onEditUser?: (user: CorperProfile) => void;
  onForceClearUser?: (user: CorperProfile) => void;
  onResetUser?: (user: CorperProfile) => void;
  onDeleteUser?: (user: CorperProfile) => void;
}

export const CorperFullProfileModal: React.FC<CorperFullProfileModalProps> = ({
  user,
  onClose,
  readOnly = false,
  onEditUser,
  onForceClearUser,
  onResetUser,
  onDeleteUser,
}) => {
  const { deleteCorperUser } = useAuth();
  const { duesSubmissions } = useRequests();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!user) return null;

  const tierInfo = evaluateTier(user);

  // Active month standing (August 2026)
  const userEntries = getStoredUserLedger(user, duesSubmissions);
  const activeEntry = userEntries.find(
    (e) => e.year === 2026 && (e.monthKey === 'AUG' || e.monthName === 'August')
  );

  let currentMonthDuesStatus = 'Unpaid';
  let duesBadgeClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';

  if (user.isExempted || user.houseStatus === 'Admin' || user.systemCategory === 'admin' || user.systemCategory === 'tripartite' || user.houseStatus === 'Tripartite' || user.houseStatus === 'Delegate') {
    currentMonthDuesStatus = 'Exempt';
    duesBadgeClass = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
  } else if (activeEntry) {
    const totalPaid = activeEntry.maintenancePaid + activeEntry.feedingPaid;
    const waterfall = calculateWaterfallDues(totalPaid, user);

    if (waterfall.isTripartiteExempt && waterfall.feedTarget === 0 && waterfall.maintTarget === 0) {
      currentMonthDuesStatus = 'Exempt';
      duesBadgeClass = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
    } else if (waterfall.paymentStatus === 'Fully Paid') {
      currentMonthDuesStatus = 'Fully Paid';
      duesBadgeClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    } else if (waterfall.paymentStatus === 'Maint ONLY') {
      currentMonthDuesStatus = 'Maint ONLY';
      duesBadgeClass = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
    } else if (waterfall.paymentStatus === 'Partially Paid') {
      currentMonthDuesStatus = 'Partially Paid';
      duesBadgeClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    } else {
      currentMonthDuesStatus = 'Unpaid';
      duesBadgeClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
  }

  const fullName = `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim(); // || user.displayName;

  const executeDelete = () => {
    if (onDeleteUser) {
      onDeleteUser(user);
    } else {
      deleteCorperUser(user.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover shadow-md aspect-square"
              style={{ border: `3px solid ${tierInfo.hexColor}` }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                  {user.displayName}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-900 shadow-2xs"
                  style={{ backgroundColor: tierInfo.hexColor }}
                >
                  {tierInfo.badgeText}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
                {user.stateCode} {/* • {user.systemCategory.toUpperCase()} */}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ADMIN ACTION CONTROL BAR (STRICTLY HIDDEN IF READONLY / TRIPARTITE) */}
        {!readOnly && (
          <div className="bg-slate-900/5 dark:bg-black/60 border border-slate-900/10 dark:border-white/10 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Admin Actions:
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {onEditUser && (
                <button
                  onClick={() => {
                    onEditUser(user);
                    onClose();
                  }}
                  className="px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white inline-flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              {onForceClearUser && (
                <button
                  onClick={() => {
                    onForceClearUser(user);
                    onClose();
                  }}
                  className="px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clear Sub</span>
                </button>
              )}

              {onResetUser && (
                <button
                  onClick={() => {
                    onResetUser(user);
                    onClose();
                  }}
                  className="px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Reset Sub</span>
                </button>
              )}

              {isConfirmingDelete ? (
                <div className="flex items-center space-x-2 animate-fadeIn">
                  <button
                    onClick={executeDelete}
                    className="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md inline-flex items-center space-x-1.5 transition-all cursor-pointer animate-pulse"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Corper ({user.stateCode})</span>
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-slate-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
        <div className="bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-900/10 dark:border-white/10 pb-2">
            <User className="w-4 h-4 text-sky-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              PERSONAL INFORMATION
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Full Name</span>
              <span className="font-bold text-zinc-900 dark:text-white">{fullName}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">State Code</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.stateCode}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Gender</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Email Address</span>
              <span className="font-bold text-zinc-900 dark:text-white truncate block">{user.email || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Phone Number</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Date of Birth</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.dateOfBirth || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: ACADEMIC & ORIGIN (GENCO INFO) */}
        <div className="bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-900/10 dark:border-white/10 pb-2">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              GENCO INFORMATION
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Full Name</span>
              <span className="font-bold text-zinc-900 dark:text-white">{fullName}</span>
            </div> */}
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">State of Origin</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.stateOfOrigin || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Course of Study</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.courseOfStudy || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">School Graduated From</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.schoolGraduatedFrom || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Marital Status</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.maritalStatus || 'Single'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: STATE HOUSE & GOVERNANCE (HOUSE INFO) */}
        <div className="bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-900/10 dark:border-white/10 pb-2">
            <Home className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              HOUSE PROFILE
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">House Status</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.houseStatus}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Room Name</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.roomName} Room</span>
            </div>
            {/*<div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Phone Number</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-white">{user.phone || 'N/A'}</span>
            </div> */}
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Service Unit(s)</span>
              {user.houseStatus === 'Executive' && user.systemCategory === 'member' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 backdrop-blur-sm uppercase mt-0.5">
                  EXECUTIVE
                </span>
              ) : (
                <span className="font-bold text-zinc-900 dark:text-white">{user.serviceUnit}</span>
              )}
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Presence Status</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                user.presence === 'Present'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}>
                {user.presence}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Current Month Dues Status</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${duesBadgeClass}`}>
                {currentMonthDuesStatus}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: EMERGENCY INFORMATION */}
        <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-rose-500/10 dark:border-rose-500/20 pb-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              EMERGENCY INFORMATION
            </h3>
            <span className="text-[10px] text-zinc-400 font-medium ml-auto">Emergency Purposes Only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Name of Next of Kin</span>
              <span className="font-bold text-zinc-900 dark:text-white">{user.nextOfKinName || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500 font-sans font-medium">Contact of Next of Kin</span>
              <div className="font-bold text-zinc-900 dark:text-white">
                {user.nextOfKinPhone ? (
                  <a
                    href={`tel:${user.nextOfKinPhone}`}
                    className="text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center space-x-1.5 font-mono"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                    <span>{user.nextOfKinPhone}</span>
                  </a>
                ) : (
                  <span className="text-zinc-500 font-normal">N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-white cursor-pointer"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
