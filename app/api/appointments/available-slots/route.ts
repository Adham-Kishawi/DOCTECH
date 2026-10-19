import { NextResponse } from "next/server";
import { getAvailableSlots, getClinicTimezone } from "@/lib/schedule/availabilityService";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { wallDate } from "@/lib/schedule/clinicTime";

export async function GET(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.APPOINTMENTS_VIEW });

    const { searchParams } = new URL(request.url);

    const requestedDoctorId = searchParams.get("doctorId");
    // Defaulting to the server's UTC date hands the clinic yesterday's calendar
    // for two hours every evening. The default must be the clinic's own day.
    const timeZone = await getClinicTimezone(session.clinicId);
    const date = searchParams.get("date") || wallDate(new Date(), timeZone);

    if (!requestedDoctorId) {
      return NextResponse.json(
        {
          success: false,
          error: "doctorId is required",
        },
        { status: 400 }
      );
    }

    // A doctorId is caller-supplied, so confirm the doctor actually belongs to
    // the caller's clinic before exposing their schedule.
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("id", requestedDoctorId)
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found in this clinic" },
        { status: 404 }
      );
    }

    const slots = await getAvailableSlots(requestedDoctorId, date, {
      clinicId: session.clinicId,
    });

    return NextResponse.json({
      success: true,
      doctorId: requestedDoctorId,
      date,
      slots,
    });
  } catch (error) {
    return toErrorResponse(error, "Available slots error");
  }
}