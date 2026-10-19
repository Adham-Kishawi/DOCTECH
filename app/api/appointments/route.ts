import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type { AppointmentListItem } from "@/types/index";
import {
  getAvailableSlots,
  getClinicTimezone,
} from "@/lib/schedule/availabilityService";
import {
  resolveInstant,
  wallDate,
  wallMinutes,
  formatInClinicZone,
} from "@/lib/schedule/clinicTime";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { sendAppointmentNotification } from "@/lib/schedule/appointmentNotifications";

const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  clinicId: z.string().optional(),
  secretaryId: z.string().optional(),
  date: z.string().min(1),
  duration: z.number().int().min(5).max(480).default(30),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .default("CONFIRMED"),
  type: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  fee: z.number().optional(),
  amountPaid: z.number().optional(),
  paymentMethod: z.string().optional(),
  source: z.enum(["MANUAL", "AI", "WHATSAPP"]).default("MANUAL"),
  bookingStatus: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]).default("APPROVED"),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.APPOINTMENTS_VIEW });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10), 1), 500);

    const query = supabase
      .from("appointments")
      .select("*, patients(id, name, phone), doctors(id, name, specialty)")
      .eq("clinic_id", session.clinicId)
      .order("date", { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    // Render every timestamp in the clinic's zone. Omitting `timeZone` makes
    // toLocale* fall back to the API server's zone, which is UTC on Vercel and
    // silently shifts every listed time by the offset on the deployed app.
    const timeZone = await getClinicTimezone(session.clinicId);

    if (error) {
      console.error("Fetch appointments error:", error);
      // Fallback simple query
      const fallbackQuery = supabase
        .from("appointments")
        .select("*")
        .eq("clinic_id", session.clinicId)
        .order("date", { ascending: false })
        .limit(limit);
      const { data: fallbackData } = await fallbackQuery;

      return NextResponse.json({ success: true, data: fallbackData || [] });
    }

    const formatted: AppointmentListItem[] = (data || []).map((item) => {
      const timeStr = formatInClinicZone(
        item.date,
        timeZone,
        { hour: "2-digit", minute: "2-digit" },
        "en-US",
        "10:00 AM"
      );
      const dateStr = formatInClinicZone(
        item.date,
        timeZone,
        { month: "short", day: "numeric", year: "numeric" },
        "en-US",
        String(item.date ?? "")
      );

      return {
        id: item.id,
        patientId: item.patient_id || item.patientId,
        patientName: item.patients?.name || "Patient",
        patientPhone: item.patients?.phone || "",
        doctorId: item.doctor_id || item.doctorId,
        doctorName: item.doctors?.name || "Dr. Medical Lead",
        doctorSpecialty: item.doctors?.specialty || "Specialist",
        date: dateStr,
        time: timeStr,
        rawDate: item.date,
        duration: item.duration || 30,
        status: item.status?.toLowerCase() || "confirmed",
        type: item.type || "Consultation",
        source: item.source || "MANUAL",
        bookingStatus: item.booking_status || "APPROVED",
        // Lets the list show how long a pending hold still reserves the slot.
        expiresAt: item.expires_at || null,
        notes: item.notes || "",
        fee: item.fee ?? 400,
        amountPaid: item.amount_paid ?? 0,
        paymentMethod: item.payment_method || "CASH",
        createdAt: item.created_at || item.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return toErrorResponse(error, "Appointments GET error:");
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.APPOINTMENTS_MANAGE });
    const body = await req.json();
    const parsed = CreateAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const appointment = parsed.data;
    const clinicId = session.clinicId;

    // Slots are wall-clock times of the clinic's day, so the input must be
    // resolved in the clinic's zone rather than the server's.
    const timezone = await getClinicTimezone(clinicId);
    const appointmentDate = resolveInstant(appointment.date, timezone);

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment date" },
        { status: 400 }
      );
    }

    // The clinic's calendar day for this instant. A raw `date.split("T")[0]`
    // can disagree with the resolved instant whenever the offset shifts it
    // across midnight (e.g. 00:30 in Cairo read from a UTC-less string).
    const dateStr = wallDate(appointmentDate, timezone);

    // Advisory pre-check: tells the user which slot conflicts. It is a read and
    // cannot prevent a race — the DB exclusion constraint below is what actually
    // rejects overlapping bookings (see supabase/migrations/0001).
    try {
      const availableSlots = await getAvailableSlots(appointment.doctorId, dateStr, {
        clinicId,
        timezone,
      });

      // Compare in the clinic's zone: the slot list is wall-clock, so the
      // requested instant must be read through the same lens.
      const requestedMinutesOfDay = wallMinutes(appointmentDate, timezone);
      const requestedStartTime = `${Math.floor(requestedMinutesOfDay / 60)
        .toString()
        .padStart(2, "0")}:${(requestedMinutesOfDay % 60).toString().padStart(2, "0")}`;

      const requestedSlot = availableSlots.find((slot) => slot.startTime === requestedStartTime);

      if (requestedSlot && !requestedSlot.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: "The requested time slot is already booked",
          },
          { status: 409 }
        );
      }
    } catch (slotCheckErr) {
      // The advisory check is best-effort only: it reports early, while the
      // constraint remains authoritative even if this whole block throws.
      console.warn("Slot check warning:", slotCheckErr);
    }

    // Check doctor schedule duration or default to 30
    // The schedule row is keyed by the clinic's calendar day (already in-zone).
    const clinicDayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();

    const { data: schedule } = await supabase
      .from("doctor_schedules")
      .select("slot_duration")
      .eq("doctor_id", appointment.doctorId)
      .eq("day_of_week", clinicDayOfWeek)
      .eq("is_active", true)
      .maybeSingle();

    const duration = schedule?.slot_duration || appointment.duration || 30;
    const appointmentId = crypto.randomUUID();
    const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60_000);

    // PENDING_REVIEW requests hold the slot only for a bounded window; the
    // exclusion constraint treats an expired hold as absent.
    const pendingExpiry =
      appointment.bookingStatus === "PENDING_REVIEW"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

    const newRecord = {
      id: appointmentId,
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId,
      clinic_id: clinicId,
      secretary_id: appointment.secretaryId || (session?.role === "secretary" ? session.user.id : null),
      date: appointmentDate.toISOString(),
      appointment_start: appointmentDate.toISOString(),
      appointment_end: appointmentEnd.toISOString(),
      duration,
      status: appointment.status,
      source: appointment.source,
      booking_status: appointment.bookingStatus,
      expires_at: pendingExpiry,
      type: appointment.type || "General Consultation",
      notes: appointment.notes || null,
      fee: appointment.fee ?? 400,
      amount_paid: appointment.amountPaid ?? 0,
      payment_method: appointment.paymentMethod || "CASH",
    };

    const { data, error } = await supabase.from("appointments").insert([newRecord]).select();

    if (error) {
      console.error("Create appointment insert error:", error);

      // Postgres SQLSTATE 23P01 = exclusion constraint violated. This is the
      // authoritative answer for two requests racing into the same slot.
      const isOverlap =
        error.code === "23P01" ||
        (typeof error.message === "string" &&
          /no_doctor_overlap|exclusion/i.test(error.message));

      if (isOverlap) {
        return NextResponse.json(
          { success: false, error: "The requested time slot is already booked" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to save appointment" },
        { status: 500 }
      );
    }

    // Fire-and-forget: the patient gets a confirmation only for a booking that
    // is already approved; a PENDING_REVIEW request holds the slot silently
    // until a secretary reviews it. A WhatsApp failure must not fail a
    // successfully created booking.
    if (appointment.bookingStatus !== "PENDING_REVIEW") {
      void sendAppointmentNotification(appointmentId, "confirmation").catch((err) =>
        console.warn("Confirmation notification error:", err)
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data?.[0] || newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    return toErrorResponse(error, "Create appointment error");
  }
}

const ALLOWED_STATUS = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
const ALLOWED_BOOKING_STATUS = ["PENDING_REVIEW", "APPROVED", "REJECTED"] as const;

const UpdateAppointmentSchema = z.object({
  id: z.string().min(1),
  // The UI sends lowercase status values; the columns store uppercase. They are
  // normalised below rather than trusted, so a client cannot write an
  // unrecognised status that would silently escape the exclusion constraint's
  // `status IN (...)` scope.
  status: z.string().max(20).optional(),
  bookingStatus: z.string().max(20).optional(),
});

/**
 * Updates an appointment's status and/or review state.
 *
 * Approving or rejecting a PENDING_REVIEW request also clears `expires_at`:
 * the hold has done its job, and leaving a stale timestamp behind would let the
 * row look expired to anything that reads the column directly.
 */
export async function PATCH(req: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.APPOINTMENTS_MANAGE });

    const parsed = UpdateAppointmentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update payload" },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    const status = parsed.data.status?.trim().toUpperCase().replace(/\s+/g, "_");
    const bookingStatus = parsed.data.bookingStatus?.trim().toUpperCase();

    if (status && !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }
    if (
      bookingStatus &&
      !ALLOWED_BOOKING_STATUS.includes(bookingStatus as (typeof ALLOWED_BOOKING_STATUS)[number])
    ) {
      return NextResponse.json({ success: false, error: "Invalid booking status" }, { status: 400 });
    }

    if (!status && !bookingStatus) {
      return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (bookingStatus) {
      updates.booking_status = bookingStatus;
      if (bookingStatus !== "PENDING_REVIEW") updates.expires_at = null;
    }

    // Read the pre-update row so a transition into CANCELLED / REJECTED can be
    // detected — a client sending the same status twice must not re-notify.
    const { data: before } = await supabase
      .from("appointments")
      .select("status, booking_status")
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    // Scoped to the caller's clinic: another tenant cannot rewrite a row they
    // happen to know the id of.
    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select();

    if (error) {
      console.error("Update appointment error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Notify on entering a terminal negative state for the first time.
    const wasTerminated =
      before && (before.status === "CANCELLED" || before.booking_status === "REJECTED");
    const nowTerminated =
      (status ?? before?.status) === "CANCELLED" || (bookingStatus ?? before?.booking_status) === "REJECTED";
    if (nowTerminated && !wasTerminated) {
      void sendAppointmentNotification(id, "cancellation").catch((err) =>
        console.warn("Cancellation notification error:", err)
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    return toErrorResponse(error, "Update appointment error");
  }
}