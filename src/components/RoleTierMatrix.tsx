import React from 'react';
import { TIER_DEFINITIONS } from '../utils/tierEvaluator';
import { Shield, Layers } from 'lucide-react';

export const RoleTierMatrix: React.FC = () => {
  const tiers = Object.values(TIER_DEFINITIONS);

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-900/55 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-900/10 dark:border-white/10 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-zinc-900 dark:bg-zinc-100 rounded-xl text-white dark:text-zinc-900 shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              NCCF Rivers State Role-Tier Matrix (Tiers 1 - 7)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Evaluated sequentially based on systemCategory, houseStatus, and leadership posts
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-900 dark:text-zinc-100 bg-slate-900/5 dark:bg-black/40 px-3 py-1 rounded-full font-mono font-semibold border border-slate-900/10 dark:border-white/10">
          Priority: Admin &gt; Gee &gt; Tripartite &gt; Executive &gt; Delegate &gt; Room Gov &gt; Member
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-none rounded-xl border border-slate-900/10 dark:border-white/10">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900/5 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 font-bold border-b border-slate-900/10 dark:border-white/10">
              <th className="py-3 px-4">Tier Level</th>
              <th className="py-3 px-4">Role Badge & Color</th>
              <th className="py-3 px-4">Evaluation Rule</th>
              <th className="py-3 px-4">Category / Group</th>
              <th className="py-3 px-4">Dues Rules</th>
              <th className="py-3 px-4">Permissions & Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
            {tiers.map((t) => {
              let ruleText = '';
              let duesRule = '';

              switch (t.tier) {
                case 1:
                  ruleText = "systemCategory === 'admin'";
                  duesRule = 'Standard Corper Dues (₦15k / ₦10k)';
                  break;
                case 2:
                  ruleText = "houseStatus === 'Gee'";
                  duesRule = 'Honorary / Custom Dues Rate';
                  break;
                case 3:
                  ruleText = "systemCategory === 'tripartite'";
                  duesRule = 'EXEMPT (₦0 Maintenance / ₦0 Feeding)';
                  break;
                case 4:
                  ruleText = "houseStatus === 'Executive'";
                  duesRule = 'Subsidized Feeding (₦15k / ₦5k)';
                  break;
                case 5:
                  ruleText = "houseStatus === 'Delegate'";
                  duesRule = 'Standard Corper Dues (₦15k / ₦10k)';
                  break;
                case 6:
                  ruleText = "houseStatus === 'Governor'";
                  duesRule = 'Subsidized Feeding (₦15k / ₦5k)';
                  break;
                case 7:
                default:
                  ruleText = 'Default (Standard Resident)';
                  duesRule = 'Standard Dues or Welfare Subsidized';
                  break;
              }

              return (
                <tr key={t.tier} className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                    <span className="inline-flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ backgroundColor: t.hexColor }} />
                      <span>Level {t.tier}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-zinc-900 shadow-2xs"
                      style={{ backgroundColor: t.hexColor }}
                    >
                      <Shield className="w-3 h-3 mr-1 text-zinc-900" />
                      {t.badgeText}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                    <code className="bg-slate-900/5 dark:bg-black/40 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100 font-bold border border-slate-900/10 dark:border-white/10">
                      {ruleText}
                    </code>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                    {t.categoryName}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                    {duesRule}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                    {t.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
