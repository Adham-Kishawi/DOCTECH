import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Get the doctor linked to the current Clerk account.
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select(
        "id, clerk_user_id, email, name, specialty, avatar_url, clinic_id"
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (doctorError) {
      throw new Error(doctorError.message);
    }

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor profile not found",
        },
        { status: 404 }
      );
    }

    // Get the clinic associated with the doctor.
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, phone, address")
      .eq("id", doctor.clinic_id)
      .maybeSingle();

    if (clinicError) {
      throw new Error(clinicError.message);
    }

    // Get the doctor's recurring working schedule.
    const { data: schedules, error: schedulesError } = await supabase
      .from("doctor_schedules")
      .select(
        "id, doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration, is_active"
      )
      .eq("doctor_id", doctor.id)
      .order("day_of_week", { ascending: true });

    if (schedulesError) {
      throw new Error(schedulesError.message);
    }

    return NextResponse.json({
      success: true,
      role: "doctor",
      user: doctor,
      clinic: clinic ?? null,
      schedules: schedules ?? [],
    });
  } catch (error) {
    console.error("Doctor profile error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load doctor profile",
      },
      { status: 500 }
    );
  }
}