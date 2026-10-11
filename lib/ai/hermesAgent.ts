// import { callOpenRouter, ChatMessage } from "./openRouterClient";
// import { metaWhatsApp } from "../whatsapp/metaClient";

// export interface ProcessWhatsAppInput {
//   fromPhone: string;
//   patientName?: string;
//   messageText: string;
//   conversationHistory?: { role: "user" | "assistant"; text: string }[];
//   /** Optional clinic context injected from the settings page */
//   clinicContextPrompt?: string;
// }

// export interface AssistantResult {
//   replyText: string;
//   intent: "BOOKING_REQUEST" | "INQUIRY" | "GREETING" | "CANCEL";
//   extractedDetails?: {
//     patientName?: string;
//     preferredDate?: string;
//     preferredTime?: string;
//     symptoms?: string;
//     doctorId?: string;
//   };
//   createdBookingRequest?: boolean;
// }

// // Keep old type name for backwards compat
// export type HermesResult = AssistantResult;

// function buildSystemPrompt(clinicContextPrompt?: string): string {
//   return `أنت مساعد استقبال ذكي لعيادة طبية في مصر. مهمتك هي:
// 1. التحدث بلهجة مصرية مهذبة وراقية مع فصحى مبسطة.
// 2. الإجابة على أسئلة المرضى المتعلقة بالعيادة (العنوان، المواعيد، الأسعار، الخدمات).
// 3. استقبال طلبات الحجز واستخراج:
//    - اسم المريض
//    - اليوم والوقت المفضل
//    - الشكوى أو الأعراض
// 4. لا تعطي تشخيص طبي أو وصفات أدوية أبداً.
// 5. أكد دائماً أن طلبات الحجز يتم مراجعتها وتأكيدها من الاستقبال خلال 10 دقائق.
// 6. لا تذكر أبداً أنك ذكاء اصطناعي أو موديل لغوي — تصرف كموظف استقبال حقيقي.${clinicContextPrompt || ""}`;
// }

// export async function processHermesMessage(input: ProcessWhatsAppInput): Promise<AssistantResult> {
//   const { fromPhone, messageText, conversationHistory = [], clinicContextPrompt } = input;

//   const messages: ChatMessage[] = [
//     { role: "system", content: buildSystemPrompt(clinicContextPrompt) },
//     ...conversationHistory.map((h) => ({
//       role: h.role,
//       content: h.text,
//     })),
//     { role: "user", content: messageText },
//   ];

//   // Generate conversational response via OpenRouter
//   const aiReply = await callOpenRouter(messages, {
//     temperature: 0.3,
//     maxTokens: 350,
//   });

//   // Detect Intent & Extract Structured Data
//   const isBookingIntent =
//     messageText.includes("حجز") ||
//     messageText.includes("كشف") ||
//     messageText.includes("ميعاد") ||
//     messageText.includes("موعد") ||
//     messageText.includes("الساعة") ||
//     messageText.includes("دكتور");

//   let extractedDetails: AssistantResult["extractedDetails"] = undefined;
//   let createdBookingRequest = false;

//   if (isBookingIntent) {
//     extractedDetails = {
//       patientName: input.patientName || "مريض واتساب",
//       preferredDate: "Today",
//       preferredTime: messageText.includes("١٠") || messageText.includes("10") ? "10:00 AM" : "01:30 PM",
//       symptoms: messageText,
//       doctorId: "doc-1",
//     };
//     createdBookingRequest = true;
//   }

//   return {
//     replyText: aiReply,
//     intent: isBookingIntent ? "BOOKING_REQUEST" : "INQUIRY",
//     extractedDetails,
//     createdBookingRequest,
//   };
// }


import { callOpenRouter, ChatMessage } from "./openRouterClient";

export interface ProcessWhatsAppInput {
  fromPhone: string;
  patientName?: string;
  messageText: string;
  conversationHistory?: {
    role: "user" | "assistant";
    text: string;
  }[];
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
  };
  createdBookingRequest?: boolean;
}

// Keep old type name for backwards compat
export type HermesResult = AssistantResult;

function buildSystemPrompt(clinicContextPrompt?: string): string {
  return `أنت مساعد استقبال ذكي لعيادة طبية في مصر.

مهمتك:
1. التحدث مع المريض بلهجة مصرية مهذبة وراقية مع فصحى مبسطة.
2. الإجابة على أسئلة المرضى المتعلقة بالعيادة.
3. استقبال طلبات الحجز واستخراج بيانات الحجز من رسالة المريض.
4. لا تعطي تشخيص طبي أو وصفات أدوية أبداً.
5. لا تؤكد للمريض أن الحجز تم تأكيده؛ طلب الحجز يحتاج مراجعة وتأكيد من الاستقبال.
6. لا تذكر أبداً أنك ذكاء اصطناعي أو موديل لغوي.
7. لا تخترع بيانات غير موجودة في رسالة المريض.
8. لا تقل للمريض إن الحجز تم تسجيله إلا إذا كانت بيانات الحجز مكتملة وواضحة.
9. إذا كان طلب الحجز ناقصاً، اسأل المريض فقط عن البيانات الناقصة.

عند تحليل رسالة المريض، أخرج البيانات التالية:

- intent:
  - BOOKING_REQUEST إذا كان المريض يريد حجز موعد.
  - INQUIRY إذا كان يسأل عن معلومات.
  - GREETING إذا كانت مجرد تحية.
  - CANCEL إذا كان يريد إلغاء موعد.

- patientName:
  اسم المريض إذا ذكره في الرسالة، وإلا استخدم الاسم المتاح من بيانات النظام.

- preferredDate:
  التاريخ المطلوب بصيغة YYYY-MM-DD إذا كان واضحاً.
  إذا لم يحدد المريض تاريخاً، اجعله null.

- preferredTime:
  الوقت المطلوب بصيغة HH:mm بنظام 24 ساعة إذا كان واضحاً.
  مثال: 10:00 أو 14:30.
  إذا لم يحدد المريض وقتاً، اجعله null.

- symptoms:
  الشكوى أو سبب الحجز إذا ذكره المريض.

قواعد الحجز:
- لا تخترع تاريخاً.
- لا تخترع وقتاً.
- لا تخترع doctorId.
- لا تضع doctorId في النتيجة.
- إذا لم يوجد تاريخ، اجعل preferredDate = null.
- إذا لم يوجد وقت، اجعل preferredTime = null.
- إذا كان التاريخ أو الوقت غير واضح، اجعله null.
- إذا كان intent = BOOKING_REQUEST وكان التاريخ ناقصاً، يجب أن يطلب replyText من المريض تحديد التاريخ.
- إذا كان intent = BOOKING_REQUEST وكان الوقت ناقصاً، يجب أن يطلب replyText من المريض تحديد الوقت.
- إذا كان التاريخ والوقت موجودين، أخبر المريض أن طلب الحجز سيتم مراجعته وتأكيده من الاستقبال.
- لا تدّعي أن الموعد متاح؛ توفر الموعد يتم التحقق منه بواسطة النظام وليس بواسطةك.

أخرج JSON فقط.

الشكل النهائي المطلوب:

{
  "replyText": "نص الرد للمريض",
  "intent": "BOOKING_REQUEST",
  "patientName": "Ahmed",
  "preferredDate": "2026-09-23",
  "preferredTime": "10:00",
  "symptoms": "كشف عام"
}

${clinicContextPrompt || ""}`;
}

function extractJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeIntent(
  intent: unknown
): AssistantResult["intent"] {
  if (
    intent === "BOOKING_REQUEST" ||
    intent === "INQUIRY" ||
    intent === "GREETING" ||
    intent === "CANCEL"
  ) {
    return intent;
  }

  return "INQUIRY";
}

export async function processHermesMessage(
  input: ProcessWhatsAppInput
): Promise<AssistantResult> {
  const {
    messageText,
    conversationHistory = [],
    clinicContextPrompt,
  } = input;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(clinicContextPrompt),
    },

    ...conversationHistory.map((h) => ({
      role: h.role,
      content: h.text,
    })),

    {
      role: "user",
      content: messageText,
    },
  ];

  const aiReply = await callOpenRouter(messages, {
    temperature: 0.2,
    maxTokens: 500,
  });

  const parsed = extractJson(aiReply);

  if (!parsed) {
    return {
      replyText: aiReply,
      intent: "INQUIRY",
      createdBookingRequest: false,
    };
  }

  const intent = normalizeIntent(parsed.intent);

  const patientName =
    typeof parsed.patientName === "string" && parsed.patientName.trim()
      ? parsed.patientName.trim()
      : input.patientName || "مريض واتساب";

  const preferredDate =
    typeof parsed.preferredDate === "string" &&
    parsed.preferredDate.trim()
      ? parsed.preferredDate.trim()
      : undefined;

  const preferredTime =
    typeof parsed.preferredTime === "string" &&
    parsed.preferredTime.trim()
      ? parsed.preferredTime.trim()
      : undefined;

  const symptoms =
    typeof parsed.symptoms === "string" && parsed.symptoms.trim()
      ? parsed.symptoms.trim()
      : undefined;

  const isBookingIntent = intent === "BOOKING_REQUEST";

  // A booking request is only ready to be created
  // when both date and time are available.
  const hasCompleteBookingDetails =
    isBookingIntent &&
    Boolean(preferredDate) &&
    Boolean(preferredTime);

  let replyText =
    typeof parsed.replyText === "string" && parsed.replyText.trim()
      ? parsed.replyText.trim()
      : aiReply;

  // Safety fallback:
  // If Hermes classified the message as a booking request
  // but missed one of the required fields, make sure the
  // response asks for the missing information.
  if (isBookingIntent && !hasCompleteBookingDetails) {
    if (!preferredDate && !preferredTime) {
      replyText =
        "أكيد، ممكن تحدد لي اليوم والساعة المناسبة للحجز؟";
    } else if (!preferredDate) {
      replyText =
        "تمام، ممكن تحدد لي اليوم المناسب للحجز؟";
    } else if (!preferredTime) {
      replyText =
        "تمام، ممكن تحدد لي الساعة المناسبة للحجز؟";
    }
  }

  return {
    replyText,
    intent,
    extractedDetails: isBookingIntent
      ? {
          patientName,
          preferredDate,
          preferredTime,
          symptoms,
        }
      : undefined,
    createdBookingRequest: hasCompleteBookingDetails,
  };
}