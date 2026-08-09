import React from 'react';

interface CircularGaugeProps {
  title: string;
  subtitle?: string;
  currentPaid: number;
  targetAmount: number;
  status: 'paid' | 'pending' | 'unpaid' | 'upcoming';
  statusBadgeText: string;
  isSubsidized?: boolean;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  title,
  subtitle,
  currentPaid,
  targetAmount,
  status,
  statusBadgeText,
  isSubsidized = false,
}) => {
  // If target is 0 (Tripartite Exemption), percentage is 100%
  const rawPercentage = targetAmount > 0 ? (currentPaid / targetAmount) * 100 : 100;
  const percentage = Math.min(100, Math.max(0, Math.round(rawPercentage)));

  // SVG Geometry
  const size = 160;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth - 4; // ~64px
  const circumference = 2 * Math.PI * radius; // ~402.12
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Dynamic Colors based on status & prompt instructions
  let startColor = '#10b981'; // emerald-500
  let endColor = '#059669'; // emerald-600
  let badgeStyle = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

  if (targetAmount === 0) {
    startColor = '#0284c7'; // sky-600
    endColor = '#38bdf8'; // sky-400
    badgeStyle = 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
  } else if (status === 'pending') {
    startColor = '#f59e0b'; // amber-500
    endColor = '#d97706'; // amber-600
    badgeStyle = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  } else if (status === 'unpaid') {
    startColor = '#f43f5e'; // rose-500 (crimson)
    endColor = '#e11d48'; // rose-600
    badgeStyle = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
  } else if (status === 'upcoming') {
    startColor = '#94a3b8'; // slate-400
    endColor = '#64748b'; // slate-500
    badgeStyle = 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
  }

  const gradientId = `gauge-grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/40 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 shadow-inner backdrop-blur-md transition-all duration-300 hover:border-slate-900/20 dark:hover:border-white/20 min-w-0">
      {/* Header Info */}
      <div className="text-center mb-1 sm:mb-2">
        <h4 className="text-[11px] xs:text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
          {title}
        </h4>
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
            {subtitle}
          </p>
        )}
      </div>

      {/* SVG Meter - Adaptive Responsive Sizing */}
      <div className="relative w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center my-1 flex-shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 w-full h-full"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={endColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-slate-200/80 dark:stroke-zinc-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Animated Progress Stroke */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            filter={`url(#glow-${gradientId})`}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>

        {/* Center Label Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1 leading-tight select-none pointer-events-none">
          <span className="text-xs xs:text-sm sm:text-lg md:text-xl font-black font-mono text-zinc-900 dark:text-white leading-tight transition-all duration-300">
            ₦{currentPaid.toLocaleString()}
          </span>
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold mt-0.5 leading-tight">
            / ₦{targetAmount.toLocaleString()}
          </span>
          <span className="text-[10px] xs:text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 font-mono mt-0.5 leading-tight">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Footer Status Badge */}
      <div className="mt-1.5 flex flex-col items-center space-y-0.5">
        <span
          className={`px-2.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded-full border shadow-2xs select-none transition-colors duration-300 ${badgeStyle}`}
        >
          {statusBadgeText}
        </span>
        {isSubsidized && (
          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight text-center">
            ⚡ Subsidized
          </span>
        )}
      </div>
    </div>
  );
};

