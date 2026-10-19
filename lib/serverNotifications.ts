import "server-only";
import { supabaseAdmin as supabase } from "./supabaseAdmin";
import type { NotificationType } from "@/types/index";

export interface CreateNotificationInput {
  /** Required — tenant isolation. Never fall back to a placeholder clinic. */
  clinicId: string;
  role?: "doctor" | "secretary" | "all";
  doctorId?: string;
  secretaryId?: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  link?: string;
}

/**
 * Server-side notification writer. Route handlers and other server code must
 * use this instead of the client-facing `lib/notificationService.ts`, which
 * only talks to the HTTP API.
 */
export async function createNotification(
  params: CreateNotificationInput
): Promise<{ id: string }> {
  if (!params.clinicId) {
    throw new Error("createNotification: clinicId is required");
  }

  const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const { error } = await supabase.from("notifications").insert([
    {
      id,
      clinic_id: params.clinicId,
      doctor_id: params.doctorId ?? null,
      secretary_id: params.secretaryId ?? null,
      role: params.role ?? "all",
      type: params.type,
      title: params.title,
      title_ar: params.titleAr || params.title,
      body: params.body,
      body_ar: params.bodyAr || params.body,
      link: params.link || "dashboard",
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    throw new Error(`createNotification failed: ${error.message}`);
  }

  return { id };
}
