// ============================================
// WhatsApp Business Cloud API - Meta Official
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ============================================

const WA_API_URL = "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

interface SendMessagePayload {
  to: string; // phone number with country code (e.g., "201012345678")
  message: string;
}

interface WaApiResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export async function sendWhatsAppMessage({
  to,
  message,
}: SendMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(
      `${WA_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || "WhatsApp API error");
    }

    const data: WaApiResponse = await response.json();
    return { success: true, messageId: data.messages[0]?.id };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return challenge;
  }
  return null;
}

export interface IncomingWaMessage {
  from: string;
  messageId: string;
  text: string;
  timestamp: number;
}

export function parseWebhookPayload(body: unknown): IncomingWaMessage | null {
  try {
    const payload = body as {
      entry: {
        changes: {
          value: {
            messages?: { from: string; id: string; text: { body: string }; timestamp: string }[];
          };
        }[];
      }[];
    };

    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return null;

    return {
      from: message.from,
      messageId: message.id,
      text: message.text?.body || "",
      timestamp: parseInt(message.timestamp),
    };
  } catch {
    return null;
  }
}
