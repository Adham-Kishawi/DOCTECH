import { supabase } from "./supabase";
import { realtimeBus } from "./realtimeService";

export type NotificationTypeEnum =
  | "NEW_APPOINTMENT"
  | "AI_BOOKING_REQUEST"
  | "APPOINTMENT_CANCELLED"
  | "NEW_REPORT"
  | "REPORT_REVIEWED"
  | "WHATSAPP_MESSAGE"
  | "INTERNAL_MESSAGE"
  | "SYSTEM";

export interface SystemNotification {
  id: string;
  clinicId: string;
  role?: "doctor" | "secretary" | "all";
  doctorId?: string;
  secretaryId?: string;
  type: NotificationTypeEnum;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  time: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

const STORAGE_KEY_NOTIFS = "doctech_notifications_cache";

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif-1",
    clinicId: "cln-001",
    role: "secretary",
    type: "AI_BOOKING_REQUEST",
    title: "New AI Booking Request",
    titleAr: "طلب حجز جديد من المساعد الذكي",
    body: "Sara Ibrahim requested consultation today at 10:30 AM via WhatsApp.",
    bodyAr: "سارة إبراهيم طلبت كشف اليوم الساعة ١٠:٣٠ ص عبر الواتساب.",
    time: "5 mins ago",
    isRead: false,
    link: "appointments/pending",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-2",
    clinicId: "cln-001",
    role: "all",
    type: "NEW_APPOINTMENT",
    title: "New Appointment Scheduled",
    titleAr: "تم تسجيل حجز جديد",
    body: "Youssef Nabil booked for 09:30 AM with Dr. Ahmed Hossam.",
    bodyAr: "تم حجز موعد ليوسف نبيل الساعة ٠٩:٣٠ ص مع د. أحمد حسام.",
    time: "25 mins ago",
    isRead: false,
    link: "appointments",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "notif-3",
    clinicId: "cln-001",
    role: "doctor",
    type: "NEW_REPORT",
    title: "Urgent Medical Inquiry",
    titleAr: "استفسار طبي عاجل",
    body: "Kareem Tarek sent high-fever symptoms report for review.",
    bodyAr: "كريم طارق أرسل تقرير أعراض حرارة مرتفعة للمراجعة.",
    time: "1 hour ago",
    isRead: true,
    link: "reports",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export function getStoredNotifications(role?: "doctor" | "secretary"): SystemNotification[] {
  if (typeof window === "undefined") {
    return role
      ? INITIAL_NOTIFICATIONS.filter((n) => n.role === "all" || n.role === role)
      : INITIAL_NOTIFICATIONS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return role
        ? INITIAL_NOTIFICATIONS.filter((n) => n.role === "all" || n.role === role)
        : INITIAL_NOTIFICATIONS;
    }
    const parsed: SystemNotification[] = JSON.parse(raw);
    return role ? parsed.filter((n) => n.role === "all" || n.role === role) : parsed;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export async function fetchNotifications(role?: "doctor" | "secretary"): Promise<SystemNotification[]> {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const parsed: SystemNotification[] = data.map((item) => ({
        id: item.id,
        clinicId: item.clinic_id || "cln-001",
        role: item.role || "all",
        doctorId: item.doctor_id,
        secretaryId: item.secretary_id,
        type: item.type as NotificationTypeEnum,
        title: item.title,
        titleAr: item.title,
        body: item.body,
        bodyAr: item.body,
        time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
        isRead: !!item.is_read,
        link: item.link || "notifications",
        createdAt: item.created_at || new Date().toISOString(),
      }));

      // Cache locally
      if (typeof window !== "undefined") {
        try {
          const current = getStoredNotifications();
          const merged = [...parsed];
          current.forEach((c) => {
            if (!merged.some((m) => m.id === c.id)) merged.push(c);
          });
          localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(merged));
        } catch {}
      }

      return role ? parsed.filter((n) => n.role === "all" || n.role === role) : parsed;
    }
  } catch (err) {
    console.warn("Supabase fetchNotifications fallback to local cache", err);
  }

  return getStoredNotifications(role);
}

export async function createNotification(params: {
  clinicId?: string;
  role?: "doctor" | "secretary" | "all";
  doctorId?: string;
  secretaryId?: string;
  type: NotificationTypeEnum;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  link?: string;
}): Promise<SystemNotification> {
  const notif: SystemNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    clinicId: params.clinicId || "cln-001",
    role: params.role || "all",
    doctorId: params.doctorId,
    secretaryId: params.secretaryId,
    type: params.type,
    title: params.title,
    titleAr: params.titleAr || params.title,
    body: params.body,
    bodyAr: params.bodyAr || params.body,
    time: "Just now",
    isRead: false,
    link: params.link || "communications",
    createdAt: new Date().toISOString(),
  };

  // 1. Cache locally
  if (typeof window !== "undefined") {
    try {
      const stored = getStoredNotifications();
      const updated = [notif, ...stored];
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch {}
  }

  // 2. Publish to realtime bus
  realtimeBus.publish(
    {
      type: "NOTIFICATION_RECEIVED",
      payload: {
        id: notif.id,
        title: notif.title,
        body: notif.body,
        type: notif.type,
        createdAt: notif.createdAt,
      },
    },
    true
  );

  // 3. Persist to Supabase in background
  try {
    await supabase.from("notifications").insert([
      {
        id: notif.id,
        clinic_id: notif.clinicId,
        doctor_id: notif.doctorId,
        secretary_id: notif.secretaryId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        link: notif.link,
        is_read: false,
        created_at: notif.createdAt,
      },
    ]);
  } catch (err) {
    console.warn("Supabase notification insert skipped", err);
  }

  return notif;
}

export async function markAllNotificationsRead(role?: "doctor" | "secretary"): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const current = getStoredNotifications();
      const updated = current.map((n) => {
        if (!role || n.role === "all" || n.role === role) {
          return { ...n, isRead: true };
        }
        return n;
      });
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch {}
  }

  try {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
  } catch {}
}
