/**
 * Wall-clock <-> UTC helpers for clinic scheduling.
 *
 * `doctor_schedules` stores plain wall-clock times (09:00–17:00) because they
 * belong to the clinic's day, not to any instant. Appointment timestamps are
 * stored as UTC `timestamptz`. The two only agree if we know which IANA zone the
 * clinic is in — an API server running in UTC reading `.getHours()` off a
 * timestamp silently shifts every booking by the zone offset.
 *
 * Deliberately dependency-free: an iterative offset correction converges in one
 * or two passes for every zone except inside DST gaps, where the round-trip is
 * re-checked.
 */

export const DEFAULT_CLINIC_TIMEZONE = "Africa/Cairo";

export interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(timeZone, fmt);
  }
  return fmt;
}

/** Reads what the zone's clock shows at a given UTC instant. */
function readWallClock(instantMs: number, timeZone: string): WallClock {
  const parts = partsFormatter(timeZone).formatToParts(new Date(instantMs));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

function asUtc(c: WallClock): number {
  return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second);
}

/** True when the input already pins an instant ("...Z" or "...±HH:MM"). */
function hasExplicitOffset(iso: string): boolean {
  return /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
}

/**
 * Finds the UTC instant at which the given zone's clock reads `target`.
 * Starts from the naive value interpreted as UTC and converges; re-checks the
 * round trip so a DST gap cannot silently accept the wrong instant.
 */
function instantForWallClock(target: WallClock, timeZone: string): Date {
  const wanted = asUtc(target);
  let candidate = wanted;

  for (let i = 0; i < 3; i++) {
    const drift = wanted - asUtc(readWallClock(candidate, timeZone));
    if (drift === 0) break;
    candidate += drift;
  }

  const seen = readWallClock(candidate, timeZone);
  if (asUtc(seen) !== wanted) {
    // DST gap: the zone skipped this wall clock. Step forward until the zone
    // admits a value, which lands on the first instant after the gap.
    let probe = candidate;
    for (let i = 0; i < 48 * 12; i++) {
      probe += 5 * 60 * 1000;
      if (asUtc(readWallClock(probe, timeZone)) >= wanted) return new Date(probe);
    }
    void seen;
  }

  return new Date(candidate);
}

function pad(v: number): string {
  return v.toString().padStart(2, "0");
}

/**
 * Converts a caller-supplied appointment input to a UTC instant.
 *
 * An offset-bearing string is honoured exactly — the caller pinned the instant.
 * A naive string (`2026-10-06T10:00:00`) has no zone, so it is read as wall-clock
 * time in the clinic's zone.
 */
export function resolveInstant(dateInput: string, timeZone: string): Date {
  const direct = new Date(dateInput);
  if (hasExplicitOffset(dateInput) && !Number.isNaN(direct.getTime())) {
    return direct;
  }

  const m =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(dateInput);
  if (!m) {
    return direct;
  }

  return instantForWallClock(
    {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
      hour: Number(m[4]),
      minute: Number(m[5]),
      second: Number(m[6] ?? "0"),
    },
    timeZone
  );
}

/** Minutes since midnight of `instantUtc`, read in the clinic's zone. */
export function wallMinutes(instantUtc: Date, timeZone: string): number {
  const c = readWallClock(instantUtc.getTime(), timeZone);
  return c.hour * 60 + c.minute;
}

/** "hh:mm" as the clinic's clock shows it. */
export function wallTime(instantUtc: Date, timeZone: string): string {
  const c = readWallClock(instantUtc.getTime(), timeZone);
  return `${pad(c.hour)}:${pad(c.minute)}`;
}

/** Calendar day of `instantUtc` in the clinic's zone, as "YYYY-MM-DD". */
export function wallDate(instantUtc: Date, timeZone: string): string {
  const c = readWallClock(instantUtc.getTime(), timeZone);
  return `${c.year}-${pad(c.month)}-${pad(c.day)}`;
}

/**
 * Renders a stored timestamp in the clinic's zone.
 *
 * `toLocale*` without `timeZone` renders in the *API server's* zone, which is
 * UTC in production — every displayed time is then shifted by the offset while
 * still looking plausible. Always pass the clinic's zone when formatting on
 * the server. Returns `fallback` rather than "Invalid Date" for unparseable
 * input, and swallows an unknown-zone RangeError so one bad row cannot take
 * down the response.
 */
export function formatInClinicZone(
  value: string | number | Date | null | undefined,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale = "en-US",
  fallback = ""
): string {
  if (value === null || value === undefined || value === "") return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    return fallback;
  }
}

/**
 * Calendar day for a stored value, honouring date-only strings.
 *
 * `"2026-10-06"` is a calendar date, not an instant: running it through a zone
 * conversion would land it on the 5th in every zone west of UTC. Instants go
 * through `wallDate` so they resolve to the clinic's day instead of the UTC one.
 */
export function clinicCalendarDate(
  value: string | number | Date | null | undefined,
  timeZone: string,
  fallback = ""
): string {
  if (value === null || value === undefined || value === "") return fallback;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return wallDate(date, timeZone);
}

/**
 * Inclusive start / exclusive end instant covering one calendar day in the
 * clinic's zone. Replaces naive `${date}T00:00:00` string comparisons, which
 * drift across DST and zone boundaries.
 */
export function dayBoundsUtc(date: string, timeZone: string): {
  start: Date;
  end: Date;
} {
  const [y, m, d] = date.split("-").map(Number);

  const wall = (yy: number, mm: number, dd: number): WallClock => ({
    year: yy,
    month: mm,
    day: dd,
    hour: 0,
    minute: 0,
    second: 0,
  });

  // Calendar arithmetic in UTC-as-plain-dates: month lengths, leap years and
  // year rollovers all fall out correctly because we never touch the zone here.
  const next = new Date(Date.UTC(y, m - 1, d + 1));

  return {
    start: instantForWallClock(wall(y, m, d), timeZone),
    end: instantForWallClock(
      wall(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
      timeZone
    ),
  };
}