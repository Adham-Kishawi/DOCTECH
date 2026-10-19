import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import {
  DEFAULT_CLINIC_TIMEZONE,
  dayBoundsUtc,
  wallMinutes,
} from "@/lib/schedule/clinicTime";
import {
  computeDaySlots,
  getDoctorShifts,
  getScheduleException,
  getSlotBlocks,
  type BookedInput,
  type SlotStatusKind,
} from "@/lib/schedule/shiftService";

export interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  /** Why the slot is unavailable: a real booking or a manual block (§7.6). */
  status: SlotStatusKind;
  reason?: string | null;
  appointmentId?: string;
  holdExpiresAt?: string | null;
  doctorId: string;
  date: string;
}

interface AppointmentRecord {
  id?: string;
  appointment_start?: string | null;
  date: string;
  duration: number;
  status: string;
  booking_status: string;
  expires_at?: string | null;
}

/** Slots that block the schedule, including not-yet-expired soft holds. */
export function blocksSlot(appointment: AppointmentRecord): boolean {
  if (appointment.booking_status === "REJECTED") return false;
  if (!["SCHEDULED", "CONFIRMED"].includes(appointment.status)) return false;

  // An expired PENDING_REVIEW request must stop holding the slot even though
  // no background job has cleared its status yet. Expiry governs soft holds
  // only: a confirmed appointment must never be released by a stale timestamp.
  if (appointment.booking_status === "PENDING_REVIEW" && appointment.expires_at) {
    const expiresAt = new Date(appointment.expires_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;
  }

  return true;
}

function formatDisplayTime(time: string): string {
  const [hoursString, minutes] = time.split(":");
  const hours = Number(hoursString);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
}

/**
 * The clinic's IANA zone. Slots are wall-clock times belonging to the clinic,
 * so every comparison against a stored `timestamptz` must be read in this zone
 * rather than in the API server's.
 */
export async function getClinicTimezone(clinicId: string | null | undefined): Promise<string> {
  if (!clinicId) return DEFAULT_CLINIC_TIMEZONE;

  const { data, error } = await supabase
    .from("clinics")
    .select("timezone")
    .eq("id", clinicId)
    .maybeSingle();

  if (error) {
    console.warn("Clinic timezone lookup failed, using default:", error.message);
    return DEFAULT_CLINIC_TIMEZONE;
  }

  const zone = data?.timezone;
  return typeof zone === "string" && zone.length > 0 ? zone : DEFAULT_CLINIC_TIMEZONE;
}

/**
 * Reads one doctor's appointments for a clinic-local day.
 *
 * Prefers `appointment_start`, the indexed column the exclusion constraint
 * operates on. If that column is absent — the migration has not been applied
 * yet — falls back to `date`, widened by a day, and lets the caller do all
 * in-zone filtering in memory. Never throws: availability degrades to
 * "everything open" rather than failing the booking screen.
 */
async function fetchDayAppointments(
  doctorId: string,
  date: string,
  timeZone: string
): Promise<AppointmentRecord[]> {
  const { start, end } = dayBoundsUtc(date, timeZone);
  // Widen on both sides so a naive `date` written in the wrong zone still lands
  // inside the window when the fallback path is taken.
  const windowMs = 24 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .from("appointments")
    .select("id, date, duration, status, booking_status, expires_at, appointment_start")
    .eq("doctor_id", doctorId)
    .gte("appointment_start", start.toISOString())
    .lt("appointment_start", end.toISOString());

  if (!error) {
    return (data ?? []) as AppointmentRecord[];
  }

  if (error.code !== "PGRST204" && !/appointment_start/.test(error.message)) {
    console.error("Availability query failed:", error.message);
    return [];
  }

  console.warn(
    "appointments.appointment_start not available (migration not applied); falling back to date"
  );

  const fallback = await supabase
    .from("appointments")
    .select("id, date, duration, status, booking_status, expires_at")
    .eq("doctor_id", doctorId)
    .gte("date", new Date(start.getTime() - windowMs).toISOString())
    .lt("date", new Date(end.getTime() + windowMs).toISOString());

  if (fallback.error) {
    console.error("Availability fallback query failed:", fallback.error.message);
    return [];
  }

  return (fallback.data ?? []) as AppointmentRecord[];
}

function toBookedInputs(records: AppointmentRecord[], timeZone: string): BookedInput[] {
  const booked: BookedInput[] = [];

  for (const appointment of records.filter(blocksSlot)) {
    const instant = appointment.appointment_start
      ? new Date(appointment.appointment_start)
      : new Date(appointment.date);
    if (Number.isNaN(instant.getTime())) continue;

    const startMinutes = wallMinutes(instant, timeZone);
    booked.push({
      startMinutes,
      endMinutes: startMinutes + (appointment.duration || 0),
      appointmentId: appointment.id,
      holdExpiresAt: appointment.expires_at ?? null,
    });
  }

  return booked;
}

/**
 * The full bookable grid for one doctor on one clinic-local day.
 *
 * Composes the doctor's shifts (multi-shift aware), any date exception, manual
 * blocks and existing bookings. If the doctor has no shift configured the day
 * is simply closed — the plan's §7.1 complaint is precisely that the old code
 * invented a silent 09:00–17:00 day in that case.
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
  options: { clinicId?: string | null; timezone?: string } = {}
): Promise<AvailableSlot[]> {
  const timeZone = options.timezone || (await getClinicTimezone(options.clinicId));
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [shifts, exception, blocks, appointments] = await Promise.all([
    getDoctorShifts(doctorId, dayOfWeek),
    getScheduleException(doctorId, date),
    getSlotBlocks(doctorId, date),
    fetchDayAppointments(doctorId, date, timeZone),
  ]);

  const defaultDuration =
    shifts.find((s) => s.slot_duration && s.slot_duration > 0)?.slot_duration ?? 30;

  const computed = computeDaySlots({
    shifts,
    blocks,
    booked: toBookedInputs(appointments, timeZone),
    exception,
    defaultDuration,
  });

  return computed.map((slot) => ({
    time: formatDisplayTime(slot.startTime),
    startTime: slot.startTime,
    endTime: slot.endTime,
    isAvailable: slot.status === "AVAILABLE",
    status: slot.status,
    reason: slot.reason ?? null,
    appointmentId: slot.appointmentId,
    holdExpiresAt: slot.holdExpiresAt ?? null,
    doctorId,
    date,
  }));
}
