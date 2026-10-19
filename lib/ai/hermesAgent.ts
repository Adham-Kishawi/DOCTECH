import { callOpenRouter, LlmChatMessage } from "./openRouterClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface ProcessWhatsAppInput {
  fromPhone: string;
  patientName?: string;
  messageText: string;
  conversationHistory?: { role: "user" | "assistant"; text: string }[];
  /** Optional clinic context injected from the settings page */
  clinicContextPrompt?: string;
  /** Used to resolve which doctor the patient is asking for. */
  clinicId?: string;
}

export interface AssistantResult {
  replyText: string;
  intent: "BOOKING_REQUEST" | "INQUIRY" | "GREETING" | "CANCEL";
  /** Only fields actually present in the patient's message are returned. */
  extractedDetails?: {
    patientName?: string;
    preferredDate?: string;
    preferredTime?: string;
    doctorId?: string;
    doctorName?: string;
  };
  /** A booking request was raised for reception — nothing is written silently. */
  createdBookingRequest?: boolean;
}

// Keep old type name for backwards compat
export type HermesResult = AssistantResult;

function buildSystemPrompt(clinicContextPrompt?: string): string {
  return `أنت مساعد استقبال ذكي لعيادة طبية في مصر. مهمتك هي:
1. التحدث بلهجة مصرية مهذبة راقية مع فصحى مبسطة.
2. الإجابة على أسئلة المرضى المتعلقة بالعيادة (العنوان، المواعيد، الأسعار، الخدمات).
3. استقبال طلبات الحجز واستخراج:
   - اسم المريض
   - اليوم والوقت المفضل
   - الشكوى أو الأعراض
4. لا تعطي تشخيص طبي أو وصفات أدوية أبداً.
5. أكد دائماً أن طلبات الحجز يتم مراجعتها وتأكيدها من الاستقبال خلال 10 دقائق.
6. لا تذكر أبداً أنك ذكاء اصطناعي أو موديل لغوي — تصرف كموظف استقبال حقيقي.${clinicContextPrompt || ""}`;
}

const toLatinDigits = (value: string): string =>
  value.replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));

/** "10:30 م" / "10:30" → "10:30 AM" — only when the message actually states a time. */
function detectTime(message: string): string | undefined {
  const normalized = toLatinDigits(message);
  const match = normalized.match(/\b(\d{1,2})[:.](\d{2})\b\s*(ص|م|am|pm)?/i);
  if (!match) return undefined;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;

  const suffixHint = (match[3] || "").toLowerCase();
  let suffix = suffixHint === "ص" || suffixHint === "am" ? "AM" : suffixHint === "م" || suffixHint === "pm" ? "PM" : "";
  if (!suffix) suffix = hours >= 12 ? "PM" : "AM";
  if (suffix === "PM" && hours < 12) hours += 12;
  if (suffix === "AM" && hours === 12) hours = 0;

  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

const WEEKDAY_PATTERN =
  /(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|saturday|sunday|monday|tuesday|wednesday|thursday|friday)/i;

/** Only what the patient literally asked for: tomorrow, a weekday, or dd/mm. */
function detectDate(message: string): string | undefined {
  if (/(بكرة|غدا|غداً|غدًا|tomorrow)/i.test(message)) return "Tomorrow";

  const weekday = message.match(WEEKDAY_PATTERN);
  if (weekday) return weekday[1];

  const explicit = toLatinDigits(message).match(/\b(\d{1,2})[/\-](\d{1,2})\b/);
  if (explicit) return `${explicit[1]}/${explicit[2]}`;

  if (/(النهارده|اليوم|today)/i.test(message)) return "Today";

  return undefined;
}

/** Matches a mentioned doctor against the clinic's real roster. */
async function detectDoctor(
  message: string,
  clinicId?: string
): Promise<{ doctorId: string; doctorName: string } | undefined> {
  if (!clinicId) return undefined;

  try {
    const { data, error } = await supabaseAdmin
      .from("doctors")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .limit(50);

    if (error || !data || data.length === 0) return undefined;

    const haystack = message.toLowerCase();
    const match = data.find((doctor) => {
      const name = (doctor.name || "").toLowerCase().trim();
      if (!name) return false;
      if (haystack.includes(name)) return true;
      // Match on the last word ("Dr. Ahmed Hossam" → "hossam") as patients often use nicknames.
      const lastWord = name.split(/\s+/).pop();
      return Boolean(lastWord && lastWord.length > 3 && haystack.includes(lastWord));
    });

    return match ? { doctorId: match.id, doctorName: match.name || "" } : undefined;
  } catch (error) {
    console.error("[Hermes] Doctor lookup failed:", error);
    return undefined;
  }
}

export async function processHermesMessage(input: ProcessWhatsAppInput): Promise<AssistantResult> {
  const { messageText, conversationHistory = [], clinicContextPrompt, clinicId } = input;

  const messages: LlmChatMessage[] = [
    { role: "system", content: buildSystemPrompt(clinicContextPrompt) },
    ...conversationHistory.map((h) => ({
      role: h.role,
      content: h.text,
    })),
    { role: "user", content: messageText },
  ];

  // Generate conversational response via OpenRouter
  const aiReply = await callOpenRouter(messages, {
    temperature: 0.3,
    maxTokens: 350,
  });

  const isBookingIntent =
    /حجز|كشف|ميعاد|موعد|الساعة|دكتور|booking|appointment/i.test(messageText);

  let extractedDetails: AssistantResult["extractedDetails"] = undefined;

  if (isBookingIntent) {
    const preferredTime = detectTime(messageText);
    const preferredDate = detectDate(messageText);
    const doctor = await detectDoctor(messageText, clinicId);

    extractedDetails = {
      patientName: input.patientName || undefined,
      preferredDate,
      preferredTime,
      doctorId: doctor?.doctorId,
      doctorName: doctor?.doctorName,
    };
  }

  return {
    replyText: aiReply,
    intent: isBookingIntent ? "BOOKING_REQUEST" : "INQUIRY",
    extractedDetails,
    createdBookingRequest: isBookingIntent,
  };
}
