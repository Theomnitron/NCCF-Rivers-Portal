import { CorperProfile } from '../types/corper';
import { MonthLedgerEntry } from '../types/ledger';

export type DuesPaymentStatus = 'Unpaid' | 'Partially Paid' | 'Maint ONLY' | 'Fully Paid';

export interface WaterfallDuesResult {
  maintTarget: number;
  feedTarget: number;
  targetTotal: number;
  totalPaid: number;
  maintPaid: number;
  feedPaid: number;
  paymentStatus: DuesPaymentStatus;
  statusBadgeText: string;
  isFeedingSubsidized: boolean;
  isTripartiteExempt: boolean;
}

export function getCurrentActiveLedgerMonth(): {
  monthKey: string;
  monthCode: string;
  monthName: string;
  year: number;
  activeMonthLabel: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const MONTH_CODES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthCode = MONTH_CODES[monthIdx];
  const monthName = MONTH_NAMES[monthIdx];
  const monthKey = `${monthCode}-${year}`;
  const activeMonthLabel = `${monthName} ${year}`;

  return { monthKey, monthCode, monthName, year, activeMonthLabel };
}

/**
 * Calculates the Feeding Dues target based on corper profile exemptions & subsidization rules:
 * - Tripartite & Admin corpers: ₦0 (Exempt)
 * - Subsidized corpers (Welfare / Kitchen unit, Executive, Room Gov, Delegate): ₦5,000
 * - Standard corpers: ₦10,000
 */
export function getFeedingTarget(profile?: Partial<CorperProfile> | null): number {
  if (!profile) return 10000;
  
  const sysCat = profile.systemCategory || (profile as any).system_category;
  if (
    Boolean(profile.isExempted) ||
    sysCat === 'tripartite' ||
    sysCat === 'admin' ||
    profile.houseStatus === 'Tripartite' ||
    profile.houseStatus === 'Admin' ||
    profile.houseStatus === 'Delegate' ||
    profile.houseStatus === 'Gee'
  ) {
    return 0;
  }

  if (profile.targets?.feeding !== undefined) {
    return profile.targets.feeding;
  }

  const units = profile.serviceUnits || (profile.serviceUnit ? [profile.serviceUnit] : []);
  const isSubsidized =
    units.some(u => u.toLowerCase().includes('welfare') || u.toLowerCase().includes('kitchen')) ||
    profile.houseStatus === 'Executive' ||
    profile.houseStatus === 'Room Gov';

  return isSubsidized ? 5000 : 10000;
}

/**
 * Tiered Waterfall Allocation Logic for Dues:
 * - Maintenance Gauge (Target ₦15,000): Takes priority. Fills up first (max ₦15,000).
 * - Feeding Gauge (Target ₦5,000 or ₦10,000 depending on corper profile exemption): Takes any overflow amount exceeding ₦15,000.
 * 
 * Payment Status Rules:
 * - ₦0 total = "Unpaid"
 * - > ₦0 and < ₦15,000 = "Partially Paid"
 * - Exactly ₦15,000 (when feedTarget > 0) = "Maint ONLY"
 * - > ₦15,000 and < Target Total (20k/25k) = "Partially Paid"
 * - Target Total (20k or 25k) = "Fully Paid"
 */
export function calculateWaterfallDues(
  totalPaid: number,
  profile?: Partial<CorperProfile> | null
): WaterfallDuesResult {
  const sysCat = profile?.systemCategory || (profile as any)?.system_category;
  const isTripartiteExempt =
    Boolean(profile?.isExempted) ||
    sysCat === 'tripartite' ||
    sysCat === 'admin' ||
    profile?.houseStatus === 'Tripartite' ||
    profile?.houseStatus === 'Admin' ||
    profile?.houseStatus === 'Delegate';

  const isGee = profile?.houseStatus === 'Gee';

  const maintTarget = isTripartiteExempt
    ? 0
    : isGee
    ? 15000
    : (profile?.targets?.maintenance ?? 15000);

  const feedTarget = isTripartiteExempt || isGee ? 0 : getFeedingTarget(profile);
  const targetTotal = maintTarget + feedTarget;

  const safePaid = Math.max(0, totalPaid);
  const maintPaid = Math.min(safePaid, maintTarget || 15000);
  const feedPaid = Math.max(0, Math.min(safePaid - maintPaid, feedTarget));

  let paymentStatus: DuesPaymentStatus = 'Unpaid';

  if (isTripartiteExempt || targetTotal === 0) {
    paymentStatus = 'Fully Paid';
  } else if (safePaid === 0) {
    paymentStatus = 'Unpaid';
  } else if (safePaid < maintTarget) {
    paymentStatus = 'Partially Paid';
  } else if (safePaid === maintTarget) {
    if (feedTarget === 0) {
      paymentStatus = 'Fully Paid';
    } else {
      paymentStatus = 'Maint ONLY';
    }
  } else if (safePaid < targetTotal) {
    paymentStatus = 'Partially Paid';
  } else {
    paymentStatus = 'Fully Paid';
  }

  const units = profile?.serviceUnits || (profile?.serviceUnit ? [profile.serviceUnit] : []);
  const isFeedingSubsidized =
    !isTripartiteExempt &&
    (units.some(u => u.toLowerCase().includes('welfare') || u.toLowerCase().includes('kitchen')) ||
      profile?.houseStatus === 'Executive' ||
      profile?.houseStatus === 'Room Gov' ||
      profile?.houseStatus === 'Delegate' ||
      feedTarget === 5000);

  return {
    maintTarget,
    feedTarget,
    targetTotal,
    totalPaid: safePaid,
    maintPaid,
    feedPaid,
    paymentStatus,
    statusBadgeText: paymentStatus,
    isFeedingSubsidized,
    isTripartiteExempt,
  };
}

/**
 * Calculates total dues paid for a corper for the current month by summing the `amount` column
 * from approved `dues_ledgers` rows for the active corper.
 */
export function calculateTotalApprovedDues(
  ledgersData: Array<{ corper_id?: string; amount: number; status?: string; target_month?: string; month_code?: string; year?: number }> | null | undefined,
  corperId: string,
  targetMonthKey?: string
): number {
  if (!ledgersData || !corperId) return 0;
  return ledgersData
    .filter((row) => {
      const isUserMatch = row.corper_id === corperId;
      const statusLower = (row.status || '').toLowerCase();
      const isApproved = statusLower === 'verified' || statusLower === 'approved' || statusLower === 'paid';
      const isMonthMatch = !targetMonthKey || row.target_month === targetMonthKey || row.month_code === targetMonthKey;
      return isUserMatch && isApproved && isMonthMatch;
    })
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}
