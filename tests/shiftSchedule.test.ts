import { describe, expect, it } from "vitest";
import {
  computeDaySlots,
  isMissingSchema,
  minutesToTime,
  timeToMinutes,
  type BookedInput,
  type BlockInput,
} from "@/lib/schedule/shiftService";
import { isExpiredHold } from "@/lib/schedule/holds";

const booked = (startMinutes: number, endMinutes: number): BookedInput => ({ startMinutes, endMinutes });

describe("time helpers", () => {
  it("converts HH:MM to minutes and back", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(minutesToTime(570)).toBe("09:30");
    expect(timeToMinutes("00:00")).toBe(0);
    expect(minutesToTime(0)).toBe("00:00");
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(minutesToTime(1439)).toBe("23:59");
  });

  it("flags a malformed time", () => {
    expect(timeToMinutes("9:30")).toBe(570);
    expect(timeToMinutes("abc")).toBeNaN();
    expect(timeToMinutes("ab:cd")).toBeNaN();
  });
});

describe("computeDaySlots — single shift grid", () => {
  it("emits one slot per duration step", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "11:00", slot_duration: 30 }],
    });
    expect(slots).toHaveLength(4);
    expect(slots.map((s) => s.startTime)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(slots.every((s) => s.status === "AVAILABLE")).toBe(true);
    expect(slots[0].endTime).toBe("09:30");
  });

  it("skips a reversed shift and an inactive shift", () => {
    expect(
      computeDaySlots({ shifts: [{ start_time: "11:00", end_time: "09:00" }] })
    ).toHaveLength(0);
    expect(
      computeDaySlots({
        shifts: [{ start_time: "09:00", end_time: "11:00", is_active: false }],
      })
    ).toHaveLength(0);
  });

  it("uses the per-shift duration", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "10:00", slot_duration: 15 }],
    });
    expect(slots).toHaveLength(4);
  });
});

describe("computeDaySlots — multi shift", () => {
  it("combines a morning and an evening shift, ordered", () => {
    const slots = computeDaySlots({
      shifts: [
        { start_time: "14:00", end_time: "16:00", slot_duration: 30 },
        { start_time: "09:00", end_time: "11:00", slot_duration: 30 },
      ],
    });
    expect(slots).toHaveLength(8);
    const starts = slots.map((s) => s.startTime);
    expect(starts[0]).toBe("09:00");
    expect(starts).toContain("14:30");
    expect(new Set(starts).size).toBe(starts.length);
  });

  it("deduplicates a start that falls inside two overlapping shifts", () => {
    const slots = computeDaySlots({
      shifts: [
        { start_time: "09:00", end_time: "12:00", slot_duration: 30 },
        { start_time: "09:30", end_time: "10:30", slot_duration: 30 },
      ],
    });
    const starts = slots.map((s) => s.startTime);
    expect(startCount(starts, "09:30")).toBe(1);
  });
});

describe("computeDaySlots — exceptions", () => {
  it.each(["HOLIDAY", "LEAVE", "CONFERENCE"] as const)("%s closes the whole day", (type) => {
    expect(
      computeDaySlots({
        shifts: [{ start_time: "09:00", end_time: "17:00" }],
        exception: { exception_type: type },
      })
    ).toHaveLength(0);
  });

  it("an EXTRA_SHIFT adds slots on top of the regular shifts", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "10:00", slot_duration: 30 }],
      exception: {
        exception_type: "EXTRA_SHIFT",
        start_time: "14:00",
        end_time: "15:00",
      },
      defaultDuration: 30,
    });
    expect(slots.map((s) => s.startTime)).toEqual(["09:00", "09:30", "14:00", "14:30"]);
  });

  it("ignores a malformed EXTRA_SHIFT", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "10:00" }],
      exception: { exception_type: "EXTRA_SHIFT", start_time: "14:00", end_time: "13:00" },
    });
    expect(slots).toHaveLength(2);
  });
});

describe("computeDaySlots — blocks and bookings", () => {
  const block = (start_time: string, end_time: string): BlockInput => ({ start_time, end_time });

  it("marks every interior slot blocked", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "12:00", slot_duration: 30 }],
      blocks: [block("10:00", "11:00")],
    });
    const blockedStarts = slots.filter((s) => s.status === "BLOCKED").map((s) => s.startTime);
    expect(blockedStarts).toEqual(["10:00", "10:30"]);
    expect(slots.find((s) => s.startTime === "09:30")?.status).toBe("AVAILABLE");
  });

  it("carries the block reason to the slot", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "10:00" }],
      blocks: [block("09:00", "10:00")],
    });
    expect(slots[0].reason).toBeNull();
  });

  it("marks a slot BOOKED when an existing appointment overlaps it", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "11:00", slot_duration: 30 }],
      booked: [booked(570, 600)],
    });
    expect(slots.find((s) => s.startTime === "09:30")?.status).toBe("BOOKED");
    expect(slots.find((s) => s.startTime === "10:30")?.status).toBe("AVAILABLE");
  });

  it("lets a block beat a booking on the same cell", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "10:00", slot_duration: 30 }],
      booked: [booked(540, 570)],
      blocks: [block("09:00", "10:00")],
    });
    expect(slots[0].status).toBe("BLOCKED");
    expect(slots[0].appointmentId).toBeUndefined();
  });

  it("reports the booking id on a booked slot", () => {
    const slots = computeDaySlots({
      shifts: [{ start_time: "09:00", end_time: "10:00", slot_duration: 30 }],
      booked: [{ startMinutes: 540, endMinutes: 570, appointmentId: "apt-1" }],
    });
    expect(slots[0].appointmentId).toBe("apt-1");
  });
});

describe("isMissingSchema", () => {
  it("recognises the error shapes migrations produce", () => {
    expect(isMissingSchema({ code: "42P01" })).toBe(true);
    expect(isMissingSchema({ code: "PGRST205" })).toBe(true);
    expect(isMissingSchema({ message: "relation does not exist" })).toBe(true);
    expect(isMissingSchema({ message: "schema cache" })).toBe(true);
    expect(isMissingSchema({ message: "boom" })).toBe(false);
    expect(isMissingSchema(null)).toBe(false);
  });
});

describe("isExpiredHold", () => {
  const at = (ms: number) => new Date(ms).toISOString();
  const now = Date.parse("2026-10-10T12:00:00Z");

  it("is true only for a pending hold past its deadline", () => {
    expect(isExpiredHold({ id: "a", booking_status: "PENDING_REVIEW", expires_at: at(now - 1000) }, now)).toBe(true);
    expect(isExpiredHold({ id: "a", booking_status: "PENDING_REVIEW", expires_at: at(now + 1000) }, now)).toBe(false);
    expect(isExpiredHold({ id: "a", booking_status: "APPROVED", expires_at: at(now - 1000) }, now)).toBe(false);
  });

  it("never expires a hold without a usable timestamp", () => {
    expect(isExpiredHold({ id: "a", booking_status: "PENDING_REVIEW", expires_at: null }, now)).toBe(false);
    expect(isExpiredHold({ id: "a", booking_status: "PENDING_REVIEW", expires_at: "garbage" }, now)).toBe(false);
    expect(isExpiredHold({ id: "a", booking_status: "PENDING_REVIEW" }, now)).toBe(false);
  });
});

function startCount(starts: string[], value: string): number {
  return starts.filter((s) => s === value).length;
}