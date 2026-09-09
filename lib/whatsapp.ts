// ============================================
// WhatsApp Business Cloud API - Meta Official
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ============================================

const WA_API_URL = "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "";

interface SendMessagePayload {
  to: string; // phone number with country code (e.g., "201012345678")
  message: string;
}

interface WaApiResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export async function sendWhatsAppMessage(
  payload: SendMessagePayload,
  credentials?: { phoneNumberId: string; accessToken: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = credentials?.phoneNumberId ?? PHONE_NUMBER_ID;
  const accessToken = credentials?.accessToken ?? ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error: "WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.",
    };
  }

  try {
    const response = await fetch(
      `${WA_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: payload.to,
          type: "text",
          text: { body: payload.message },
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

interface WaConnectionInfo {
  id: string;
  display_phone_number: string;
  verified_name: string;
  code_verification_status: string;
  quality_rating: string;
}

// Verifies a Phone Number ID + Access Token against the Meta Graph API.
// Returns the number details on success, or a human-readable error on failure.
export async function testWhatsAppConnection(
  phoneNumberId: string,
  accessToken: string
): Promise<
  | { success: true; info: WaConnectionInfo }
  | { success: false; error: string }
> {
  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "Phone Number ID and Access Token are required." };
  }

  try {
    const response = await fetch(
      `${WA_API_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name,status,quality_rating,code_verification_status`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const err = await response.json();
      const msg = err?.error?.message || "Invalid Phone Number ID or Access Token.";
      const code = err?.error?.code;
      return {
        success: false,
        error: code ? `${msg} (fbe-${code})` : msg,
      };
    }

    const data: WaConnectionInfo = await response.json();
    return { success: true, info: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error reaching Meta Graph API.",
    };
  }
}

export interface WhatsAppConfigStatus {
  configured: boolean;
  phoneNumberIdMasked: string | null;
  webhookVerifyTokenSet: boolean;
}

export function verifyWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (
    mode === "subscribe" &&
    WEBHOOK_VERIFY_TOKEN !== "" &&
    token === WEBHOOK_VERIFY_TOKEN
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
