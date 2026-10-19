import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

/**
 * Shift-aware slot construction (plan §7.2).
 *
 * Kept free of React and of the request lifecycle so the whole algorithm — the
 * part that decides whether a time is bookable — is unit-testable. The Supabase
 * reads at the bottom degrade to "no configuration" rather than throwing, so a
 * database that has not run migration 0007 still serves the booking screen.
 */

export type SlotStatusKind = "AVAILABLE" | "BOOKED" | "BLOCKED";

export type ExceptionType = "HOLIDAY" | "LEAVE" | "CONFERENCE" | "EXTRA_SHIFT";

export interface ShiftInput {
  start_time: string;
  end_time: string;
  slot_duration?: number | null;
  is_active?: boolean | null;
}

export interface BlockInput {
  start_time: string;
  end_time: string;
  reason?: string | null;
}

export interface BookedInput {
  startMinutes: number;
  endMinutes: number;
  appointmentId?: string;
  holdExpiresAt?: string | null;
}

export interface ExceptionInput {
  exception_type: ExceptionType;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
}

export interface ComputedSlot {
  startMinutes: number;
  endMinutes: number;
  /** "HH:MM" wall-clock in the clinic's zone. */
  startTime: string;
  endTime: string;
  status: SlotStatusKind;
  appointmentId?: string;
  reason?: string | null;
  holdExpiresAt?: string | null;
}

export interface ComputeDaySlotsParams {
  shifts: ShiftInput[];
  blocks?: BlockInput[];
  booked?: BookedInput[];
  exception?: ExceptionInput | null;
  /** Slot duration for an EXTRA_SHIFT, which carries no duration of its own. */
  defaultDuration?: number;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/** Exceptions that remove the whole day. */
const DAY_CLOSING_EXCEPTIONS: ExceptionType[] = ["HOLIDAY", "LEAVE", "CONFERENCE"];

/**
 * Builds the day's slot grid from every shift, then labels each slot with why it
 * is unavailable. Precedence is BLOCKED > BOOKED > AVAILABLE: a manual block is
 * a deliberate "the doctor is busy", so it wins over a booking that merely
 * overlaps the same grid cell.
 */
export function computeDaySlots(params: ComputeDaySlotsParams): ComputedSlot[] {
  const { shifts, blocks = [], booked = [], exception = null } = params;
  const defaultDuration = params.defaultDuration && params.defaultDuration > 0
    ? params.defaultDuration
    : 30;

  // A holiday / leave / conference removes the day outright, even with shifts
  // configured. An EXTRA_SHIFT adds to them instead.
  if (exception && DAY_CLOSING_EXCEPTIONS.includes(exception.exception_type)) {
    return [];
  }

  const effectiveShifts: ShiftInput[] = shifts.filter((s) => s.is_active !== false);

  if (exception?.exception_type === "EXTRA_SHIFT" && exception.start_time && exception.end_time) {
    effectiveShifts.push({
      start_time: exception.start_time,
      end_time: exception.end_time,
      slot_duration: defaultDuration,
      is_active: true,
    });
  }

  // One grid cell per distinct start minute, so overlapping morning/evening or
  // extra-shift windows never produce a duplicated slot.
  const slotStarts = new Map<number, { start: number; end: number }>();

  for (const shift of effectiveShifts) {
    const shiftStart = timeToMinutes(shift.start_time);
    const shiftEnd = timeToMinutes(shift.end_time);
    const duration = shift.slot_duration && shift.slot_duration > 0 ? shift.slot_duration : defaultDuration;

    if (!Number.isFinite(shiftStart) || !Number.isFinite(shiftEnd) || shiftEnd <= shiftStart) {
      continue;
    }

    for (let start = shiftStart; start + duration <= shiftEnd; start += duration) {
      if (!slotStarts.has(start)) {
        slotStarts.set(start, { start, end: start + duration });
      }
    }
  }

  const orderedStarts = [...slotStarts.keys()].sort((a, b) => a - b);

  return orderedStarts.map((start) => {
    const { end } = slotStarts.get(start)!;

    const block = blocks.find((b) => {
      const bs = timeToMinutes(b.start_time);
      const be = timeToMinutes(b.end_time);
      return Number.isFinite(bs) && Number.isFinite(be) && bs < end && be > start;
    });

    const booking = booked.find((a) => a.startMinutes < end && a.endMinutes > start);

    let status: SlotStatusKind = "AVAILABLE";
    let appointmentId: string | undefined;
    let reason: string | null | undefined;
    let holdExpiresAt: string | null | undefined;

    if (block) {
      status = "BLOCKED";
      reason = block.reason ?? null;
    } else if (booking) {
      status = "BOOKED";
      appointmentId = booking.appointmentId;
      holdExpiresAt = booking.holdExpiresAt ?? null;
    }

    return {
      startMinutes: start,
      endMinutes: end,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      status,
      appointmentId,
      reason,
      holdExpiresAt,
    };
  });
}

/** True when a Supabase error means the table/column has not been migrated yet. */
export function isMissingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const message = error.message ?? "";
  return (
    code === "42P01" || // undefined_table
    code === "PGRST205" || // PostgREST: table not found in schema cache
    code === "PGRST204" || // PostgREST: column not found
    /does not exist|schema cache/i.test(message)
  );
}

/**
 * The doctor's active shifts for a weekday. Falls back to the legacy single
 * `doctor_schedules` row when `doctor_shifts` is absent, and to nothing when
 * neither is configured — the caller decides what "no schedule" means instead
 * of this silently inventing 09:00–17:00 (the fallback the plan flags in §7.1).
 */
export async function getDoctorShifts(doctorId: string, dayOfWeek: number): Promise<ShiftInput[]> {
  const { data, error } = await supabase
    .from("doctor_shifts")
    .select("start_time, end_time, slot_duration, is_active")
    .eq("doctor_id", doctorId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .order("start_time", { ascending: true });

  if (!error) {
    return (data ?? []) as ShiftInput[];
  }

  if (!isMissingSchema(error)) {
    console.error("doctor_shifts read failed:", error.message);
    return [];
  }

  const { data: legacy, error: legacyError } = await supabase
    .from("doctor_schedules")
    .select("start_time, end_time, slot_duration, is_active")
    .eq("doctor_id", doctorId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle();

  if (legacyError) {
    if (!isMissingSchema(legacyError)) {
      console.error("doctor_schedules fallback failed:", legacyError.message);
    }
    return [];
  }

  return legacy ? [legacy as ShiftInput] : [];
}

/** A single-date override, if any. Absent tables yield `null`. */
export async function getScheduleException(
  doctorId: string,
  date: string
): Promise<ExceptionInput | null> {
  const { data, error } = await supabase
    .from("schedule_exceptions")
    .select("exception_type, start_time, end_time, reason")
    .eq("doctor_id", doctorId)
    .eq("exception_date", date)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isMissingSchema(error)) {
      console.error("schedule_exceptions read failed:", error.message);
    }
    return null;
  }

  return (data as ExceptionInput) ?? null;
}

/** Manual blocks for one date. Absent tables yield `[]`. */
export async function getSlotBlocks(doctorId: string, date: string): Promise<BlockInput[]> {
  const { data, error } = await supabase
    .from("slot_blocks")
    .select("start_time, end_time, reason")
    .eq("doctor_id", doctorId)
    .eq("blocked_date", date);

  if (error) {
    if (!isMissingSchema(error)) {
      console.error("slot_blocks read failed:", error.message);
    }
    return [];
  }

  return (data ?? []) as BlockInput[];
}
