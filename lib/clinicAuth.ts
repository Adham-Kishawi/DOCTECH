import "server-only";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export interface ClinicUserSession {
  userId: string;
  role: "doctor" | "secretary";
  clinicId: string;
  /** Optional role preset id (e.g. RECEPTIONIST) once migration 0006 is applied. */
  roleId?: string | null;
  /** Normalized permission keys. Doctors always get the implicit `*` grant. */
  permissions: string[];
  user: {
    id: string;
    name: string;
    email: string;
    clinic_id: string;
    specialty?: string | null;
    avatar_url?: string | null;
  };
}

/** Every permission granted implicitly to any doctor. */
export const DOCTOR_ALL_PERMISSIONS = ["*"];

function normalizePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === "string");
  }
  // Postgres JSON/JSONB columns can come back as a stringified array.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is string => typeof p === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

export async function getClinicSession(): Promise<ClinicUserSession | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // 1. Check doctor
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id, clerk_user_id, email, name, specialty, avatar_url, clinic_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!doctorError && doctor && doctor.clinic_id) {
      return {
        userId,
        role: "doctor",
        clinicId: doctor.clinic_id,
        permissions: DOCTOR_ALL_PERMISSIONS,
        user: doctor,
      };
    }

    // 2. Check secretary
    const { data: secretary, error: secError } = await supabase
      .from("secretaries")
      .select("id, clerk_user_id, email, name, avatar_url, clinic_id, permissions, status")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!secError && secretary && secretary.clinic_id) {
      // A suspended/inactive account must not be able to open a session.
      if (secretary.status && secretary.status !== "ACTIVE") {
        console.warn(
          `getClinicSession: secretary ${secretary.id} has status ${secretary.status}. Denying session.`
        );
        return null;
      }

      // Best-effort role lookup. The `role` column only exists after migration
      // 0006 (deferred to Phase 9); a missing column must never break sign-in.
      let roleId: string | null = null;
      try {
        const { data: roleRow } = await supabase
          .from("secretaries")
          .select("role")
          .eq("id", secretary.id)
          .maybeSingle();
        roleId = (roleRow as { role?: string | null } | null)?.role ?? null;
      } catch {
        roleId = null;
      }

      return {
        userId,
        role: "secretary",
        clinicId: secretary.clinic_id,
        roleId,
        permissions: normalizePermissions(secretary.permissions),
        user: secretary,
      };
    }

    return null;
  } catch (error) {
    console.error("getClinicSession error:", error);
    return null;
  }
}
