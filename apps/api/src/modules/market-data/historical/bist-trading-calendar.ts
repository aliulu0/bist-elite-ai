/**
 * Deterministic BIST trading calendar used by the Historical Market Data
 * Backfill & Validation Engine (R2-044) to detect expected-trading-day gaps.
 *
 * Only fixed-date Turkish public holidays are modelled. These are fully
 * deterministic and require no external dependency or network call.
 *
 * Moveable religious holidays (Ramazan/Kurban Bayramı) are deliberately NOT
 * modelled: their dates follow the lunar calendar and would require an
 * external holiday feed. Missing bars caused by such holidays surface as
 * ordinary coverage gaps, which the backfill re-fetches from the data
 * providers and merges (the provider response defines ground truth). The
 * coverage percentage is therefore a lower bound on true completeness.
 */

export const TR_TIMEZONE_OFFSET_MS = 3 * 3_600_000;

export const BIST_FIXED_HOLIDAYS: ReadonlyArray<{ month: number; day: number }> = [
  { month: 1, day: 1 }, // Yılbaşı
  { month: 4, day: 23 }, // Ulusal Egemenlik ve Çocuk Bayramı
  { month: 5, day: 1 }, // Emek ve Dayanışma Günü
  { month: 5, day: 19 }, // Atatürk'ü Anma, Gençlik ve Spor Bayramı
  { month: 7, day: 15 }, // Demokrasi ve Millî Birlik Günü
  { month: 8, day: 30 }, // Zafer Bayramı
  { month: 10, day: 29 }, // Cumhuriyet Bayramı
];

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toUtcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromKey(dayKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dayKey.split('-').map((n) => Number(n));
  return { year, month, day };
}

function toDate(dayKey: string): Date {
  const { year, month, day } = fromKey(dayKey);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * YYYY-MM-DD calendar date (Turkey time, UTC+3) for a given instant.
 * Bar timestamps are bucketed by their TR trading date.
 */
export function toTrDate(ts: string | number | Date): string {
  const date = typeof ts === 'number' || typeof ts === 'string' ? new Date(ts) : ts;
  const tr = new Date(date.getTime() + TR_TIMEZONE_OFFSET_MS);
  return toUtcDateKey(tr);
}

/**
 * Today's TR calendar date as YYYY-MM-DD.
 */
export function todayTrDate(now = Date.now()): string {
  return toTrDate(now);
}

/**
 * True when the given calendar day (YYYY-MM-DD) is a BIST trading day:
 * a weekday that is not a fixed Turkish public holiday.
 */
export function isTradingDay(dayKey: string): boolean {
  if (!DATE_KEY_PATTERN.test(dayKey)) return false;
  const { year, month, day } = fromKey(dayKey);
  const weekday = toDate(dayKey).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  return !BIST_FIXED_HOLIDAYS.some((h) => h.month === month && h.day === day);
}

export function addDays(dayKey: string, days: number): string {
  const date = toDate(dayKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toUtcDateKey(date);
}

export function previousTradingDay(dayKey: string): string {
  let cursor = addDays(dayKey, -1);
  while (!isTradingDay(cursor)) cursor = addDays(cursor, -1);
  return cursor;
}

export function nextTradingDay(dayKey: string): string {
  let cursor = addDays(dayKey, 1);
  while (!isTradingDay(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

/**
 * Inclusive list of trading days between start and end (both inclusive).
 * Returns an empty array when start > end.
 */
export function eachTradingDay(start: string, end: string): string[] {
  if (!DATE_KEY_PATTERN.test(start) || !DATE_KEY_PATTERN.test(end)) return [];
  if (start > end) return [];
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    if (isTradingDay(cursor)) days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function tradingDayCount(start: string, end: string): number {
  return eachTradingDay(start, end).length;
}

// ── Period helpers (timeframe-aware gap detection) ──

/** Monday of the ISO week containing the given day (YYYY-MM-DD). */
export function mondayOfWeek(dayKey: string): string {
  const date = toDate(dayKey);
  const dow = date.getUTCDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(dayKey, offset);
}

export function sundayOfWeek(dayKey: string): string {
  return addDays(mondayOfWeek(dayKey), 6);
}

export function firstOfMonth(dayKey: string): string {
  const { year, month } = fromKey(dayKey);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function lastOfMonth(dayKey: string): string {
  const { year, month } = fromKey(dayKey);
  const date = new Date(Date.UTC(year, month, 0)); // day 0 of next month
  return toUtcDateKey(date);
}

export function firstOfQuarter(dayKey: string): string {
  const { year, month } = fromKey(dayKey);
  const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterMonth).padStart(2, '0')}-01`;
}

export function lastOfQuarter(dayKey: string): string {
  const { year, month } = fromKey(dayKey);
  const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return lastOfMonth(`${year}-${String(quarterMonth + 2).padStart(2, '0')}-01`);
}

export function firstOfHalf(dayKey: string): string {
  const { year, month } = fromKey(dayKey);
  const halfMonth = month <= 6 ? 1 : 7;
  return `${year}-${String(halfMonth).padStart(2, '0')}-01`;
}

export function lastOfHalf(dayKey: string): string {
  const { year, month } = fromKey(dayKey);
  const halfMonth = month <= 6 ? 7 : 1;
  const halfYear = month <= 6 ? year : year + 1;
  return lastOfMonth(`${halfYear}-${String(halfMonth).padStart(2, '0')}-01`);
}

/** Max day key comparison (lexicographic works for YYYY-MM-DD). */
export function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

export function minDate(a: string, b: string): string {
  return a < b ? a : b;
}
