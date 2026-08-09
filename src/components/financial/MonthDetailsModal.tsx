import React from 'react';
import { MonthLedgerEntry } from '../../types/ledger';
import {
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  Upload,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';

interface MonthDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: MonthLedgerEntry | null;
  onOpenUploadModal: (monthKey: string) => void;
}

export const MonthDetailsModal: React.FC<MonthDetailsModalProps> = ({
  isOpen,
  onClose,
  entry,
  onOpenUploadModal,
}) => {
  if (!isOpen || !entry) return null;

  const totalTarget = entry.maintenanceTarget + entry.feedingTarget;
  const totalPaid = entry.maintenancePaid + entry.feedingPaid;

  let statusBadge = {
    bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
    icon: CalendarDays,
    label: 'Upcoming Month',
  };

  if (entry.status === 'paid') {
    statusBadge = {
      bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'Paid & Confirmed',
    };
  } else if (entry.status === 'pending') {
    statusBadge = {
      bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: Clock,
      label: 'Receipt Under Review / Pending',
    };
  } else if (entry.status === 'unpaid') {
    statusBadge = {
      bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
      icon: AlertCircle,
      label: 'Unpaid / Action Required',
    };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white/80 dark:bg-zinc-900/90 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 overflow-hidden transition-all text-zinc-900 dark:text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900/10 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-zinc-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                {entry.monthName} 2026 Ledger Breakdown
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                Month Key: {entry.monthKey}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm">
          
          {/* Status Badge Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${statusBadge.bg}`}>
            <div className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5 flex-shrink-0" />
              <span className="font-extrabold text-xs uppercase tracking-wider">
                {statusBadge.label}
              </span>
            </div>
            <span className="text-xs font-mono font-bold">
              ₦{totalPaid.toLocaleString()} / ₦{totalTarget.toLocaleString()}
            </span>
          </div>

          {/* Breakdown Items */}
          <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Maintenance Dues:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-white">
                ₦{entry.maintenancePaid.toLocaleString()} / ₦{entry.maintenanceTarget.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Feeding Dues:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-white">
                ₦{entry.feedingPaid.toLocaleString()} / ₦{entry.feedingTarget.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-bold">
              <span className="text-zinc-900 dark:text-white uppercase tracking-wider text-xs">Total Assessed:</span>
              <span className="font-mono text-base text-zinc-900 dark:text-white">
                ₦{totalPaid.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Transaction Metadata */}
          {entry.transactionId && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-medium">Transaction Ref ID:</span>
                <span className="font-mono font-bold text-emerald-400">{entry.transactionId}</span>
              </div>
              {entry.submittedAt && (
                <div className="flex justify-between items-center text-[11px] text-zinc-400">
                  <span>Submitted Date:</span>
                  <span className="font-mono">{entry.submittedAt}</span>
                </div>
              )}
              {entry.receiptFileName && (
                <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">
                  <span>Receipt File:</span>
                  <span className="font-mono text-zinc-200 underline truncate max-w-[180px]">
                    {entry.receiptFileName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center">
            <button
              onClick={onClose}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
