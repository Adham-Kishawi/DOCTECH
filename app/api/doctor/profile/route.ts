import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await requireSession({ role: "doctor" });

    const doctor = session.user;

    // Get the clinic associated with the doctor.
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, phone, address, logo_url")
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
    // Do not echo the raw driver message back to the client.
    return toErrorResponse(error, "Doctor profile error");
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession({ role: "doctor" });

    const doctor = session.user;
    const userId = session.userId;

    const body = await req.json();
    const {
      name,
      specialty,
      avatar_url,
      clinicName,
      clinicPhone,
      clinicAddress,
      clinicLogo,
    } = body;

    // 1. Update Doctor record if doctor fields are provided
    const doctorUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === "string" && name.trim()) {
      doctorUpdates.name = name.trim();
    }
    if (specialty !== undefined) {
      doctorUpdates.specialty = typeof specialty === "string" ? specialty.trim() : null;
    }
    if (avatar_url !== undefined) {
      doctorUpdates.avatar_url = avatar_url || null;
    }

    const { data: updatedDoctor, error: updateDocError } = await supabase
      .from("doctors")
      .update(doctorUpdates)
      .eq("id", doctor.id)
      .select("id, clerk_user_id, email, name, specialty, avatar_url, clinic_id")
      .single();

    if (updateDocError) {
      throw new Error(`Failed to update doctor: ${updateDocError.message}`);
    }

    // 2. Update Clinic record if clinic fields are provided
    let updatedClinic = null;
    const clinicUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof clinicName === "string" && clinicName.trim()) {
      clinicUpdates.name = clinicName.trim();
    }
    if (clinicPhone !== undefined) {
      clinicUpdates.phone = typeof clinicPhone === "string" ? clinicPhone.trim() : null;
    }
    if (clinicAddress !== undefined) {
      clinicUpdates.address = typeof clinicAddress === "string" ? clinicAddress.trim() : null;
    }
    if (clinicLogo !== undefined) {
      clinicUpdates.logo_url = clinicLogo || null;
    }

    if (Object.keys(clinicUpdates).length > 1) {
      const { data: clinicData, error: updateClinicError } = await supabase
        .from("clinics")
        .update(clinicUpdates)
        .eq("id", doctor.clinic_id)
        .select("id, name, phone, address, logo_url")
        .single();

      if (updateClinicError) {
        throw new Error(`Failed to update clinic: ${updateClinicError.message}`);
      }
      updatedClinic = clinicData;
    } else {
      const { data: existingClinic } = await supabase
        .from("clinics")
        .select("id, name, phone, address, logo_url")
        .eq("id", doctor.clinic_id)
        .maybeSingle();
      updatedClinic = existingClinic;
    }

    // 3. Attempt to update Clerk user profile in background
    try {
      if (typeof name === "string" && name.trim()) {
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          firstName: name.trim(),
        });
      }
    } catch (clerkErr) {
      console.warn("Clerk profile sync warning:", clerkErr);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedDoctor,
      clinic: updatedClinic,
    });
  } catch (error) {
    return toErrorResponse(error, "Doctor profile update error");
  }
}