import React, { useState } from 'react';
import { DuesReceiptSection } from './DuesReceiptSection';
import { TravelRequestSection } from './TravelRequestSection';
import { RevealOnScroll } from '../common/RevealOnScroll';
import { Coins, Plane, FileText } from 'lucide-react';

export const MemberRequestsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dues' | 'travel'>('dues');

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Bar */}
      <RevealOnScroll delay={0.05}>
        <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-2 sm:p-3 transition-all duration-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('dues')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer min-h-[44px] ${
                activeSubTab === 'dues'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span className="truncate text-center">
                <span className="inline sm:hidden">Dues Receipts</span>
                <span className="hidden sm:inline">Dues Clearance Receipts</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('travel')}
              className={`flex-1 py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer min-h-[44px] ${
                activeSubTab === 'travel'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <Plane className="w-4 h-4 shrink-0" />
              <span className="truncate text-center">
                <span className="inline sm:hidden">Travel Permits</span>
                <span className="hidden sm:inline">Travel Requests & Exeats</span>
              </span>
            </button>
          </div>
        </div>
      </RevealOnScroll>

      {/* Render selected section */}
      <RevealOnScroll delay={0.1}>
        {activeSubTab === 'dues' ? <DuesReceiptSection /> : <TravelRequestSection />}
      </RevealOnScroll>
    </div>
  );
};
