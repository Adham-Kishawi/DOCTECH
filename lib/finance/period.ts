import { DEFAULT_CLINIC_TIMEZONE } from "@/lib/schedule/clinicTime";

/**
 * Calendar arithmetic in the CLINIC's own timezone.
 *
 * Every financial bucket in this app ("which month is this expense in?", "when
 * does the month start?") is a clinic-calendar question. Doing it in UTC files
 * a 01:00 Cairo expense into the previous month; doing it in the server's zone
 * breaks whenever the server moves.
 */

export const isValidMonthKey = (value: string | null | undefined): value is string =>
  Boolean(value) && /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value));

/** UTC offset (ms) that `timeZone` was at on the given instant. */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - instant.getTime();
}

/** The UTC instant of `wallClock` (a wall-clock string) inside `timeZone`. */
export function zonedWallTimeToUtc(wallClock: string, timeZone: string): Date {
  // wallClock: "YYYY-MM-DDTHH:mm:ss" treated as local clinic time.
  const naive = Date.parse(`${wallClock}Z`);
  const naiveDate = new Date(naive);
  const firstGuess = new Date(naive - timeZoneOffsetMs(naiveDate, timeZone));
  // Second pass handles the hour that shifts across a DST boundary.
  return new Date(naive - timeZoneOffsetMs(firstGuess, timeZone));
}

/** "YYYY-MM" of an instant in the clinic's calendar. */
export function monthKeyOf(instant: string | Date, timeZone: string = DEFAULT_CLINIC_TIMEZONE): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) return "";
  return wallClock(date, timeZone).slice(0, 7);
}

/** "YYYY-MM-DDTHH:mm:ss" of an instant as seen from the clinic's clock. */
export function wallClock(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

export interface MonthBounds {
  /** First instant of the month in the clinic's clock, as a UTC date. */
  start: Date;
  /** First instant of the NEXT month — use with `.lt`. */
  end: Date;
}

/** Half-open [start, end) UTC bounds of a "YYYY-MM" month. */
export function monthBounds(monthKey: string, timeZone: string = DEFAULT_CLINIC_TIMEZONE): MonthBounds {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    const now = new Date();
    return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), end: now };
  }

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    start: zonedWallTimeToUtc(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`, timeZone),
    end: zonedWallTimeToUtc(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`, timeZone),
  };
}

/** "2026-10" → "2026-09" (wraps across years). */
export function previousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey;
  return month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** Days in a clinic-calendar month — used to spread monthly totals. */
export function daysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 30;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
