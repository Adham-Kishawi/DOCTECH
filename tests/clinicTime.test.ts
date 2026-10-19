import { describe, expect, it } from "vitest";
import {
  clinicCalendarDate,
  dayBoundsUtc,
  formatInClinicZone,
  resolveInstant,
  wallDate,
  wallMinutes,
  wallTime,
} from "@/lib/schedule/clinicTime";

const CAIRO = "Africa/Cairo"; // UTC+3 year-round (no DST since 2016)

describe("resolveInstant", () => {
  it("reads a naive timestamp as clinic wall-clock time", () => {
    expect(resolveInstant("2026-10-06T10:00:00", CAIRO).toISOString()).toBe(
      "2026-10-06T07:00:00.000Z"
    );
  });

  it("accepts a space separator", () => {
    expect(resolveInstant("2026-10-06 10:00:00", CAIRO).toISOString()).toBe(
      "2026-10-06T07:00:00.000Z"
    );
  });

  it("honours an explicit Z offset instead of shifting it", () => {
    expect(resolveInstant("2026-10-06T10:00:00Z", CAIRO).toISOString()).toBe(
      "2026-10-06T10:00:00.000Z"
    );
  });

  it("honours an explicit numeric offset", () => {
    expect(resolveInstant("2026-10-06T10:00:00+02:00", CAIRO).toISOString()).toBe(
      "2026-10-06T08:00:00.000Z"
    );
  });

  it("falls back to Date parsing for input it cannot parse", () => {
    expect(resolveInstant("not a date", CAIRO).getTime()).toBeNaN();
  });
});

describe("wall-clock readers", () => {
  const instant = new Date("2026-10-06T07:30:00Z"); // 10:30 in Cairo

  it("reads minutes since midnight in the clinic zone", () => {
    expect(wallMinutes(instant, CAIRO)).toBe(10 * 60 + 30);
  });

  it("reads hh:mm in the clinic zone", () => {
    expect(wallTime(instant, CAIRO)).toBe("10:30");
  });

  it("reads the calendar day in the clinic zone, not in UTC", () => {
    expect(wallDate(instant, CAIRO)).toBe("2026-10-06");
    // 22:00 UTC is already the next day in Cairo.
    expect(wallDate(new Date("2026-10-05T22:00:00Z"), CAIRO)).toBe("2026-10-06");
    // …and still the previous day in Los Angeles.
    expect(wallDate(new Date("2026-10-06T02:00:00Z"), "America/Los_Angeles")).toBe(
      "2026-10-05"
    );
  });
});

describe("formatInClinicZone", () => {
  it("formats an instant in the clinic zone", () => {
    expect(
      formatInClinicZone("2026-10-06T07:00:00Z", CAIRO, {
        hour: "2-digit",
        minute: "2-digit",
      })
    ).toBe("10:00 AM");
    expect(
      formatInClinicZone(
        "2026-10-06T07:00:00Z",
        CAIRO,
        { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
        "en-US"
      )
    ).toBe("10:00");
    expect(
      formatInClinicZone("2026-10-06T22:00:00Z", CAIRO, {
        hour: "2-digit",
        minute: "2-digit",
      })
    ).toBe("01:00 AM");
  });

  it("returns the fallback for null, empty or unparseable input", () => {
    expect(formatInClinicZone(null, CAIRO, {}, "en-US", "-")).toBe("-");
    expect(formatInClinicZone(undefined, CAIRO, {}, "en-US", "-")).toBe("-");
    expect(formatInClinicZone("", CAIRO, {}, "en-US", "-")).toBe("-");
    expect(formatInClinicZone("nope", CAIRO, {}, "en-US", "-")).toBe("-");
  });

  it("swallows an unknown zone instead of throwing", () => {
    expect(
      formatInClinicZone("2026-10-06T07:00:00Z", "Not/AZone", {}, "en-US", "-")
    ).toBe("-");
  });
});

describe("clinicCalendarDate", () => {
  it("keeps a date-only string as a calendar date", () => {
    expect(clinicCalendarDate("2026-10-06", CAIRO)).toBe("2026-10-06");
  });

  it("resolves an instant to the clinic's day", () => {
    expect(clinicCalendarDate("2026-10-05T22:00:00Z", CAIRO)).toBe("2026-10-06");
  });

  it("returns the fallback for unusable input", () => {
    expect(clinicCalendarDate(null, CAIRO, "-")).toBe("-");
    expect(clinicCalendarDate("", CAIRO, "-")).toBe("-");
    expect(clinicCalendarDate("nope", CAIRO, "-")).toBe("-");
  });
});

describe("dayBoundsUtc", () => {
  it("covers the clinic's day, not UTC's", () => {
    const { start, end } = dayBoundsUtc("2026-10-06", CAIRO);
    expect(start.toISOString()).toBe("2026-10-05T21:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-06T21:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("covers the clinic's day across a month boundary (winter, UTC+2)", () => {
    const { start, end } = dayBoundsUtc("2026-01-01", CAIRO);
    expect(start.toISOString()).toBe("2025-12-31T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-01T22:00:00.000Z");
  });

  it("follows the zone through DST (summer is UTC+3, winter UTC+2)", () => {
    expect(dayBoundsUtc("2026-07-06", CAIRO).start.toISOString()).toBe(
      "2026-07-05T21:00:00.000Z"
    );
    expect(dayBoundsUtc("2026-01-06", CAIRO).start.toISOString()).toBe(
      "2026-01-05T22:00:00.000Z"
    );
  });

  it("is inclusive at the start and exclusive at the end", () => {
    const { start, end } = dayBoundsUtc("2026-10-06", CAIRO);
    expect(wallDate(start, CAIRO)).toBe("2026-10-06");
    expect(wallDate(new Date(end.getTime() - 1), CAIRO)).toBe("2026-10-06");
    expect(wallDate(end, CAIRO)).toBe("2026-10-07");
  });
});
