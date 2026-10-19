import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  isValidMonthKey,
  monthBounds,
  monthKeyOf,
  previousMonthKey,
  wallClock,
  zonedWallTimeToUtc,
} from "@/lib/finance/period";

const CAIRO = "Africa/Cairo"; // UTC+2 most of the year

describe("finance/period — month keys", () => {
  it("accepts only YYYY-MM", () => {
    expect(isValidMonthKey("2026-10")).toBe(true);
    expect(isValidMonthKey("2026-00")).toBe(false);
    expect(isValidMonthKey("2026-13")).toBe(false);
    expect(isValidMonthKey("2026-10-01")).toBe(false);
    expect(isValidMonthKey(null)).toBe(false);
    expect(isValidMonthKey("")).toBe(false);
  });

  it("puts a 01:00 Cairo instant into the Cairo month, not the UTC month", () => {
    // 2026-10-01T00:30 Cairo = 2026-09-30T22:30Z — UTC would say September.
    expect(monthKeyOf("2026-09-30T22:30:00Z", CAIRO)).toBe("2026-10");
    // Mid-month is unambiguous.
    expect(monthKeyOf("2026-10-15T12:00:00Z", CAIRO)).toBe("2026-10");
  });

  it("returns empty string for an invalid instant", () => {
    expect(monthKeyOf("not-a-date", CAIRO)).toBe("");
  });

  it("walks back across the year boundary", () => {
    expect(previousMonthKey("2026-10")).toBe("2026-09");
    expect(previousMonthKey("2026-01")).toBe("2025-12");
  });

  it("counts real calendar days", () => {
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29); // leap year
    expect(daysInMonth("2026-10")).toBe(31);
    expect(daysInMonth("2026-04")).toBe(30);
  });
});

describe("finance/period — month bounds", () => {
  it("bounds an ordinary month in the clinic's clock", () => {
    const bounds = monthBounds("2026-10", CAIRO);
    expect(wallClock(bounds.start, CAIRO)).toBe("2026-10-01T00:00:00");
    expect(wallClock(bounds.end, CAIRO)).toBe("2026-11-01T00:00:00");
    // Half-open: the first instant of the next month is excluded.
    expect(bounds.end.getTime()).toBeGreaterThan(bounds.start.getTime());
  });

  it("bounds December into the next year", () => {
    const bounds = monthBounds("2026-12", CAIRO);
    expect(wallClock(bounds.start, CAIRO)).toBe("2026-12-01T00:00:00");
    expect(wallClock(bounds.end, CAIRO)).toBe("2027-01-01T00:00:00");
  });
});

describe("finance/period — wall time conversion", () => {
  it("round-trips a Cairo wall time through UTC", () => {
    // January is standard time (UTC+2) in Egypt — no DST ambiguity.
    const utc = zonedWallTimeToUtc("2026-01-05T14:30:00", CAIRO);
    expect(utc.toISOString()).toBe("2026-01-05T12:30:00.000Z");
    expect(wallClock(utc, CAIRO)).toBe("2026-01-05T14:30:00");
  });

  it("round-trips a New York wall time (DST-safe zone)", () => {
    const utc = zonedWallTimeToUtc("2026-07-04T09:00:00", "America/New_York");
    expect(utc.toISOString()).toBe("2026-07-04T13:00:00.000Z");
  });
});
