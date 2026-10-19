import "server-only";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { createNotification } from "@/lib/serverNotifications";
import { formatInClinicZone, DEFAULT_CLINIC_TIMEZONE } from "@/lib/schedule/clinicTime";
import type { NotificationType } from "@/types/index";

/**
 * Appointment notifications (plan §7.6).
 *
 * What the patient receives is built purely here so the text and the number
 * rules can be unit-tested without touching Supabase. Every WhatsApp send is
 * best-effort: WhatsApp is frequently unconfigured, so a failed send must never
 * fail the HTTP request that triggered it.
 */

export type AppointmentNotificationKind =
  | "confirmation"
  | "cancellation"
  | "reminder-24h"
  | "reminder-2h";

export interface AppointmentMessageContext {
  clinicName: string;
  doctorName: string;
  patientName: string;
  /** ISO instant of the appointment's start. */
  startIso: string;
  timeZone: string;
}

/**
 * Normalises a phone number to E.164 (+CC...). Tolerates leading zeros and the
 * `+`/»00` international prefixes. Returns null when nothing usable remains.
 */
export function toE164(phone: string, countryCode = "20"): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) return `+${countryCode}${digits.slice(2)}`;
  if (digits.startsWith(countryCode)) return `+${digits}`;
  if (digits.startsWith("0")) return `+${countryCode}${digits.slice(1)}`;
  return `+${countryCode}${digits}`;
}

function formatWhen(ctx: AppointmentMessageContext): { date: string; time: string } {
  return {
    date: formatInClinicZone(
      ctx.startIso,
      ctx.timeZone,
      { weekday: "long", day: "numeric", month: "long", year: "numeric" },
      "ar-EG",
      ""
    ),
    time: formatInClinicZone(
      ctx.startIso,
      ctx.timeZone,
      { hour: "2-digit", minute: "2-digit" },
      "en-GB",
      ""
    ),
  };
}

/** The exact text a patient receives for a given kind. */
export function appointmentMessage(kind: AppointmentNotificationKind, ctx: AppointmentMessageContext): string {
  const { date, time } = formatWhen(ctx);

  switch (kind) {
    case "confirmation":
      return (
        `${ctx.patientName}،\n\n` +
        `تم تأكيد موعدك في عيادة ${ctx.clinicName} مع ${ctx.doctorName} يوم ${date} الساعة ${time}.\n` +
        `للتعديل أو الإلغاء، راسلنا على هذا الرقم.`
      );
    case "cancellation":
      return (
        `${ctx.patientName}،\n\n` +
        `أُلغِي موعدك في عيادة ${ctx.clinicName} مع ${ctx.doctorName} يوم ${date} الساعة ${time}.\n` +
        `يمكنك حجز موعد جديد في أي وقت، نعتذر عن أي إزعاج.`
      );
    case "reminder-24h":
    case "reminder-2h":
      return (
        `${ctx.patientName}،\n\n` +
        `تذكير بموعدك يوم ${date} الساعة ${time} في عيادة ${ctx.clinicName} مع ${ctx.doctorName}.\n` +
        `إذا تغيّرت خططك، راسلنا لتعديل الموعد.`
      );
  }
}

export interface AppointmentNotificationResult {
  status: "sent" | "skipped";
  reason?: "no-phone" | "no-consent" | "whatsapp-unconfigured" | string;
}

interface AppointmentForNotify {
  clinic_id: string;
  doctor_id: string | null;
  patient_id: string | null;
  appointment_start: string | null;
  patients?: { name: string; phone: string | null; whatsapp_consent?: boolean } | null;
  doctors?: { name: string } | null;
  clinics?: { name: string; timezone?: string | null } | null;
}

/**
 * Delivers an appointment notification: WhatsApp to the patient (when allowed)
 * plus an in-app staff notification. Never throws.
 *
 * Reminder kinds require the patient's WhatsApp opt-in; confirmations and
 * cancellations are transactional and only require a phone number.
 */
export async function sendAppointmentNotification(
  appointmentId: string,
  kind: AppointmentNotificationKind
): Promise<AppointmentNotificationResult> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "clinic_id, doctor_id, patient_id, appointment_start, " +
        "patients(name, phone, whatsapp_consent), doctors(name), clinics(name, timezone)"
    )
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) {
    console.warn("Appointment notification: load failed", error?.message ?? "not found");
    return { status: "skipped", reason: "not-found" };
  }

  const row = data as unknown as AppointmentForNotify;
  const patient = row.patients;
  const phone = patient?.phone ?? null;

  if (!phone || !row.appointment_start) {
    return { status: "skipped", reason: "no-phone" };
  }

  const requiresConsent = kind.startsWith("reminder");
  if (requiresConsent && patient?.whatsapp_consent !== true) {
    return { status: "skipped", reason: "no-consent" };
  }

  const e164 = toE164(phone);
  if (!e164) return { status: "skipped", reason: "no-phone" };

  const timeZone = row.clinics?.timezone || DEFAULT_CLINIC_TIMEZONE;
  const text = appointmentMessage(kind, {
    clinicName: row.clinics?.name || "العيادة",
    doctorName: row.doctors?.name || (row.doctor_id ? "الطبيب" : "العيادة"),
    patientName: patient?.name || "صديقنا",
    startIso: row.appointment_start,
    timeZone,
  });

  // In-app staff notification first — it must survive a WhatsApp failure.
  const staffType: NotificationType =
    kind === "cancellation" ? "APPOINTMENT_CANCELLED" : "NEW_APPOINTMENT";
  try {
    await createNotification({
      clinicId: row.clinic_id,
      role: "doctor",
      doctorId: row.doctor_id ?? undefined,
      type: staffType,
      title: kind === "cancellation" ? "Appointment cancelled" : "New appointment",
      titleAr:
        kind === "cancellation"
          ? "تم إلغاء موعد"
          : kind.startsWith("reminder")
            ? "تذكير موعد"
            : "موعد جديد",
      body: `${patient?.name ?? "Patient"} — ${text.slice(0, 90)}…`,
      link: "/doctor/appointments",
    });
  } catch (notifErr) {
    console.warn("Appointment notification: in-app write failed", notifErr);
  }

  const sent = await sendWhatsAppMessage({ to: e164, message: text });
  if (!sent.success) {
    return { status: "skipped", reason: sent.error ?? "whatsapp-unconfigured" };
  }

  return { status: "sent" };
}

/** Which appointments the reminder cron should sweep, per kind, in one window. */
export function reminderWindow(
  kind: "reminder-24h" | "reminder-2h",
  now: Date = new Date()
): { gteISO: string; ltISO: string } {
  const ms = now.getTime();
  if (kind === "reminder-2h") {
    return { gteISO: new Date(ms).toISOString(), ltISO: new Date(ms + 2 * 3_600_000).toISOString() };
  }
  return {
    gteISO: new Date(ms + 22 * 3_600_000).toISOString(),
    ltISO: new Date(ms + 26 * 3_600_000).toISOString(),
  };
}