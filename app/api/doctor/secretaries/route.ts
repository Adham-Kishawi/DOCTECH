import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

const AVAILABLE_PERMISSIONS = [
  "appointments",
  "patients",
  "billing",
  "whatsapp",
  "reports",
] as const;


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
      .select("id, clinic_id")
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

    // Get all secretaries belonging to the doctor's clinic.
    const { data: secretaries, error: secretariesError } = await supabase
      .from("secretaries")
      .select(
        "id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id, created_at, updated_at"
      )
      .eq("clinic_id", doctor.clinic_id)
      .order("created_at", { ascending: false });

    if (secretariesError) {
      throw new Error(secretariesError.message);
    }

    return NextResponse.json({
      success: true,
      users: secretaries ?? [],
    });
  } catch (error) {
    console.error("Get secretaries error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load staff accounts",
      },
      { status: 500 }
    );
  }
}




 





export async function POST(request: Request) {
  let createdClerkUserId: string | null = null;

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

    const body = await request.json();

    const {
      name,
      email,
      phone,
      password,
      permissions,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, email, and password are required.",
        },
        { status: 422 }
      );
    }

    if (password.length < 15) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 15 characters.",
        },
        { status: 422 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain at least one uppercase letter.",
        },
        { status: 422 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain at least one lowercase letter.",
        },
        { status: 422 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain at least one number.",
        },
        { status: 422 }
      );
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must contain at least one special character.",
        },
        { status: 422 }
      );
    }
    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Phone must be a string",
        },
        { status: 400 }
      );
    }

    const requestedPermissions = Array.isArray(permissions)
      ? permissions
      : ["appointments", "patients"];

    const invalidPermission = requestedPermissions.find(
      (permission) =>
        typeof permission !== "string" ||
        !AVAILABLE_PERMISSIONS.includes(
          permission as (typeof AVAILABLE_PERMISSIONS)[number]
        )
    );

    if (invalidPermission) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid permission",
        },
        { status: 400 }
      );
    }

    // Get the doctor linked to the current Clerk account.
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, clinic_id")
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

    // Prevent duplicate Secretary records inside DOCTECH.
    const { data: existingSecretary, error: existingSecretaryError } =
      await supabase
        .from("secretaries")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

    if (existingSecretaryError) {
      throw new Error(existingSecretaryError.message);
    }

    if (existingSecretary) {
      return NextResponse.json(
        {
          success: false,
          error: "A staff account with this email already exists",
        },
        { status: 409 }
      );
    }

    const client = await clerkClient();


// Create the real Clerk account.
let clerkUser;

try {
  clerkUser = await client.users.createUser({
    emailAddress: [email.trim().toLowerCase()],
    password,
    firstName: name.trim(),
  });

  createdClerkUserId = clerkUser.id;
} catch (clerkError: any) {
  const clerkErrorCode = clerkError?.errors?.[0]?.code;

  if (clerkErrorCode === "form_password_pwned") {
    return NextResponse.json(
      {
        success: false,
        error:
          "This password has appeared in a data breach. Please choose a different password.",
      },
      { status: 422 }
    );
  }

  if (clerkErrorCode === "form_password_length_too_short") {
    return NextResponse.json(
      {
        success: false,
        error: "Password must be at least 15 characters.",
      },
      { status: 422 }
    );
  }
 
  if (
    clerkErrorCode === "form_identifier_exists" ||
    clerkErrorCode === "form_email_address_exists"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "An account with this email already exists.",
      },
      { status: 409 }
    );
  }

  console.error("Clerk create user error:", clerkError);

  return NextResponse.json(
    {
      success: false,
      error: "Unable to create the staff account. Please try again.",
    },
    { status: 422 }
  );
}
    // Create the Secretary record linked to the doctor's clinic.
    const { data: secretary, error: secretaryError } = await supabase
      .from("secretaries")
      .insert({
        clerk_user_id: clerkUser.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: phone?.trim() || null,
        permissions: requestedPermissions,
        status: "ACTIVE",
        clinic_id: doctor.clinic_id,
      })
      .select(
        "id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id, created_at"
      )
      .single();

    if (secretaryError) {
      // Roll back the Clerk account if the database insert fails.
      await client.users.deleteUser(createdClerkUserId);
      createdClerkUserId = null;

      throw new Error(secretaryError.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Staff account created successfully",
        user: secretary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create secretary error:", error);

    // Safety rollback in case an unexpected error happens after
    // the Clerk user was created.
    if (createdClerkUserId) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(createdClerkUserId);
      } catch (rollbackError) {
        console.error(
          "Failed to rollback Clerk user:",
          rollbackError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create staff account";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}