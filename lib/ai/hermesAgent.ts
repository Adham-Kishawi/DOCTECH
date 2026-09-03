import { callOpenRouter, ChatMessage } from "./openRouterClient";
import { metaWhatsApp } from "../whatsapp/metaClient";

export interface ProcessWhatsAppInput {
  fromPhone: string;
  patientName?: string;
  messageText: string;
  conversationHistory?: { role: "user" | "assistant"; text: string }[];
  /** Optional clinic context injected from the settings page */
  clinicContextPrompt?: string;
}

export interface AssistantResult {
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

// Keep old type name for backwards compat
export type HermesResult = AssistantResult;

function buildSystemPrompt(clinicContextPrompt?: string): string {
  return `أنت مساعد استقبال ذكي لعيادة طبية في مصر. مهمتك هي:
1. التحدث بلهجة مصرية مهذبة وراقية مع فصحى مبسطة.
2. الإجابة على أسئلة المرضى المتعلقة بالعيادة (العنوان، المواعيد، الأسعار، الخدمات).
3. استقبال طلبات الحجز واستخراج:
   - اسم المريض
   - اليوم والوقت المفضل
   - الشكوى أو الأعراض
4. لا تعطي تشخيص طبي أو وصفات أدوية أبداً.
5. أكد دائماً أن طلبات الحجز يتم مراجعتها وتأكيدها من الاستقبال خلال 10 دقائق.
6. لا تذكر أبداً أنك ذكاء اصطناعي أو موديل لغوي — تصرف كموظف استقبال حقيقي.${clinicContextPrompt || ""}`;
}

export async function processHermesMessage(input: ProcessWhatsAppInput): Promise<AssistantResult> {
  const { fromPhone, messageText, conversationHistory = [], clinicContextPrompt } = input;

  const messages: ChatMessage[] = [
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

  // Detect Intent & Extract Structured Data
  const isBookingIntent =
    messageText.includes("حجز") ||
    messageText.includes("كشف") ||
    messageText.includes("ميعاد") ||
    messageText.includes("موعد") ||
    messageText.includes("الساعة") ||
    messageText.includes("دكتور");

  let extractedDetails: AssistantResult["extractedDetails"] = undefined;
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
