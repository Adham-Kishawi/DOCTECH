import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabase";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
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

    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Clerk user not found",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      doctorName,
      specialty,
      clinicName,
      address,
      phone,
      workStartTime,
      workEndTime,
      consultationDuration,
      workingDays,
    } = body;

    if (
      !doctorName ||
      !clinicName ||
      !address ||
      !workStartTime ||
      !workEndTime ||
      !consultationDuration ||
      !Array.isArray(workingDays) ||
      workingDays.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required onboarding data",
        },
        { status: 400 }
      );
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Clerk account has no email address",
        },
        { status: 400 }
      );
    }

    // Prevent creating the doctor profile twice.
    const { data: existingDoctor, error: existingDoctorError } =
      await supabase
        .from("doctors")
        .select("id, clinic_id")
        .eq("clerk_user_id", userId)
        .maybeSingle();

    if (existingDoctorError) {
      throw new Error(existingDoctorError.message);
    }

    if (existingDoctor) {
      return NextResponse.json({
        success: true,
        alreadyOnboarded: true,
        role: "doctor",
        doctorId: existingDoctor.id,
        clinicId: existingDoctor.clinic_id,
      });
    }

    const clinicId = crypto.randomUUID();
    const doctorId = crypto.randomUUID();

    // Create clinic.
    const { error: clinicError } = await supabase.from("clinics").insert({
      id: clinicId,
      name: clinicName,
      address,
      phone: phone || null,
    });

    if (clinicError) {
      throw new Error(clinicError.message);
    }

    // Create doctor and link him to the Clerk user.
    const { error: doctorError } = await supabase.from("doctors").insert({
      id: doctorId,
      clerk_user_id: userId,
      email,
      name: doctorName,
      specialty: specialty || null,
      avatar_url: clerkUser.imageUrl || null,
      clinic_id: clinicId,
    });

    if (doctorError) {
      // Avoid leaving an orphan clinic if doctor creation fails.
      await supabase.from("clinics").delete().eq("id", clinicId);

      throw new Error(doctorError.message);
    }

    // Create one recurring working period for every selected day.
    const schedules = workingDays.map((dayOfWeek: number) => ({
      id: crypto.randomUUID(),
      doctor_id: doctorId,
      clinic_id: clinicId,
      day_of_week: dayOfWeek,
      start_time: workStartTime,
      end_time: workEndTime,
      slot_duration: Number(consultationDuration),
      is_active: true,
    }));

    const { error: scheduleError } = await supabase
      .from("doctor_schedules")
      .insert(schedules);

    if (scheduleError) {
      await supabase.from("doctors").delete().eq("id", doctorId);
      await supabase.from("clinics").delete().eq("id", clinicId);

      throw new Error(scheduleError.message);
    }

    return NextResponse.json(
      {
        success: true,
        alreadyOnboarded: false,
        role: "doctor",
        doctorId,
        clinicId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Doctor onboarding error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete clinic setup",
      },
      { status: 500 }
    );
  }
}