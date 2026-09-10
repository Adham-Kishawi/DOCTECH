
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getAvailableSlots } from "@/lib/schedule/availabilityService";

const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  clinicId: z.string().min(1),
  secretaryId: z.string().optional(),
  date: z.string().min(1),
  duration: z.number().int().min(5).max(480).default(30),
  status: z
    .enum([
      "SCHEDULED",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ])
    .default("SCHEDULED"),
  type: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(name, phone), doctors(name)")
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

    const appointmentDate = new Date(appointment.date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid appointment date",
        },
        { status: 400 }
      );
    }

    const date = appointment.date.split("T")[0];

    const availableSlots = await getAvailableSlots(
      appointment.doctorId,
      date
    );

    const requestedHours = appointmentDate.getHours();
    const requestedMinutes = appointmentDate.getMinutes();

    const requestedStartTime = `${requestedHours
      .toString()
      .padStart(2, "0")}:${requestedMinutes.toString().padStart(2, "0")}`;

    const requestedSlot = availableSlots.find(
      (slot) => slot.startTime === requestedStartTime
    );

    if (!requestedSlot) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested time is outside the doctor's schedule",
        },
        { status: 400 }
      );
    }

    if (!requestedSlot.isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested time is already booked",
        },
        { status: 409 }
      );
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from("doctor_schedules")
      .select("slot_duration")
      .eq("doctor_id", appointment.doctorId)
      .eq(
        "day_of_week",
        new Date(`${date}T00:00:00`).getDay()
      )
      .eq("is_active", true)
      .maybeSingle();

    if (scheduleError) {
      throw new Error(scheduleError.message);
    }

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor schedule not found",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          ...appointment,
          duration: schedule.slot_duration,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal error",
      },
      { status: 500 }
    );
  }
}