import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type { WhatsAppConversationItem, WhatsAppThreadMessage } from "@/types/index";

/** A patient as resolved from an inbound WhatsApp number. */
export interface PatientContact {
  patientId: string;
  clinicId: string;
  name: string;
  phone: string;
}

const digits = (value: string): string => value.replace(/[^0-9]/g, "");

/** Every spelling a clinic might have stored the same number under. */
function phoneCandidates(value: string): string[] {
  const d = digits(value);
  const candidates = new Set<string>([d, d.replace(/^00/, "")]);

  if (d.startsWith("0")) {
    candidates.add(`20${d.slice(1)}`);
    candidates.add(`0020${d.slice(1)}`);
  }
  if (/^20\d{10}$/.test(d)) candidates.add(`0${d.slice(2)}`);
  if (/^1\d{9}$/.test(d)) {
    candidates.add(`20${d}`);
    candidates.add(`0${d}`);
  }

  return [...candidates].filter((c) => c.length >= 8);
}

/**
 * Maps an inbound WhatsApp number to a patient (and therefore a clinic).
 * Returns null when no patient matches or when the number is ambiguous
 * across clinics — a tenant boundary is never guessed.
 */
export async function findPatientByPhone(phone: string): Promise<PatientContact | null> {
  const d = digits(phone);
  if (d.length < 8) return null;

  const candidates = phoneCandidates(phone);
  const query = await supabase
    .from("patients")
    .select("id, clinic_id, name, phone")
    .or(candidates.map((c) => `phone.eq.${c}`).join(","))
    .limit(10);

  let rows = (!query.error && query.data) || [];

  if (rows.length === 0 && d.length >= 9) {
    // Stored numbers may carry "+"/spaces; fall back to a suffix match.
    const fallback = await supabase
      .from("patients")
      .select("id, clinic_id, name, phone")
      .like("phone", `%${d.slice(-9)}`)
      .limit(10);
    rows = (!fallback.error && fallback.data) || [];
  }

  if (rows.length === 0) return null;

  const clinics = [...new Set(rows.map((row) => row.clinic_id))];
  if (clinics.length > 1) {
    console.warn(`[WhatsApp] Number ${phone} matches ${clinics.length} clinics; ignoring it.`);
    return null;
  }

  const row = rows[0];
  return {
    patientId: row.id,
    clinicId: row.clinic_id,
    name: row.name || "",
    phone: row.phone || phone,
  };
}

/** Returns the thread for this patient, creating the first one on demand. */
export async function ensureConversation(
  contact: PatientContact,
  waId: string
): Promise<{ id: string } | null> {
  const existing = await supabase
    .from("whatsapp_conversations")
    .select("id")
    .eq("clinic_id", contact.clinicId)
    .eq("patient_id", contact.patientId)
    .maybeSingle();

  if (existing.data?.id) return { id: existing.data.id };

  const id = `wc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inserted = await supabase
    .from("whatsapp_conversations")
    .insert({
      id,
      patient_id: contact.patientId,
      clinic_id: contact.clinicId,
      wa_id: waId,
      status: "OPEN",
    })
    .select("id")
    .single();

  if (inserted.error) {
    // Concurrent first message: re-read whatever won the race.
    const again = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("clinic_id", contact.clinicId)
      .eq("patient_id", contact.patientId)
      .maybeSingle();
    return again.data ? { id: again.data.id } : null;
  }

  return { id: inserted.data.id };
}

export interface RecordMessageInput {
  conversationId: string;
  from: "patient" | "clinic" | "ai";
  content: string;
  /** Meta's message id — used to drop webhook redeliveries. */
  waMessageId?: string | null;
  status?: string;
}

/** Stores a message and advances the conversation preview; idempotent per `waMessageId`. */
export async function recordMessage(input: RecordMessageInput): Promise<string | null> {
  if (input.waMessageId) {
    const seen = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("wa_message_id", input.waMessageId)
      .maybeSingle();
    if (seen.data?.id) return seen.data.id;
  }

  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inserted = await supabase.from("whatsapp_messages").insert({
    id,
    conversation_id: input.conversationId,
    "from": input.from,
    content: input.content,
    wa_message_id: input.waMessageId ?? null,
    status: input.status || "SENT",
  });

  if (inserted.error) {
    console.error("[WhatsApp] Failed to store message:", inserted.error.message);
    return null;
  }

  await supabase
    .from("whatsapp_conversations")
    .update({
      last_message: input.content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.conversationId);

  return id;
}

/** Inbox rows for a clinic, newest activity first. */
export async function listConversations(
  clinicId: string
): Promise<WhatsAppConversationItem[]> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select(
      "id, patient_id, wa_id, status, last_message, last_message_at, created_at, updated_at, patients(name, phone)"
    )
    .eq("clinic_id", clinicId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[WhatsApp] listConversations error:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const patient = row.patients as { name?: string | null; phone?: string | null } | null;
    return {
      id: String(row.id),
      patientId: String(row.patient_id),
      patientName: patient?.name || "",
      patientPhone: patient?.phone || String(row.wa_id || ""),
      waId: String(row.wa_id || ""),
      status: String(row.status || "OPEN"),
      lastMessage: String(row.last_message || ""),
      lastMessageAt: (row.last_message_at as string | null) ?? null,
      createdAt: String(row.created_at || ""),
    };
  });
}

/** The thread header, or null when it belongs to another clinic. */
export async function getConversation(
  conversationId: string,
  clinicId: string
): Promise<WhatsAppConversationItem | null> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("id, patient_id, wa_id, status, last_message, last_message_at, created_at, patients(name, phone)")
    .eq("id", conversationId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error || !data) return null;

  const patient = data.patients as { name?: string | null; phone?: string | null } | null;
  return {
    id: String(data.id),
    patientId: String(data.patient_id),
    patientName: patient?.name || "",
    patientPhone: patient?.phone || String(data.wa_id || ""),
    waId: String(data.wa_id || ""),
    status: String(data.status || "OPEN"),
    lastMessage: String(data.last_message || ""),
    lastMessageAt: (data.last_message_at as string | null) ?? null,
    createdAt: String(data.created_at || ""),
  };
}

export async function listMessages(
  conversationId: string,
  clinicId: string
): Promise<WhatsAppThreadMessage[] | null> {
  const conversation = await getConversation(conversationId, clinicId);
  if (!conversation) return null;

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  if (error) {
    console.error("[WhatsApp] listMessages error:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    conversationId: String(row.conversation_id),
    from: String(row.from ?? "patient"),
    content: String(row.content ?? ""),
    status: String(row.status ?? "SENT"),
    sentAt: String(row.sent_at ?? ""),
  }));
}
