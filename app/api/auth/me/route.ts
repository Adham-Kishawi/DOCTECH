

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();

    console.log("SERVER AUTH:", {
      isAuthenticated,
      userId,
    });

    if (!isAuthenticated || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, clerk_user_id, email, name, specialty, avatar_url, clinic_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (doctorError) {
      throw new Error(doctorError.message);
    }

    if (doctor) {
      return NextResponse.json({
        success: true,
        role: "doctor",
        user: doctor,
      });
    }

    const { data: secretary, error: secretaryError } = await supabase
      .from("secretaries")
      .select(
        "id, clerk_user_id, email, name, avatar_url, status, clinic_id"
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (secretaryError) {
      throw new Error(secretaryError.message);
    }

    if (secretary) {
      return NextResponse.json({
        success: true,
        role: "secretary",
        user: secretary,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "User is not assigned to a DOCTECH role",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("Auth me error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal error",
      },
      { status: 500 }
    );
  }
}