import React, { useState } from 'react';
import { CorperProfile } from '../../types/corper';
import { getStoredUserLedger, saveUserLedger } from '../../data/initialLedger';
import { MonthLedgerEntry } from '../../types/ledger';
import { X, CheckCircle2, Layers, Coins, Image, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface IntentAllocationDrawerProps {
  user: CorperProfile | null;
  receiptUrl?: string;
  transactionId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IntentAllocationDrawer: React.FC<IntentAllocationDrawerProps> = ({
  user,
  receiptUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
  transactionId = 'TXN-2026-AUG-7721',
  onClose,
  onSuccess,
}) => {
  if (!user) return null;

  const userEntries = getStoredUserLedger(user);
  
  // Calculate total unpaid debt
  const unpaidEntries = userEntries.filter((e) => e.status === 'unpaid' || e.status === 'pending');
  const maintenanceDebt = unpaidEntries.reduce((acc, e) => acc + (e.maintenanceTarget - e.maintenancePaid), 0);
  const feedingDebt = unpaidEntries.reduce((acc, e) => acc + (e.feedingTarget - e.feedingPaid), 0);
  const totalDebt = maintenanceDebt + feedingDebt;

  // Amount paid in receipt
  const maintTarget = user?.targets?.maintenance ?? 15000;
  const feedTarget = user?.targets?.feeding ?? 10000;
  const defaultAmount = totalDebt > 0 ? totalDebt : (maintTarget + feedTarget);
  const [allocationAmount, setAllocationAmount] = useState<number>(defaultAmount);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C'>('B'); // B: Waterfall by default

  // Custom split inputs for Option C
  const [customMaintenance, setCustomMaintenance] = useState<number>(maintTarget);
  const [customFeeding, setCustomFeeding] = useState<number>(feedTarget);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('AUG');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleApplyAllocation = () => {
    setIsSubmitting(true);

    let updatedLedger: MonthLedgerEntry[] = [...userEntries];

    if (selectedOption === 'A') {
      // Target Month Direct
      updatedLedger = updatedLedger.map((e) => {
        if (e.monthKey === selectedMonthKey) {
          return {
            ...e,
            status: 'paid',
            maintenancePaid: e.maintenanceTarget,
            feedingPaid: e.feedingTarget,
            transactionId,
            submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return e;
      });
    } else if (selectedOption === 'B') {
      // Waterfall Debt Settlement
      let remaining = allocationAmount;
      updatedLedger = updatedLedger.map((e) => {
        if (remaining <= 0) return e;

        const maintNeeded = e.maintenanceTarget - e.maintenancePaid;
        let maintAdd = 0;
        if (maintNeeded > 0) {
          maintAdd = Math.min(remaining, maintNeeded);
          remaining -= maintAdd;
        }

        const feedNeeded = e.feedingTarget - e.feedingPaid;
        let feedAdd = 0;
        if (feedNeeded > 0) {
          feedAdd = Math.min(remaining, feedNeeded);
          remaining -= feedAdd;
        }

        const newMaintPaid = e.maintenancePaid + maintAdd;
        const newFeedPaid = e.feedingPaid + feedAdd;
        const isFullyPaid = newMaintPaid >= e.maintenanceTarget && newFeedPaid >= e.feedingTarget;

        return {
          ...e,
          maintenancePaid: newMaintPaid,
          feedingPaid: newFeedPaid,
          status: isFullyPaid ? 'paid' : (newMaintPaid > 0 || newFeedPaid > 0 ? 'pending' : e.status),
          transactionId,
          submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      });
    } else if (selectedOption === 'C') {
      // Custom Split
      updatedLedger = updatedLedger.map((e) => {
        if (e.monthKey === selectedMonthKey) {
          const newMaint = Math.min(e.maintenanceTarget, customMaintenance);
          const newFeed = Math.min(e.feedingTarget, customFeeding);
          const isFullyPaid = newMaint >= e.maintenanceTarget && newFeed >= e.feedingTarget;

          return {
            ...e,
            maintenancePaid: newMaint,
            feedingPaid: newFeed,
            status: isFullyPaid ? 'paid' : 'pending',
            transactionId,
            submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return e;
      });
    }

    saveUserLedger(user.id, updatedLedger);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 border-l border-slate-900/10 dark:border-white/10 w-full max-w-4xl h-full flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-900/10 dark:border-white/10 flex items-center justify-between bg-slate-900/5 dark:bg-black/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <span>Intent-Based Dues Allocation Drawer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold">
                  EXECUTIVE AUDIT
                </span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Review receipt proof side-by-side with {user.displayName} ({user.stateCode})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/10 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showSuccessToast && (
          <div className="m-4 p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5" />
            <span>Allocation strategy applied successfully! Ledger updated.</span>
          </div>
        )}

        {/* Side-By-Side Layout */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Uploaded Receipt Image & Corper Debt Context */}
          <div className="space-y-4">
            <div className="bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                <span className="flex items-center space-x-1.5">
                  <Image className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <span>Uploaded Payment Receipt Proof</span>
                </span>
                <span className="font-mono text-[11px] text-zinc-500">{transactionId}</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-900/10 dark:border-white/10 bg-black max-h-72 flex items-center justify-center relative group">
                <img
                  src={receiptUrl}
                  alt="Payment Receipt"
                  className="w-full h-full object-contain max-h-72 hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[11px] text-white font-mono flex justify-between">
                  <span>Proof Uploaded for Execution</span>
                  <span>Verified Corper Receipt</span>
                </div>
              </div>
            </div>

            {/* Current Debt Breakdown Card */}
            <div className="bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Current Debt Breakdown for {user.displayName}</span>
              </h4>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10">
                  <span className="block text-[10px] text-zinc-500 uppercase font-sans">Maintenance Debt</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₦{maintenanceDebt.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10">
                  <span className="block text-[10px] text-zinc-500 uppercase font-sans">Feeding Debt</span>
                  <span className="font-bold text-zinc-900 dark:text-white">₦{feedingDebt.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-zinc-900 dark:border-zinc-100">
                  <span className="block text-[10px] text-zinc-300 dark:text-zinc-600 uppercase font-sans">Total Debt</span>
                  <span className="font-black text-sm">₦{totalDebt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preset Action Cards & Allocation Execution */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-1">
                Verified Amount to Allocate (₦)
              </label>
              <input
                type="number"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(Number(e.target.value))}
                className="w-full min-h-[44px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono font-bold text-base"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-900 dark:text-white">
                Select Allocation Strategy
              </label>

              {/* Option A */}
              <div
                onClick={() => setSelectedOption('A')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedOption === 'A'
                    ? 'border-zinc-900 bg-zinc-900/5 dark:border-white dark:bg-white/10 ring-2 ring-zinc-900 dark:ring-white'
                    : 'border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 hover:border-zinc-900 dark:hover:border-white/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                      A
                    </span>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      Target Month Direct
                    </span>
                  </div>
                  {selectedOption === 'A' && <Check className="w-4 h-4 text-zinc-900 dark:text-white" />}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Applies full payment directly to single selected target month.
                </p>

                {selectedOption === 'A' && (
                  <div className="mt-3 pt-2 border-t border-slate-900/10 dark:border-white/10">
                    <select
                      value={selectedMonthKey}
                      onChange={(e) => setSelectedMonthKey(e.target.value)}
                      className="w-full py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10 text-xs font-bold"
                    >
                      {userEntries.map((m) => (
                        <option key={m.monthKey} value={m.monthKey}>
                          {m.monthName} {m.year} ({m.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Option B */}
              <div
                onClick={() => setSelectedOption('B')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedOption === 'B'
                    ? 'border-zinc-900 bg-zinc-900/5 dark:border-white dark:bg-white/10 ring-2 ring-zinc-900 dark:ring-white'
                    : 'border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 hover:border-zinc-900 dark:hover:border-white/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                      B
                    </span>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      Waterfall Debt Settlement (Recommended)
                    </span>
                  </div>
                  {selectedOption === 'B' && <Check className="w-4 h-4 text-zinc-900 dark:text-white" />}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Auto-settles oldest outstanding debt sequentially across Maintenance targets first, then Feeding.
                </p>
              </div>

              {/* Option C */}
              <div
                onClick={() => setSelectedOption('C')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedOption === 'C'
                    ? 'border-zinc-900 bg-zinc-900/5 dark:border-white dark:bg-white/10 ring-2 ring-zinc-900 dark:ring-white'
                    : 'border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 hover:border-zinc-900 dark:hover:border-white/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center">
                      C
                    </span>
                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                      Custom Split Allocation
                    </span>
                  </div>
                  {selectedOption === 'C' && <Check className="w-4 h-4 text-zinc-900 dark:text-white" />}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Manually define exact NGN split between Maintenance and Feeding.
                </p>

                {selectedOption === 'C' && (
                  <div className="mt-3 pt-2 border-t border-slate-900/10 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Maintenance (₦)</label>
                      <input
                        type="number"
                        value={customMaintenance}
                        onChange={(e) => setCustomMaintenance(Number(e.target.value))}
                        className="w-full py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Feeding (₦)</label>
                      <input
                        type="number"
                        value={customFeeding}
                        onChange={(e) => setCustomFeeding(Number(e.target.value))}
                        className="w-full py-1.5 px-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleApplyAllocation}
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer select-none"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating Ledger...' : 'Confirm Allocation & Approve Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
