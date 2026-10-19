import { describe, expect, it } from "vitest";
import { blocksSlot } from "@/lib/schedule/availabilityService";

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();
const oneHourAgo = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();

const base = {
  date: "2026-10-06",
  duration: 30,
};

describe("blocksSlot", () => {
  it("blocks a scheduled appointment", () => {
    expect(
      blocksSlot({ ...base, status: "SCHEDULED", booking_status: "APPROVED" })
    ).toBe(true);
  });

  it("blocks a confirmed appointment", () => {
    expect(
      blocksSlot({ ...base, status: "CONFIRMED", booking_status: "APPROVED" })
    ).toBe(true);
  });

  it("does not block a cancelled appointment", () => {
    expect(
      blocksSlot({ ...base, status: "CANCELLED", booking_status: "APPROVED" })
    ).toBe(false);
  });

  it("does not block a completed appointment", () => {
    expect(
      blocksSlot({ ...base, status: "COMPLETED", booking_status: "APPROVED" })
    ).toBe(false);
  });

  it("does not block a no-show", () => {
    expect(
      blocksSlot({ ...base, status: "NO_SHOW", booking_status: "APPROVED" })
    ).toBe(false);
  });

  it("does not block a rejected booking", () => {
    expect(
      blocksSlot({ ...base, status: "SCHEDULED", booking_status: "REJECTED" })
    ).toBe(false);
  });

  it("blocks a soft hold whose expiry is still in the future", () => {
    expect(
      blocksSlot({
        ...base,
        status: "SCHEDULED",
        booking_status: "PENDING_REVIEW",
        expires_at: inOneHour(),
      })
    ).toBe(true);
  });

  it("releases a soft hold whose expiry has passed", () => {
    expect(
      blocksSlot({
        ...base,
        status: "SCHEDULED",
        booking_status: "PENDING_REVIEW",
        expires_at: oneHourAgo(),
      })
    ).toBe(false);
  });

  it("keeps a soft hold without an expiry", () => {
    expect(
      blocksSlot({
        ...base,
        status: "SCHEDULED",
        booking_status: "PENDING_REVIEW",
      })
    ).toBe(true);
  });

  it("keeps a soft hold with an unparseable expiry", () => {
    expect(
      blocksSlot({
        ...base,
        status: "SCHEDULED",
        booking_status: "PENDING_REVIEW",
        expires_at: "not-a-timestamp",
      })
    ).toBe(true);
  });

  it("releases a hold on an appointment that is no longer pending", () => {
    expect(
      blocksSlot({
        ...base,
        status: "CANCELLED",
        booking_status: "PENDING_REVIEW",
        expires_at: oneHourAgo(),
      })
    ).toBe(false);
  });

  it("treats a null expiry as no expiry", () => {
    expect(
      blocksSlot({
        ...base,
        status: "SCHEDULED",
        booking_status: "PENDING_REVIEW",
        expires_at: null,
      })
    ).toBe(true);
  });
});
