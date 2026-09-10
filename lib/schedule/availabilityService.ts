import { supabase } from "@/lib/supabase";

export interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  doctorId: string;
  date: string;
}

interface DoctorSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

interface AppointmentRecord {
  date: string;
  duration: number;
  status: string;
  booking_status: string;
}

const ACTIVE_APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
];

function getDayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00`).getDay();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

function formatDisplayTime(time: string): string {
  const [hoursString, minutes] = time.split(":");
  const hours = Number(hoursString);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours.toString().padStart(2, "0")}:${minutes} ${period}`;
}

export async function getAvailableSlots(
  doctorId: string,
  date: string
): Promise<AvailableSlot[]> {
  const dayOfWeek = getDayOfWeek(date);

  const { data: schedule, error: scheduleError } = await supabase
    .from("doctor_schedules")
    .select("day_of_week, start_time, end_time, slot_duration, is_active")
    .eq("doctor_id", doctorId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  if (!schedule || !schedule.is_active) {
    return [];
  }

  const startMinutes = timeToMinutes(schedule.start_time);
  const endMinutes = timeToMinutes(schedule.end_time);
  const slotDuration = schedule.slot_duration;

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("date, duration, status, booking_status")
    .eq("doctor_id", doctorId)
    .gte("date", `${date}T00:00:00`)
    .lt("date", `${date}T23:59:59.999`);

  if (appointmentsError) {
    throw new Error(appointmentsError.message);
  }

  const activeAppointments: AppointmentRecord[] = (appointments ?? []).filter(
    (appointment) =>
      ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status) &&
      appointment.booking_status !== "REJECTED"
  );

  const slots: AvailableSlot[] = [];

  for (
    let currentMinutes = startMinutes;
    currentMinutes + slotDuration <= endMinutes;
    currentMinutes += slotDuration
  ) {
    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + slotDuration;

    const isBooked = activeAppointments.some((appointment) => {
      const appointmentDate = new Date(appointment.date);

      const appointmentStart =
        appointmentDate.getHours() * 60 + appointmentDate.getMinutes();

      const appointmentEnd = appointmentStart + appointment.duration;

      return appointmentStart < slotEnd && appointmentEnd > slotStart;
    });

    const startTime = minutesToTime(slotStart);
    const endTime = minutesToTime(slotEnd);

    slots.push({
      time: formatDisplayTime(startTime),
      startTime,
      endTime,
      isAvailable: !isBooked,
      doctorId,
      date,
    });
  }

  return slots;
}