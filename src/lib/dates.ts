/**
 * Small, deterministic date helpers.
 *
 * All values are handled as calendar dates in UTC so server-rendered output
 * matches the hydrated client regardless of either machine's time zone or ICU data.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MS_PER_DAY = 86_400_000;

/** Parses YYYY-MM-DD into a UTC Date. Returns null for anything else. */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** "Sat, 17 Oct 2026" */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Sat 17 Oct" */
export function formatShortDate(date: Date): string {
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/** Formats a single date or a date range: "Sat, 17 Oct 2026" or "21–22 Nov 2026". */
export function formatDateRange(startISO: string, endISO?: string): string {
  const start = parseISODate(startISO);
  if (!start) return startISO;
  const end = endISO ? parseISODate(endISO) : null;
  if (!end || daysBetween(start, end) === 0) return formatLongDate(start);

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const endLabel = `${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;

  if (sameMonth) return `${start.getUTCDate()}–${endLabel}`;
  if (sameYear) return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${endLabel}`;
  return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()} – ${endLabel}`;
}

/** "YYYY-MM" → "September 2025" */
export function formatYearMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = MONTHS_LONG[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : value;
}

/** "YYYY-MM" → "2025" */
export function yearOf(value: string): string {
  return value.slice(0, 4);
}
