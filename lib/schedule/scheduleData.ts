export type SlotStatus = "AVAILABLE" | "BOOKED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export interface ScheduleSlot {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorNameAr: string;
  dayEn: string;      // e.g. "Sunday"
  dayAr: string;      // e.g. "الأحد"
  time: string;       // e.g. "09:00 AM"
  durationMinutes: number;
  status: SlotStatus;

  /** Present only when the slot is backed by a real appointment row. */
  appointmentId?: string;

  // Patient info (if booked)
  patientName?: string;
  patientNameAr?: string;
  patientPhone?: string;
  patientAge?: number;
  appointmentType?: string;
  appointmentTypeAr?: string;
  fee?: number;
  notes?: string;
}

/** `dayOfWeek` matches JavaScript's `Date.getDay()` / `doctor_schedules.day_of_week`. */
export const WEEK_DAYS = [
  { en: "Saturday", ar: "السبت", shortEn: "Sat", shortAr: "سبت", dayOfWeek: 6 },
  { en: "Sunday", ar: "الأحد", shortEn: "Sun", shortAr: "أحد", dayOfWeek: 0 },
  { en: "Monday", ar: "الاثنين", shortEn: "Mon", shortAr: "اثنين", dayOfWeek: 1 },
  { en: "Tuesday", ar: "الثلاثاء", shortEn: "Tue", shortAr: "ثلاثاء", dayOfWeek: 2 },
  { en: "Wednesday", ar: "الأربعاء", shortEn: "Wed", shortAr: "أربعاء", dayOfWeek: 3 },
  { en: "Thursday", ar: "الخميس", shortEn: "Thu", shortAr: "خميس", dayOfWeek: 4 },
  { en: "Friday", ar: "الجمعة", shortEn: "Fri", shortAr: "جمعة", dayOfWeek: 5 },
];
