import { auth, clerkClient } from "@clerk/nextjs/server";
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

    // Find secretary by Clerk user ID
    const { data: secretary, error: secretaryError } = await supabase
      .from("secretaries")
      .select("id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id, created_at")
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

    // Get clinic details
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, phone, address, logo_url")
      .eq("id", secretary.clinic_id)
      .maybeSingle();

    if (clinicError) {
      console.warn("Secretary clinic fetch warning:", clinicError.message);
    }

    return NextResponse.json({
      success: true,
      role: "secretary",
      user: secretary,
      clinic: clinic || null,
    });
  } catch (error) {
    console.error("Secretary profile fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load secretary profile",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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

    // Find existing secretary
    const { data: secretary, error: secretaryError } = await supabase
      .from("secretaries")
      .select("id, clerk_user_id")
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

    const body = await req.json();
    const { name, phone, avatar_url } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (phone !== undefined) {
      updates.phone = typeof phone === "string" ? phone.trim() : null;
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url || null;
    }

    const { data: updatedSecretary, error: updateError } = await supabase
      .from("secretaries")
      .update(updates)
      .eq("id", secretary.id)
      .select("id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id, created_at, updated_at")
      .single();

    if (updateError) {
      throw new Error(`Failed to update secretary: ${updateError.message}`);
    }

    // Sync name to Clerk in background
    try {
      if (typeof name === "string" && name.trim()) {
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          firstName: name.trim(),
        });
      }
    } catch (clerkErr) {
      console.warn("Clerk secretary profile sync warning:", clerkErr);
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedSecretary,
    });
  } catch (error) {
    console.error("Secretary profile update error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update secretary profile",
      },
      { status: 500 }
    );
  }
}
