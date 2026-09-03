import { supabase } from "./supabase";
import { createNotification } from "./notificationService";

export { supabase };

// ============================================
// 1. APPOINTMENTS SERVICE
// ============================================
export interface AppointmentItem {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string;
  time: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  type: string;
  notes?: string;
}

export async function fetchAppointments(): Promise<AppointmentItem[]> {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(name, phone), doctors(name)")
      .order("date", { ascending: true });

    if (error || !data || data.length === 0) {
      // Return structured fallback seed if table is empty
      return [
        { id: "APT-201", patientName: "Ahmed Hassan", patientPhone: "+20 100 123 4567", doctorName: "Dr. Clinical Lead", date: "Today", time: "09:00 AM", status: "CONFIRMED", type: "Follow-up Check" },
        { id: "APT-202", patientName: "Sara Ibrahim", patientPhone: "+20 102 345 6789", doctorName: "Dr. Clinical Lead", date: "Today", time: "09:30 AM", status: "SCHEDULED", type: "New Consultation" },
        { id: "APT-203", patientName: "Mohamed Ali", patientPhone: "+20 103 456 7890", doctorName: "Dr. Clinical Lead", date: "Today", time: "10:00 AM", status: "SCHEDULED", type: "Urgent Review" },
        { id: "APT-204", patientName: "Fatima Omar", patientPhone: "+20 104 567 8901", doctorName: "Dr. Clinical Lead", date: "Today", time: "10:30 AM", status: "COMPLETED", type: "Routine Checkup" },
        { id: "APT-205", patientName: "Kareem Tarek", patientPhone: "+20 105 678 9012", doctorName: "Dr. Clinical Lead", date: "Today", time: "11:00 AM", status: "CANCELLED", type: "Lab Follow-up" },
      ];
    }

    return data.map((item) => ({
      id: item.id,
      patientName: item.patients?.name || "Patient",
      patientPhone: item.patients?.phone || "",
      doctorName: item.doctors?.name || "Dr. Clinical Lead",
      date: new Date(item.date).toLocaleDateString(),
      time: new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: item.status,
      type: item.type || "General Consultation",
      notes: item.notes,
    }));
  } catch (err) {
    console.error("fetchAppointments error:", err);
    return [];
  }
}

// ============================================
// 2. PATIENTS SERVICE
// ============================================
export interface PatientItem {
  id: string;
  name: string;
  phone: string;
  gender: "Male" | "Female";
  age: number;
  lastVisit: string;
  totalVisits: number;
}

export async function fetchPatients(): Promise<PatientItem[]> {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [
        { id: "PAT-001", name: "Ahmed Hassan", phone: "+20 100 123 4567", gender: "Male", age: 42, lastVisit: "Today", totalVisits: 5 },
        { id: "PAT-002", name: "Sara Ibrahim", phone: "+20 102 345 6789", gender: "Female", age: 29, lastVisit: "10 days ago", totalVisits: 2 },
        { id: "PAT-003", name: "Mohamed Ali", phone: "+20 103 456 7890", gender: "Male", age: 55, lastVisit: "2 weeks ago", totalVisits: 8 },
        { id: "PAT-004", name: "Fatima Omar", phone: "+20 104 567 8901", gender: "Female", age: 34, lastVisit: "1 month ago", totalVisits: 3 },
        { id: "PAT-005", name: "Kareem Tarek", phone: "+20 105 678 9012", gender: "Male", age: 46, lastVisit: "3 days ago", totalVisits: 4 },
      ];
    }

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      gender: p.gender === "FEMALE" ? "Female" : "Male",
      age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : 35,
      lastVisit: "Recent",
      totalVisits: 3,
    }));
  } catch (err) {
    console.error("fetchPatients error:", err);
    return [];
  }
}

// ============================================
// 3. INTERNAL MESSAGES SERVICE (DOCTOR <-> SECRETARY)
// ============================================
export interface InternalChatMessage {
  id: string;
  channelId: string; // "doctor_secretary_direct" | "broadcast" | "staff-2" etc.
  senderRole: "doctor" | "secretary";
  senderName: string;
  content: string;
  isRead: boolean;
  sentAt: string;
  clinicId?: string;
}

const STORAGE_KEY_MESSAGES = "doctech_internal_messages_cache";

export const DEFAULT_INTERNAL_MESSAGES: InternalChatMessage[] = [
  {
    id: "seed-msg-1",
    channelId: "doctor_secretary_direct",
    senderRole: "secretary",
    senderName: "Sarah Jenkins (Reception)",
    content: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.",
    isRead: true,
    sentAt: "09:15 AM",
    clinicId: "cln-001",
  },
  {
    id: "seed-msg-2",
    channelId: "doctor_secretary_direct",
    senderRole: "doctor",
    senderName: "Dr. Ahmed Hossam",
    content: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.",
    isRead: true,
    sentAt: "09:18 AM",
    clinicId: "cln-001",
  },
  {
    id: "seed-msg-3",
    channelId: "doctor_secretary_direct",
    senderRole: "secretary",
    senderName: "Sarah Jenkins (Reception)",
    content: "Patient Kareem Tarek fever report is uploaded and attached to his case file.",
    isRead: true,
    sentAt: "09:20 AM",
    clinicId: "cln-001",
  },
  {
    id: "seed-msg-4",
    channelId: "broadcast",
    senderRole: "doctor",
    senderName: "Dr. Ahmed Hossam",
    content: "Team meeting today at 04:30 PM in Conference Room to review new WhatsApp AI booking flows.",
    isRead: true,
    sentAt: "08:45 AM",
    clinicId: "cln-001",
  },
];

export async function fetchInternalMessages(channelId?: string): Promise<InternalChatMessage[]> {
  try {
    // 1. Try Supabase first if available
    let query = supabase
      .from("internal_messages")
      .select("*")
      .order("sent_at", { ascending: true });

    if (channelId) {
      query = query.eq("channel_id", channelId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const parsed: InternalChatMessage[] = data.map((row) => ({
        id: row.id,
        channelId: row.channel_id || "doctor_secretary_direct",
        senderRole: row.sender_role || "secretary",
        senderName: row.sender_name || (row.sender_role === "doctor" ? "Dr. Ahmed Hossam" : "Reception"),
        content: row.content,
        isRead: !!row.is_read,
        sentAt: row.sent_at
          ? new Date(row.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now",
        clinicId: row.clinic_id || "cln-001",
      }));

      // Cache locally for instant next load
      if (typeof window !== "undefined") {
        try {
          const cached = getStoredMessages();
          const merged = [...cached];
          parsed.forEach((p) => {
            if (!merged.some((m) => m.id === p.id)) merged.push(p);
          });
          localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(merged));
        } catch {
          // localStorage error ignored
        }
      }

      return channelId ? parsed.filter((m) => m.channelId === channelId) : parsed;
    }
  } catch (err) {
    console.warn("Supabase fetchInternalMessages fallback to local cache", err);
  }

  // 2. Fallback to localStorage / seeded initial messages
  return getStoredMessages(channelId);
}

export async function saveInternalMessage(
  msg: Omit<InternalChatMessage, "id" | "sentAt" | "isRead"> & {
    id?: string;
    sentAt?: string;
    isRead?: boolean;
  }
): Promise<InternalChatMessage> {
  const fullMsg: InternalChatMessage = {
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    channelId: msg.channelId || "doctor_secretary_direct",
    senderRole: msg.senderRole,
    senderName: msg.senderName,
    content: msg.content.trim(),
    isRead: msg.isRead ?? false,
    sentAt:
      msg.sentAt ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    clinicId: msg.clinicId || "cln-001",
  };

  // 1. Save to localStorage immediately
  if (typeof window !== "undefined") {
    try {
      const current = getStoredMessages();
      if (!current.some((m) => m.id === fullMsg.id)) {
        current.push(fullMsg);
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(current));
      }
    } catch (e) {
      console.warn("localStorage save error", e);
    }
  }

  // 2. Try persisting to Supabase in background
  try {
    await supabase.from("internal_messages").insert([
      {
        id: fullMsg.id,
        channel_id: fullMsg.channelId,
        clinic_id: fullMsg.clinicId,
        sender_role: fullMsg.senderRole,
        sender_name: fullMsg.senderName,
        content: fullMsg.content,
        is_read: fullMsg.isRead,
        sent_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn("Supabase saveInternalMessage error (using local cache)", err);
  }

  // 3. Automatically trigger system notification for recipient role
  try {
    const isFromSecretary = fullMsg.senderRole === "secretary";
    const recipientRole: "doctor" | "secretary" = isFromSecretary ? "doctor" : "secretary";
    createNotification({
      clinicId: fullMsg.clinicId,
      role: recipientRole,
      type: "INTERNAL_MESSAGE",
      title: isFromSecretary
        ? `New direct message from ${fullMsg.senderName}`
        : `New clinical note from ${fullMsg.senderName}`,
      titleAr: isFromSecretary
        ? `رسالة مباشرة جديدة من ${fullMsg.senderName}`
        : `توجيه سريري جديد من ${fullMsg.senderName}`,
      body: fullMsg.content,
      bodyAr: fullMsg.content,
      link: "communications",
    });
  } catch (notifErr) {
    console.warn("Failed creating internal message notification", notifErr);
  }

  return fullMsg;
}

export function getStoredMessages(channelId?: string): InternalChatMessage[] {
  if (typeof window === "undefined") {
    return channelId
      ? DEFAULT_INTERNAL_MESSAGES.filter((m) => m.channelId === channelId)
      : DEFAULT_INTERNAL_MESSAGES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(DEFAULT_INTERNAL_MESSAGES));
      return channelId
        ? DEFAULT_INTERNAL_MESSAGES.filter((m) => m.channelId === channelId)
        : DEFAULT_INTERNAL_MESSAGES;
    }
    const parsed: InternalChatMessage[] = JSON.parse(raw);
    return channelId ? parsed.filter((m) => m.channelId === channelId) : parsed;
  } catch {
    return channelId
      ? DEFAULT_INTERNAL_MESSAGES.filter((m) => m.channelId === channelId)
      : DEFAULT_INTERNAL_MESSAGES;
  }
}

export async function markInternalMessagesAsRead(channelId: string, readerRole: "doctor" | "secretary"): Promise<void> {
  // Update local storage
  if (typeof window !== "undefined") {
    try {
      const messages = getStoredMessages();
      let changed = false;
      const updated = messages.map((m) => {
        if (m.channelId === channelId && m.senderRole !== readerRole && !m.isRead) {
          changed = true;
          return { ...m, isRead: true };
        }
        return m;
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }

  // Update Supabase
  try {
    await supabase
      .from("internal_messages")
      .update({ is_read: true })
      .eq("channel_id", channelId)
      .neq("sender_role", readerRole);
  } catch {
    // ignore
  }
}