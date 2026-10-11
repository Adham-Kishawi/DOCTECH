



export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
}

export interface SendMessageParams {
  to: string;
  text: string;
  credentials?: WhatsAppCredentials;
}

export interface SendBookingConfirmationParams {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  clinicName?: string;
  credentials?: WhatsAppCredentials;
}

export class MetaWhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string = "v21.0";

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  }

  // Send standard text message
  async sendTextMessage({
    to,
    text,
    credentials,
  }: SendMessageParams) {
    const phoneNumberId =
      credentials?.phoneNumberId || this.phoneNumberId;

    const accessToken =
      credentials?.accessToken || this.accessToken;

    if (!phoneNumberId || !accessToken) {
      console.warn(
        "Meta WhatsApp API keys not configured. Simulating message dispatch:",
        { to, text }
      );

      return {
        success: true,
        simulated: true,
        messageId: `wamid_sim_${Date.now()}`,
      };
    }

    const cleanPhone = to.replace(/[^0-9]/g, "");

    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: text,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta WhatsApp API error:", data);
      throw new Error(
        data.error?.message || "Failed to send WhatsApp message"
      );
    }

    return {
      success: true,
      data,
    };
  }

  // Send structured appointment confirmation
  async sendBookingConfirmation({
    to,
    patientName,
    doctorName,
    date,
    time,
    clinicName = "DOCTECH Clinic",
    credentials,
  }: SendBookingConfirmationParams) {
    const confirmationText = `Ù…Ø±ØØ¨Ù‹Ø§ ${patientName} ðŸ‘‹\n\nØªÙ… Ø§Ø³ØªÙ„Ø§Ù… ÙˆØªÙƒÙŠÙŠØ¯ ØØ¬Ø² ÙƒØ´ÙÙƒ ÙÙŠ ${clinicName} Ø¨Ù†Ø¬Ø§Ø âœ…\n\nðŸ“… Ø§Ù„Ù…ÙˆØ¹Ø¯: ${date} Ø§Ù„Ø³Ø§Ø¹Ø© ${time}\nðŸ‘¨â€âš•ï¸ Ø§Ù„Ø·Ø¨ÙŠØ¨: ${doctorName}\n\nðŸ“ ÙŠØ±Ø¬Ù‰ Ø§Ù„ØØ¶ÙˆØ± Ù‚Ø¨Ù„ Ø§Ù„Ù…ÙˆØ¹Ø¯ Ø¨Ù€ Ù¡Ù  Ø¯Ù‚Ø§Ø¦Ù‚. ÙÙŠ ØØ§Ù„ Ø§Ù„Ø±ØºØ¨Ø© ÙÙŠ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø£Ùˆ Ø§Ù„Ø§Ø³ØªÙØ³Ø§Ø± ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø±Ø¯ Ø¹Ù„Ù‰ Ù‡Ø°Ù‡ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù…Ø¨Ø§Ø´Ø±Ø©. Ù†ØªÙ…Ù†Ù‰ Ù„Ùƒ Ø¯ÙˆØ§Ù… Ø§Ù„ØµØØ© ÙˆØ§Ù„Ø¹Ø§ÙÙŠØ©! ðŸ©º`;

    return this.sendTextMessage({
      to,
      text: confirmationText,
      credentials,
    });
  }

  // Mark incoming WhatsApp message as read
  async markAsRead(
    messageId: string,
    credentials?: WhatsAppCredentials
  ) {
    const phoneNumberId =
      credentials?.phoneNumberId || this.phoneNumberId;

    const accessToken =
      credentials?.accessToken || this.accessToken;

    if (!phoneNumberId || !accessToken) {
      return {
        success: true,
        simulated: true,
      };
    }

    try {
      await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
          }),
        }
      );
    } catch (e) {
      console.error("markAsRead error:", e);
    }
  }
}

export const metaWhatsApp = new MetaWhatsAppClient();