import { MonthLedgerEntry, PaymentStatus } from '../types/ledger';
import { CorperProfile } from '../types/corper';
import { getFeedingTarget, calculateWaterfallDues } from '../utils/duesCalculator';

export const MONTH_NAMES = [
  { key: 'JAN', name: 'January', index: 0 },
  { key: 'FEB', name: 'February', index: 1 },
  { key: 'MAR', name: 'March', index: 2 },
  { key: 'APR', name: 'April', index: 3 },
  { key: 'MAY', name: 'May', index: 4 },
  { key: 'JUN', name: 'June', index: 5 },
  { key: 'JUL', name: 'July', index: 6 },
  { key: 'AUG', name: 'August', index: 7 },
  { key: 'SEP', name: 'September', index: 8 },
  { key: 'OCT', name: 'October', index: 9 },
  { key: 'NOV', name: 'November', index: 10 },
  { key: 'DEC', name: 'December', index: 11 },
];

export function generateDefaultLedgerForUser(user: CorperProfile): MonthLedgerEntry[] {
  const maintTarget = user?.targets?.maintenance ?? 15000;
  const feedTarget = user?.targets?.feeding ?? 10000;

  const entries: MonthLedgerEntry[] = [];

  // Generate 2026 (AUG through DEC)
  const months2026 = MONTH_NAMES.slice(7); // AUG, SEP, OCT, NOV, DEC
  months2026.forEach((m) => {
    let status: PaymentStatus = 'upcoming';
    let maintPaid = 0;
    let feedPaid = 0;
    let txnId: string | undefined = undefined;
    let submittedAt: string | undefined = undefined;
    let fileName: string | undefined = undefined;

    if (m.key === 'AUG') {
      if (user.id === '00000000-0000-4000-a000-000000000007' || user.id === 'corp-007') {
        // Blessing A: Paid for Aug
        status = 'paid';
        maintPaid = maintTarget;
        feedPaid = feedTarget;
        txnId = 'TXN-2026-AUG-9482';
        submittedAt = '2026-08-02 11:15 AM';
        fileName = 'bank_transfer_aug_blessing.jpg';
      } else if (user.id === '00000000-0000-4000-a000-000000000001' || user.id === 'corp-001') {
        // Emmanuel O: Pending Review for Aug
        status = 'pending';
        maintPaid = maintTarget;
        feedPaid = feedTarget;
        txnId = 'TXN-2026-AUG-1092';
        submittedAt = '2026-08-01 04:20 PM';
        fileName = 'zenith_pay_receipt_aug.png';
      } else if (user.id === '00000000-0000-4000-a000-000000000003' || user.id === 'corp-003') {
        // Grace A: Partially Paid for Aug (₦5,000 paid towards ₦25,000 target)
        status = 'paid';
        maintPaid = 5000;
        feedPaid = 0;
        txnId = 'TXN-2026-AUG-4819';
        submittedAt = '2026-08-01 02:10 PM';
        fileName = 'gtbank_receipt_partial.jpg';
      } else {
        // Unpaid
        status = 'unpaid';
        maintPaid = 0;
        feedPaid = 0;
      }
    } else if (m.key === 'SEP') {
      status = 'unpaid';
      maintPaid = 0;
      feedPaid = 0;
    } else {
      status = 'upcoming';
      maintPaid = 0;
      feedPaid = 0;
    }

    entries.push({
      monthKey: m.key,
      monthName: m.name,
      monthIndex: m.index,
      year: 2026,
      status,
      maintenancePaid: maintPaid,
      maintenanceTarget: maintTarget,
      feedingPaid: feedPaid,
      feedingTarget: feedTarget,
      transactionId: txnId,
      receiptFileName: fileName,
      submittedAt,
      paymentType: 'combined',
    });
  });

  // Generate 2027 (JAN through DEC)
  MONTH_NAMES.forEach((m) => {
    entries.push({
      monthKey: m.key,
      monthName: m.name,
      monthIndex: m.index,
      year: 2027,
      status: 'upcoming',
      maintenancePaid: 0,
      maintenanceTarget: maintTarget,
      feedingPaid: 0,
      feedingTarget: feedTarget,
      paymentType: 'combined',
    });
  });

  return entries;
}

const STORAGE_KEY_LEDGER_PREFIX = 'nccf_rivers_user_ledger_v3_';

export function getLiveUserLedger(user: CorperProfile, duesSubmissions?: any[]): MonthLedgerEntry[] {
  const baseEntries = generateDefaultLedgerForUser(user);
  const maintTarget = user?.targets?.maintenance ?? 15000;
  const feedTarget = getFeedingTarget(user);

  // Read saved local ledger overrides first
  let savedLocalMap = new Map<string, MonthLedgerEntry>();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_LEDGER_PREFIX}${user.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((e: MonthLedgerEntry) => {
          if (e.monthKey) savedLocalMap.set(`${e.monthKey}-${e.year}`, e);
        });
      }
    }
  } catch (e) {
    // ignore
  }

  if (!duesSubmissions || !Array.isArray(duesSubmissions) || duesSubmissions.length === 0) {
    if (savedLocalMap.size > 0) {
      return baseEntries.map((entry) => {
        const saved = savedLocalMap.get(`${entry.monthKey}-${entry.year}`);
        if (saved) {
          return {
            ...saved,
            maintenanceTarget: maintTarget,
            feedingTarget: feedTarget,
            maintenancePaid: Number(saved.maintenancePaid) || 0,
            feedingPaid: Number(saved.feedingPaid) || 0,
          };
        }
        return entry;
      });
    }
    return baseEntries;
  }

  // Filter user's dues submissions
  const userSubs = duesSubmissions.filter((s) => s.userId === user.id);

  return baseEntries.map((entry) => {
    const key = `${entry.monthKey}-${entry.year}`;
    const saved = savedLocalMap.get(key);

    // Match ALL submissions by monthCode or monthKey
    const monthSubs = userSubs.filter((s) => {
      const mCode = s.monthCode || (s.monthKey ? s.monthKey.split('-')[0] : '');
      const sYear = s.year || (s.monthKey && s.monthKey.includes('-') ? parseInt(s.monthKey.split('-')[1]) : 2026);
      return (mCode === entry.monthKey || s.monthKey === entry.monthKey) && sYear === entry.year;
    });

    // Filter approved or modified_approved submissions
    const approvedSubs = monthSubs.filter(
      (s) => s.status === 'approved' || s.status === 'modified_approved' || s.status === 'paid'
    );

    // Sum cumulative approved paid
    const cumulativeApproved = approvedSubs.reduce((sum, s) => {
      const amt = s.approvedAmount !== undefined ? Number(s.approvedAmount) : Number(s.amountPaid || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    const pendingSubs = monthSubs.filter((s) => s.status === 'pending');
    const latestSub = monthSubs[monthSubs.length - 1];

    if (cumulativeApproved > 0) {
      const waterfall = calculateWaterfallDues(cumulativeApproved, user);
      return {
        ...entry,
        status: 'paid',
        maintenancePaid: waterfall.maintPaid,
        feedingPaid: waterfall.feedPaid,
        maintenanceTarget: maintTarget,
        feedingTarget: feedTarget,
        transactionId: latestSub?.transactionRef || latestSub?.id || entry.transactionId,
        receiptFileName: latestSub?.fileName || entry.receiptFileName,
        submittedAt: latestSub?.submittedAt || entry.submittedAt,
        paymentType: waterfall.paymentStatus === 'Maint ONLY' ? 'maintenance_only' : (latestSub?.subscriptionType || 'combined'),
      };
    } else if (saved && saved.status === 'paid' && saved.submittedAt?.includes('Overridden')) {
      // Admin Force Clear override stored in local ledger
      return {
        ...entry,
        status: 'paid',
        maintenancePaid: saved.maintenancePaid || maintTarget,
        feedingPaid: saved.feedingPaid || feedTarget,
        maintenanceTarget: maintTarget,
        feedingTarget: feedTarget,
        submittedAt: saved.submittedAt,
        paymentType: 'combined',
      };
    } else if (pendingSubs.length > 0) {
      const latestPending = pendingSubs[pendingSubs.length - 1];
      return {
        ...entry,
        status: 'pending',
        maintenancePaid: 0,
        feedingPaid: 0,
        maintenanceTarget: maintTarget,
        feedingTarget: feedTarget,
        transactionId: latestPending.transactionRef || latestPending.id,
        receiptFileName: latestPending.fileName,
        submittedAt: latestPending.submittedAt,
        paymentType: latestPending.subscriptionType || 'combined',
      };
    } else {
      return {
        ...entry,
        status: 'unpaid',
        maintenancePaid: 0,
        feedingPaid: 0,
        maintenanceTarget: maintTarget,
        feedingTarget: feedTarget,
      };
    }
  });
}

export function getStoredUserLedger(user: CorperProfile, duesSubmissions?: any[]): MonthLedgerEntry[] {
  return getLiveUserLedger(user, duesSubmissions);
}

export function saveUserLedger(userId: string, entries: MonthLedgerEntry[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_LEDGER_PREFIX}${userId}`, JSON.stringify(entries));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ledger_updated'));
      window.dispatchEvent(new CustomEvent('ledger_updated', { detail: { userId } }));
    }
  } catch (e) {
    // Silent catch
  }
}
