import "server-only";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export interface ClinicUserSession {
  userId: string;
  role: "doctor" | "secretary";
  clinicId: string;
  user: {
    id: string;
    name: string;
    email: string;
    clinic_id: string;
    specialty?: string | null;
    avatar_url?: string | null;
  };
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
        user: doctor,
      };
    }

    // 2. Check secretary
    const { data: secretary, error: secError } = await supabase
      .from("secretaries")
      .select("id, clerk_user_id, email, name, avatar_url, clinic_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!secError && secretary && secretary.clinic_id) {
      return {
        userId,
        role: "secretary",
        clinicId: secretary.clinic_id,
        user: secretary,
      };
    }

    return null;
  } catch (error) {
    console.error("getClinicSession error:", error);
    return null;
  }
}
