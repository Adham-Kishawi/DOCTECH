import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import {
  reminderWindow,
  sendAppointmentNotification,
} from "@/lib/schedule/appointmentNotifications";
import { isMissingSchema } from "@/lib/schedule/shiftService";

export const dynamic = "force-dynamic";

/**
 * Sends the 24-hour and 2-hour appointment reminders (plan §7.6).
 *
 * Delivery uses the same consent gate as every other reminder: a patient
 * without `whatsapp_consent` is skipped. Idempotency comes from the
 * `reminder_24h_sent_at` / `reminder_2h_sent_at` markers, so a cron that runs
 * more often than the windows does not double-send.
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ reminder-24h:  appointments starting in [now+22h, now+26h)   │
 *   │ reminder-2h:   appointments starting in [now,    now+2h)     │
 *   └──────────────────────────────────────────────────────────────┘
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization") || "";

    let clinicId: string | null = null;
    if (!(cronSecret && authHeader === `Bearer ${cronSecret}`)) {
      const session = await requireSession({ permission: PERMISSIONS.APPOINTMENTS_MANAGE });
      clinicId = session.clinicId;
    }

    const now = new Date();
    const results: { kind: string; attempted: number; sent: number }[] = [];

    for (const kind of ["reminder-24h", "reminder-2h"] as const) {
      const window = reminderWindow(kind, now);
      const marker = kind === "reminder-24h" ? "reminder_24h_sent_at" : "reminder_2h_sent_at";

      let query = supabase
        .from("appointments")
        .select("id")
        .in("status", ["SCHEDULED", "CONFIRMED"])
        .eq("booking_status", "APPROVED")
        .gte("appointment_start", window.gteISO)
        .lt("appointment_start", window.ltISO)
        .is(marker, null)
        .limit(50);

      if (clinicId) query = query.eq("clinic_id", clinicId);

      const { data, error } = await query;
      if (error) {
        // The marker column only exists after migration 0007; without it the
        // whole reminder feature is simply not deployed yet.
        if (isMissingSchema(error) || /reminder_/.test(error.message)) continue;
        throw new Error(error.message);
      }

      let sent = 0;
      for (const row of data ?? []) {
        const result = await sendAppointmentNotification(row.id, kind);
        if (result.status !== "sent") continue;
        sent += 1;
        await supabase
          .from("appointments")
          .update({ [marker]: now.toISOString() })
          .eq("id", row.id);
      }

      results.push({ kind, attempted: (data ?? []).length, sent });
    }

    return NextResponse.json({ success: true, scope: clinicId ? "clinic" : "all", results });
  } catch (error) {
    return toErrorResponse(error, "Reminder sweep error");
  }
}