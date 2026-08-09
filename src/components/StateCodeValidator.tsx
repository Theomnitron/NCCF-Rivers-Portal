import React, { useState } from 'react';
import {
  STATE_CODE_REGEX,
  isValidStateCode,
  formatTruncatedName,
  calculateTargets,
} from '../utils/sanitizers';
import {
  Code,
  CheckCircle2,
  XCircle,
  Calculator,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { HouseStatus, SystemCategory } from '../types/corper';

export const StateCodeValidator: React.FC = () => {
  // State Code Tester state
  const [testCode, setTestCode] = useState('RV/24A/0001');
  const isValid = isValidStateCode(testCode);

  // Truncated Name Tester state
  const [testFirstName, setTestFirstName] = useState('Emmanuel');
  const [testLastName, setTestLastName] = useState('Okonkwo');
  const truncatedResult = formatTruncatedName(testFirstName, testLastName);

  // Targets Calculator Tester state
  const [testCategory, setTestCategory] = useState<SystemCategory>('member');
  const [testStatus, setTestStatus] = useState<HouseStatus>('Member');
  const [testUnit, setTestUnit] = useState('Welfare');

  const calcResult = calculateTargets({
    systemCategory: testCategory,
    houseStatus: testStatus,
    serviceUnit: testUnit,
  });

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-900/55 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 space-y-6 transition-all duration-200">
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-900/10 dark:border-white/10">
        <div className="p-2 bg-zinc-900 dark:bg-zinc-100 rounded-xl text-white dark:text-zinc-900 shadow-md">
          <Code className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Data Layer Utilities & Validation Engine
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Live interactive sandbox for State Code Regex, Name Truncation, and Dues Target Calculator
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. State Code Regex Validator */}
        <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-zinc-900 dark:text-white font-bold text-xs mb-2">
              <ShieldCheck className="w-4 h-4 text-zinc-900 dark:text-white" />
              <span>State Code Regex Tester</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-3 font-mono">
              Enforces pattern: <code className="bg-slate-900/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-900 dark:text-zinc-100 font-bold">{STATE_CODE_REGEX.toString()}</code>
            </p>

            <label className="block text-[11px] text-zinc-700 dark:text-zinc-300 mb-1 font-medium">
              Enter State Code to Test
            </label>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="e.g. RV/24A/0001"
              className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 font-mono text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 uppercase font-medium"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Regex Match:</span>
            {isValid ? (
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-slate-900/10 dark:bg-white/10 px-2.5 py-1 rounded-full border border-slate-900/10 dark:border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                <span>Valid Corper Code</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-slate-900/10 dark:bg-white/10 px-2.5 py-1 rounded-full border border-slate-900/10 dark:border-white/10">
                <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Invalid Format</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. Truncated Name Generator */}
        <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-zinc-900 dark:text-white font-bold text-xs mb-2">
              <UserCheck className="w-4 h-4 text-zinc-900 dark:text-white" />
              <span>Name Truncator ("FirstName L.")</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-3">
              Formats public display name safely: <code className="bg-slate-900/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-900 dark:text-zinc-100 font-mono">formatTruncatedName(first, last)</code>
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[11px] text-zinc-700 dark:text-zinc-300 mb-1 font-medium">First Name</label>
                <input
                  type="text"
                  value={testFirstName}
                  onChange={(e) => setTestFirstName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Last Name</label>
                <input
                  type="text"
                  value={testLastName}
                  onChange={(e) => setTestLastName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Truncated Output:</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono bg-white/70 dark:bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-slate-900/10 dark:border-white/10">
              "{truncatedResult}"
            </span>
          </div>
        </div>

        {/* 3. Target Fee Calculator */}
        <div className="p-4 rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 shadow-inner flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-zinc-900 dark:text-white font-bold text-xs mb-2">
              <Calculator className="w-4 h-4 text-zinc-900 dark:text-white" />
              <span>Target Dues Calculator</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-3">
              Tripartite (₦0/₦0), Exco/Gov/Welfare (₦15k/₦5k), Standard (₦15k/₦10k)
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-zinc-700 dark:text-zinc-300 font-medium">Category:</label>
                <select
                  value={testCategory}
                  onChange={(e) => setTestCategory(e.target.value as SystemCategory)}
                  className="px-2 py-1 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="member">member</option>
                  <option value="tripartite">tripartite</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-zinc-700 dark:text-zinc-300 font-medium">House Status:</label>
                <select
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value as HouseStatus)}
                  className="px-2 py-1 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="Member">Member</option>
                  <option value="Governor">Governor</option>
                  <option value="Executive">Executive</option>
                  <option value="Delegate">Delegate</option>
                  <option value="Gee">Gee</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-zinc-700 dark:text-zinc-300 font-medium">Service Unit:</label>
                <input
                  type="text"
                  value={testUnit}
                  onChange={(e) => setTestUnit(e.target.value)}
                  placeholder="Welfare, Media..."
                  className="w-28 px-2 py-1 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-600 dark:text-zinc-400 font-sans">Calc Targets:</span>
            <span className="font-bold text-zinc-900 dark:text-white bg-white/70 dark:bg-zinc-900/80 px-2 py-0.5 rounded-lg border border-slate-900/10 dark:border-white/10">
              M: ₦{calcResult.maintenance.toLocaleString()} | F: ₦{calcResult.feeding.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
