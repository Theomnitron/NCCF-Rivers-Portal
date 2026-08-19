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
