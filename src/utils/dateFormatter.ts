const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Converts 24hr HH:MM time string to clean 12hr format with AM/PM (e.g. '16:30' -> '4:30 PM')
 */
export function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  // Check if it matches HH:MM or HH:MM:SS
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' should be 12
    return `${hours}:${minutes} ${ampm}`;
  }

  return trimmed;
}

/**
 * Parses YYYY-MM-DD string into components safely without timezone shifts
 */
function parseYMD(ymdStr: string) {
  if (!ymdStr) return null;
  const parts = ymdStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return null;
  return { year, monthIdx, day };
}

/**
 * Formats a single date or date range + optional time into a clean presentation string.
 * Examples:
 * - Single: "August 16, 2026" or "August 16, 2026 • 4:00 PM"
 * - Same month range: "August 16 – 18, 2026"
 * - Cross month range: "August 30 – September 2, 2026"
 * - Cross year range: "December 30, 2026 – January 2, 2027"
 */
export function formatEventSchedule(
  type: 'single' | 'range',
  startDate: string,
  endDate?: string,
  eventTime?: string
): string {
  if (!startDate) return '';

  const start = parseYMD(startDate);
  if (!start) return startDate;

  const startMonthName = MONTH_NAMES[start.monthIdx] || '';
  const formattedTime = formatTime12Hour(eventTime);
  const timeSuffix = formattedTime ? ` • ${formattedTime}` : '';

  if (type === 'single' || !endDate || endDate === startDate) {
    return `${startMonthName} ${start.day}, ${start.year}${timeSuffix}`;
  }

  const end = parseYMD(endDate);
  if (!end) {
    return `${startMonthName} ${start.day}, ${start.year}${timeSuffix}`;
  }

  const endMonthName = MONTH_NAMES[end.monthIdx] || '';

  // Same month and same year
  if (start.year === end.year && start.monthIdx === end.monthIdx) {
    if (start.day === end.day) {
      return `${startMonthName} ${start.day}, ${start.year}${timeSuffix}`;
    }
    return `${startMonthName} ${start.day} – ${end.day}, ${start.year}${timeSuffix}`;
  }

  // Different month, same year
  if (start.year === end.year) {
    return `${startMonthName} ${start.day} – ${endMonthName} ${end.day}, ${start.year}${timeSuffix}`;
  }

  // Different year
  return `${startMonthName} ${start.day}, ${start.year} – ${endMonthName} ${end.day}, ${end.year}${timeSuffix}`;
}

/**
 * Formats standard ISO or YYYY-MM-DD date into friendly text if applicable
 */
export function formatAnnouncementDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // If it's a plain YYYY-MM-DD string without range/time
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const p = parseYMD(trimmed);
    if (p) {
      const month = MONTH_NAMES[p.monthIdx] || '';
      return `${month} ${p.day}, ${p.year}`;
    }
  }

  // If it's an ISO timestamp like 2026-08-16T...
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const ymd = trimmed.substring(0, 10);
    const p = parseYMD(ymd);
    if (p) {
      const month = MONTH_NAMES[p.monthIdx] || '';
      return `${month} ${p.day}, ${p.year}`;
    }
  }

  return trimmed;
}

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Extracts a numeric timestamp for sorting an announcement event date.
 * Returns null if the announcement is undated.
 */
export function extractAnnouncementSortDate(notice: {
  eventDate?: string;
  rawEventDate?: string;
  startDate?: string;
}): number | null {
  const rawCandidate = notice.rawEventDate || notice.startDate;
  if (rawCandidate && /^\d{4}-\d{2}-\d{2}/.test(rawCandidate)) {
    const parts = rawCandidate.substring(0, 10).split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d).getTime();
    }
  }

  if (!notice.eventDate || !notice.eventDate.trim()) {
    return null;
  }

  const text = notice.eventDate.trim();

  // 1. Direct YYYY-MM-DD pattern
  const ymdMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d).getTime();
    }
  }

  // 2. Month Name + Day + optional Year (e.g. "September 2, 2026", "2nd of September", "Sept 2", "September 2 – 5, 2026")
  const monthDayMatch = text.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:[–\-,\s]+(\d{4}))?/i
  );
  if (monthDayMatch) {
    const mName = monthDayMatch[1].toLowerCase();
    const mIdx = MONTH_MAP[mName] ?? -1;
    const d = parseInt(monthDayMatch[2], 10);
    const y = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : new Date().getFullYear();
    if (mIdx !== -1 && !isNaN(d)) {
      return new Date(y, mIdx, d).getTime();
    }
  }

  const dayMonthMatch = text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(?:[–\-,\s]+(\d{4}))?/i
  );
  if (dayMonthMatch) {
    const d = parseInt(dayMonthMatch[1], 10);
    const mName = dayMonthMatch[2].toLowerCase();
    const mIdx = MONTH_MAP[mName] ?? -1;
    const y = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : new Date().getFullYear();
    if (mIdx !== -1 && !isNaN(d)) {
      return new Date(y, mIdx, d).getTime();
    }
  }

  // 3. Fallback to standard Date.parse
  const parsed = Date.parse(text);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return null;
}

/**
 * Sorts announcements:
 * 1. Pinned to top announcements first
 * 2. Undated announcements supersede all dated ones (placed at top)
 * 3. Dated announcements sorted with earliest event date first (e.g. Sept 2 before Sept 5)
 * 4. Ties broken by newest creation date
 */
export function sortAnnouncementsByNoticePriority<T extends {
  pinToTop?: boolean;
  eventDate?: string;
  rawEventDate?: string;
  startDate?: string;
  createdAt?: string;
}>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Pinned to top
    if (a.pinToTop && !b.pinToTop) return -1;
    if (!a.pinToTop && b.pinToTop) return 1;

    const dateA = extractAnnouncementSortDate(a);
    const dateB = extractAnnouncementSortDate(b);

    const hasDateA = dateA !== null;
    const hasDateB = dateB !== null;

    // 2. Undated announcements supersede all dated announcements
    if (!hasDateA && hasDateB) return -1;
    if (hasDateA && !hasDateB) return 1;

    // 3. If both are undated, newest creation first
    if (!hasDateA && !hasDateB) {
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdB - createdA;
    }

    // 4. Both have dates: earliest date comes first (ascending order of date)
    if (dateA! !== dateB!) {
      return dateA! - dateB!;
    }

    // 5. Tie-break on creation time
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdB - createdA;
  });
}
