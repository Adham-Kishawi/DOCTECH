import { supabase } from "./supabase";

export interface CreateNotificationParams {
  clinicId: string;
  doctorId?: string;
  secretaryId?: string;
  type: "NEW_APPOINTMENT" | "AI_BOOKING_REQUEST" | "APPOINTMENT_CANCELLED" | "NEW_REPORT" | "REPORT_REVIEWED" | "SYSTEM";
  title: string;
  body: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { clinicId, doctorId, secretaryId, type, title, body, link } = params;

    const { data, error } = await supabase.from("notifications").insert([
      {
        clinicId,
        doctorId,
        secretaryId,
        type,
        title,
        body,
        link,
        isRead: false,
      },
    ]).select().single();

    if (error) {
      console.warn("Notification insert fallback:", error.message);
    }

    return { success: true, notification: data };
  } catch (err) {
    console.error("createNotification error:", err);
    return { success: false, error: err };
  }
}
