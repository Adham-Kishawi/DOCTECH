import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

export async function GET() {
  try {
    const session = await getClinicSession();

    if (!session || session.role !== "doctor" || !session.clinicId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Doctor session required",
        },
        { status: 401 }
      );
    }

    const doctor = session.user;

    // Get all doctors in the same clinic.
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select(
        "id, clerk_user_id, name, email, specialty, avatar_url, clinic_id"
      )
      .eq("clinic_id", doctor.clinic_id)
      .order("name", { ascending: true });

    if (doctorsError) {
      throw new Error(doctorsError.message);
    }

    // Get all secretaries in the same clinic.
    const { data: secretaries, error: secretariesError } = await supabase
      .from("secretaries")
      .select(
        "id, clerk_user_id, name, email, phone, avatar_url, status, clinic_id"
      )
      .eq("clinic_id", doctor.clinic_id)
      .order("name", { ascending: true });

    if (secretariesError) {
      throw new Error(secretariesError.message);
    }

    const contacts = [
      ...(secretaries ?? []).map((secretary) => ({
        id: secretary.id,
        clerk_user_id: secretary.clerk_user_id,
        name: secretary.name,
        email: secretary.email,
        role: "Secretary",
        type: "secretary" as const,
        avatar_url: secretary.avatar_url,
        clinic_id: secretary.clinic_id,
        isOnline: false,
      })),

      ...(doctors ?? [])
        .filter((item) => item.id !== doctor.id)
        .map((item) => ({
          id: item.id,
          clerk_user_id: item.clerk_user_id,
          name: item.name,
          email: item.email,
          role: item.specialty || "Doctor",
          type: "doctor" as const,
          avatar_url: item.avatar_url,
          clinic_id: item.clinic_id,
          isOnline: false,
        })),
    ];

    return NextResponse.json({
      success: true,
      clinicId: doctor.clinic_id,
      contacts,
    });
  } catch (error) {
    console.error("Get doctor contacts error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load clinic contacts",
      },
      { status: 500 }
    );
  }
}