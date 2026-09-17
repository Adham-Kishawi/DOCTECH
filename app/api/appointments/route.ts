import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getAvailableSlots } from "@/lib/schedule/availabilityService";
import { getClinicSession } from "@/lib/clinicAuth";

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

export async function GET() {
  try {
    const session = await getClinicSession();

    let query = supabase
      .from("appointments")
      .select("*, patients(id, name, phone), doctors(id, name, specialty)")
      .order("date", { ascending: false });

    if (session?.clinicId) {
      query = query.eq("clinic_id", session.clinicId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch appointments error:", error);
      // Fallback simple query
      let fallbackQuery = supabase.from("appointments").select("*").order("date", { ascending: false });
      if (session?.clinicId) {
        fallbackQuery = fallbackQuery.eq("clinic_id", session.clinicId);
      }
      const { data: fallbackData } = await fallbackQuery;

      return NextResponse.json({ success: true, data: fallbackData || [] });
    }

    const formatted = (data || []).map((item) => {
      const aptDate = new Date(item.date);
      const isValidDate = !Number.isNaN(aptDate.getTime());
      const timeStr = isValidDate
        ? aptDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : "10:00 AM";
      const dateStr = isValidDate
        ? aptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : item.date;

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
        notes: item.notes || "",
        fee: item.fee ?? 400,
        amountPaid: item.amount_paid ?? 0,
        paymentMethod: item.payment_method || "CASH",
        createdAt: item.created_at || item.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Appointments GET error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getClinicSession();
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
    const clinicId = appointment.clinicId || session?.clinicId;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Missing clinic context for appointment" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(appointment.date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment date" },
        { status: 400 }
      );
    }

    const dateStr = appointment.date.split("T")[0];

    // Check available slots
    try {
      const availableSlots = await getAvailableSlots(appointment.doctorId, dateStr);

      const requestedHours = appointmentDate.getHours();
      const requestedMinutes = appointmentDate.getMinutes();
      const requestedStartTime = `${requestedHours.toString().padStart(2, "0")}:${requestedMinutes.toString().padStart(2, "0")}`;

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
      console.warn("Slot check warning:", slotCheckErr);
      // Non-blocking so appointments can still proceed
    }

    // Check doctor schedule duration or default to 30
    const { data: schedule } = await supabase
      .from("doctor_schedules")
      .select("slot_duration")
      .eq("doctor_id", appointment.doctorId)
      .eq("day_of_week", new Date(`${dateStr}T00:00:00`).getDay())
      .eq("is_active", true)
      .maybeSingle();

    const duration = schedule?.slot_duration || appointment.duration || 30;
    const appointmentId = crypto.randomUUID();

    const newRecord = {
      id: appointmentId,
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId,
      clinic_id: clinicId,
      secretary_id: appointment.secretaryId || (session?.role === "secretary" ? session.user.id : null),
      date: appointmentDate.toISOString(),
      duration,
      status: appointment.status,
      source: appointment.source,
      booking_status: appointment.bookingStatus,
      type: appointment.type || "General Consultation",
      notes: appointment.notes || null,
      fee: appointment.fee ?? 400,
      amount_paid: appointment.amountPaid ?? 0,
      payment_method: appointment.paymentMethod || "CASH",
    };

    const { data, error } = await supabase.from("appointments").insert([newRecord]).select();

    if (error) {
      console.error("Create appointment insert error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        data: data?.[0] || newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}