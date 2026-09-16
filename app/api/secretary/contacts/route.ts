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

    // Get the current secretary and its clinic.
    const { data: secretary, error: secretaryError } = await supabase
      .from("secretaries")
      .select("id, clinic_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (secretaryError) {
      throw new Error(secretaryError.message);
    }

    if (!secretary) {
      return NextResponse.json(
        {
          success: false,
          error: "Secretary profile not found",
        },
        { status: 404 }
      );
    }

    // Get all doctors in the same clinic.
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select(
        "id, clerk_user_id, name, email, specialty, avatar_url, clinic_id"
      )
      .eq("clinic_id", secretary.clinic_id)
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
      .eq("clinic_id", secretary.clinic_id)
      .order("name", { ascending: true });

    if (secretariesError) {
      throw new Error(secretariesError.message);
    }

    const contacts = [
      ...(doctors ?? []).map((doctor) => ({
        id: doctor.id,
        clerk_user_id: doctor.clerk_user_id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.specialty || "Doctor",
        type: "doctor" as const,
        avatar_url: doctor.avatar_url,
        clinic_id: doctor.clinic_id,
        isOnline: false,
      })),

      ...(secretaries ?? [])
        .filter((item) => item.id !== secretary.id)
        .map((item) => ({
          id: item.id,
          clerk_user_id: item.clerk_user_id,
          name: item.name,
          email: item.email,
          role: "Secretary",
          type: "secretary" as const,
          avatar_url: item.avatar_url,
          clinic_id: item.clinic_id,
          isOnline: false,
        })),
    ];

    return NextResponse.json({
      success: true,
      clinicId: secretary.clinic_id,
      contacts,
    });
  } catch (error) {
    console.error("Get secretary contacts error:", error);

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