import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const clerkUser = await currentUser().catch(() => null);
    const primaryEmail =
      clerkUser?.emailAddresses?.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress;

    console.log("SERVER AUTH:", {
      userId,
      email: primaryEmail,
    });

    // 1. Query doctor by clerk_user_id
    let { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, clerk_user_id, email, name, specialty, avatar_url, clinic_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (doctorError) {
      throw new Error(doctorError.message);
    }

    // Fallback: match doctor by email if clerk_user_id hasn't been synced
    if (!doctor && primaryEmail) {
      const { data: docByEmail } = await supabase
        .from("doctors")
        .select("id, clerk_user_id, email, name, specialty, avatar_url, clinic_id")
        .ilike("email", primaryEmail.trim())
        .maybeSingle();

      if (docByEmail) {
        doctor = docByEmail;
        await supabase
          .from("doctors")
          .update({ clerk_user_id: userId })
          .eq("id", docByEmail.id);
      }
    }

    if (doctor) {
      return NextResponse.json({
        success: true,
        role: "doctor",
        user: doctor,
      });
    }

    // 2. Query secretary by clerk_user_id
    let { data: secretary, error: secretaryError } = await supabase
      .from("secretaries")
      .select("id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (secretaryError) {
      throw new Error(secretaryError.message);
    }

    // Fallback: match secretary by email if clerk_user_id hasn't been synced
    if (!secretary && primaryEmail) {
      const { data: secByEmail } = await supabase
        .from("secretaries")
        .select("id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id")
        .ilike("email", primaryEmail.trim())
        .maybeSingle();

      if (secByEmail) {
        secretary = secByEmail;
        await supabase
          .from("secretaries")
          .update({ clerk_user_id: userId })
          .eq("id", secByEmail.id);
      }
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
  } catch (error: any) {
    console.error("Auth me error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal error",
      },
      { status: 500 }
    );
  }
}