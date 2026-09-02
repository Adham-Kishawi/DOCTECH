import { callOpenRouter, ChatMessage } from "./openRouterClient";
import { metaWhatsApp } from "../whatsapp/metaClient";

export interface ProcessWhatsAppInput {
  fromPhone: string;
  patientName?: string;
  messageText: string;
  conversationHistory?: { role: "user" | "assistant"; text: string }[];
}

export interface HermesResult {
  replyText: string;
  intent: "BOOKING_REQUEST" | "INQUIRY" | "GREETING" | "CANCEL";
  extractedDetails?: {
    patientName?: string;
    preferredDate?: string;
    preferredTime?: string;
    symptoms?: string;
    doctorId?: string;
  };
  createdBookingRequest?: boolean;
}

const HERMES_SYSTEM_PROMPT = `You are "Hermes", the friendly, polite, and highly professional medical receptionist AI for DOCTECH Multi-Tenant Clinic OS (Egypt).
Your job is to:
1. Speak in warm, polite Egyptian Arabic (لهجة مصرية مهذبة وراقية مع فصحى مبسطة).
2. Answer clinic FAQs: Address, Fees (New Consultation: 400 EGP, Follow-up: 200 EGP), Doctors (Dr. Ahmed Hossam - Cardiology, Dr. Tarek Omar - Internal Medicine).
3. Handle booking requests by extracting:
   - Patient Name
   - Preferred Day/Time
   - Brief complaint/symptoms
4. Never confirm a medical prescription or give definitive diagnosis.
5. Emphasize that all booking requests are reviewed and confirmed by the human reception desk within 10 minutes.

Current Available Slots Today: 10:00 AM, 01:30 PM, 02:30 PM. Tomorrow: 11:00 AM, 03:00 PM.`;

export async function processHermesMessage(input: ProcessWhatsAppInput): Promise<HermesResult> {
  const { fromPhone, messageText, conversationHistory = [] } = input;

  const messages: ChatMessage[] = [
    { role: "system", content: HERMES_SYSTEM_PROMPT },
    ...conversationHistory.map((h) => ({
      role: h.role,
      content: h.text,
    })),
    { role: "user", content: messageText },
  ];

  // 1. Generate conversational response via OpenRouter (Qwen -> GLM)
  const aiReply = await callOpenRouter(messages, {
    temperature: 0.3,
    maxTokens: 350,
  });

  // 2. Detect Intent & Extract Structured Data
  const isBookingIntent =
    messageText.includes("حجز") ||
    messageText.includes("كشف") ||
    messageText.includes("ميعاد") ||
    messageText.includes("موعد") ||
    messageText.includes("الساعة") ||
    messageText.includes("دكتور");

  let extractedDetails: HermesResult["extractedDetails"] = undefined;
  let createdBookingRequest = false;

  if (isBookingIntent) {
    extractedDetails = {
      patientName: input.patientName || "مريض واتساب",
      preferredDate: "Today",
      preferredTime: messageText.includes("١٠") || messageText.includes("10") ? "10:00 AM" : "01:30 PM",
      symptoms: messageText,
      doctorId: "doc-1",
    };
    createdBookingRequest = true;
  }

  return {
    replyText: aiReply,
    intent: isBookingIntent ? "BOOKING_REQUEST" : "INQUIRY",
    extractedDetails,
    createdBookingRequest,
  };
}
