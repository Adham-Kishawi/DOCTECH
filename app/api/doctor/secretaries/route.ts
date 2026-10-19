import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { ApiError, withSession, PERMISSIONS } from "@/lib/apiAuth";
import { ALL_PERMISSION_IDS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Status is unified to ACTIVE | INACTIVE (plan §6.6 — no more "SUSPENDED"). */
const VALID_STATUSES = ["ACTIVE", "INACTIVE"] as const;
type StaffStatus = (typeof VALID_STATUSES)[number];

const SELECT_FIELDS =
  "id, clerk_user_id, email, name, phone, permissions, avatar_url, status, clinic_id, created_at, updated_at";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accept the granular catalog plus the `all` master switch. */
function normalizePermissions(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const key = item.trim();
    if (key === "all" || ALL_PERMISSION_IDS.includes(key)) {
      if (!out.includes(key)) out.push(key);
    } else {
      return null;
    }
  }
  return out;
}

export const GET = withSession(
  async (_request, session) => {
    const { data: secretaries, error } = await supabase
      .from("secretaries")
      .select(SELECT_FIELDS)
      .eq("clinic_id", session.clinicId)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, error.message);

    return NextResponse.json({ success: true, users: secretaries ?? [] });
  },
  { permission: PERMISSIONS.STAFF_VIEW }
);

/**
 * Create a staff member.
 *
 * 1. Real Clerk user. 2. Real Supabase secretary row scoped to the doctor's
 * clinic. If the DB insert fails the Clerk user is rolled back.
 */
export const POST = withSession(
  async (request, session) => {
    let createdClerkUserId: string | null = null;

    try {
      const body = await request.json();
      const { name, email, phone, password, permissions } = body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !EMAIL_RE.test(email.trim())
      ) {
        throw new ApiError(422, "A valid name and email are required.");
      }

      if (typeof password !== "string") {
        throw new ApiError(422, "Password is required.");
      }
      if (password.length < 15) throw new ApiError(422, "Password must be at least 15 characters.");
      if (!/[A-Z]/.test(password)) throw new ApiError(422, "Password must contain an uppercase letter.");
      if (!/[a-z]/.test(password)) throw new ApiError(422, "Password must contain a lowercase letter.");
      if (!/[0-9]/.test(password)) throw new ApiError(422, "Password must contain a number.");
      if (!/[^A-Za-z0-9]/.test(password)) throw new ApiError(422, "Password must contain a special character.");

      if (phone !== undefined && phone !== null && typeof phone !== "string") {
        throw new ApiError(400, "Phone must be a string");
      }

      const requestedPermissions = normalizePermissions(permissions) ?? ["appointments", "patients"];
      const normalizedEmail = email.trim().toLowerCase();

      // Duplicate check is PER-CLINIC (plan §6.6): the same email may staff two
      // different clinics.
      const { data: existing, error: existingError } = await supabase
        .from("secretaries")
        .select("id")
        .eq("clinic_id", session.clinicId)
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingError) throw new ApiError(500, existingError.message);
      if (existing) throw new ApiError(409, "A staff account with this email already exists in this clinic");

      const client = await clerkClient();
      let clerkUser;
      try {
        clerkUser = await client.users.createUser({
          emailAddress: [normalizedEmail],
          password,
          firstName: name.trim(),
        });
        createdClerkUserId = clerkUser.id;
      } catch (clerkError: unknown) {
        const code = (clerkError as { errors?: { code?: string }[] })?.errors?.[0]?.code;
        if (code === "form_password_pwned") {
          throw new ApiError(422, "This password has appeared in a data breach. Choose a different password.");
        }
        if (code === "form_password_length_too_short") {
          throw new ApiError(422, "Password must be at least 15 characters.");
        }
        if (code === "form_identifier_exists" || code === "form_email_address_exists") {
          throw new ApiError(409, "An account with this email already exists.");
        }
        console.error("Clerk create user error:", clerkError);
        throw new ApiError(422, "Unable to create the staff account. Please try again.");
      }

      const { data: secretary, error: secretaryError } = await supabase
        .from("secretaries")
        .insert({
          clerk_user_id: clerkUser.id,
          email: normalizedEmail,
          name: name.trim(),
          phone: phone?.trim() || null,
          permissions: requestedPermissions,
          status: "ACTIVE",
          clinic_id: session.clinicId,
        })
        .select(SELECT_FIELDS)
        .single();

      if (secretaryError) {
        // Roll back the Clerk account if the database insert fails.
        await client.users.deleteUser(createdClerkUserId).catch(() => {});
        createdClerkUserId = null;
        throw new ApiError(500, secretaryError.message);
      }

      return NextResponse.json(
        { success: true, message: "Staff account created successfully", user: secretary },
        { status: 201 }
      );
    } catch (error) {
      if (createdClerkUserId) {
        try {
          const client = await clerkClient();
          await client.users.deleteUser(createdClerkUserId);
        } catch (rollbackError) {
          console.error("Failed to rollback Clerk user:", rollbackError);
        }
      }
      throw error;
    }
  },
  { permission: PERMISSIONS.STAFF_MANAGE }
);

/** Update name, phone, permissions and/or status of a staff member. */
export const PUT = withSession(
  async (request, session) => {
    const body = await request.json();
    const id = String(body?.id || "");
    if (!id) throw new ApiError(400, "id is required");

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) throw new ApiError(422, "Name cannot be empty");
      payload.name = body.name.trim();
    }
    if (body.phone !== undefined) {
      if (body.phone !== null && typeof body.phone !== "string") throw new ApiError(400, "Phone must be a string");
      payload.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
    }
    if (body.permissions !== undefined) {
      const normalized = normalizePermissions(body.permissions);
      if (normalized === null) throw new ApiError(400, "Invalid permission");
      payload.permissions = normalized;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) throw new ApiError(422, "Invalid status");
      payload.status = body.status as StaffStatus;
    }

    const { data, error } = await supabase
      .from("secretaries")
      .update(payload)
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select(SELECT_FIELDS)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Staff member not found");

    return NextResponse.json({ success: true, user: data });
  },
  { permission: PERMISSIONS.STAFF_MANAGE }
);

/** Soft-delete a staff member and remove their Clerk login. */
export const DELETE = withSession(
  async (request, session) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new ApiError(400, "id is required");

    const { data, error } = await supabase
      .from("secretaries")
      .update({ status: "INACTIVE", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select("id, clerk_user_id")
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Staff member not found");

    // Best-effort Clerk removal; the DB record (and its history) stays.
    if (data.clerk_user_id) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(String(data.clerk_user_id));
      } catch (clerkError) {
        console.error("Failed to delete Clerk user (row already deactivated):", clerkError);
      }
    }

    return NextResponse.json({ success: true, archivedId: id });
  },
  { permission: PERMISSIONS.STAFF_MANAGE }
);
