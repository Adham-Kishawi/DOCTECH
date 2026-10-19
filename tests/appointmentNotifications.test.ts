import { describe, expect, it } from "vitest";
import {
  appointmentMessage,
  reminderWindow,
  toE164,
} from "@/lib/schedule/appointmentNotifications";

const ctx = {
  clinicName: "عيادة السلام",
  doctorName: "د. أحمد",
  patientName: "محمد",
  startIso: "2026-10-07T08:00:00.000Z",
  timeZone: "Africa/Cairo",
};

describe("toE164", () => {
  it("normalises a local Egyptian number", () => {
    expect(toE164("01012345678")).toBe("+201012345678");
    expect(toE164("010 1234 5678")).toBe("+201012345678");
  });

  it("keeps a number that already carries the country code", () => {
    expect(toE164("201012345678")).toBe("+201012345678");
    expect(toE164("+201012345678")).toBe("+201012345678");
    expect(toE164("201 0123 45678")).toBe("+201012345678");
  });

  it("returns null for an empty phone", () => {
    expect(toE164("")).toBeNull();
    expect(toE164("---")).toBeNull();
  });
});

describe("appointmentMessage", () => {
  it("confirmation names the patient, clinic, doctor and appointment time", () => {
    const text = appointmentMessage("confirmation", ctx);
    expect(text).toContain("محمد");
    expect(text).toContain("عيادة السلام");
    expect(text).toContain("د. أحمد");
    expect(text).toMatch(/\d{1,2}:\d{2}/);
  });

  it("cancellation asks the patient to rebook", () => {
    expect(appointmentMessage("cancellation", ctx)).toContain("يمكنك حجز موعد جديد");
  });

  it.each(["reminder-24h", "reminder-2h"] as const)("%s is a reminder", (kind) => {
    expect(appointmentMessage(kind, ctx)).toContain("تذكير");
  });
});

describe("reminderWindow", () => {
  const now = new Date("2026-10-10T10:00:00Z");
  const twoHours = reminderWindow("reminder-2h", now);
  const dayBefore = reminderWindow("reminder-24h", now);

  it("the 2h window covers the next two hours", () => {
    expect(twoHours.gteISO).toBe(now.toISOString());
    expect(twoHours.ltISO).toBe("2026-10-10T12:00:00.000Z");
  });

  it("the 24h window sits a day ahead, wide enough for daily cron drift", () => {
    expect(dayBefore.gteISO).toBe("2026-10-11T08:00:00.000Z");
    expect(dayBefore.ltISO).toBe("2026-10-11T12:00:00.000Z");
  });
});