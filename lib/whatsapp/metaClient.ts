export interface SendMessageParams {
  to: string; // Recipient WhatsApp Phone Number with country code e.g. "201001234567"
  text: string;
}

export interface SendBookingConfirmationParams {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  clinicName?: string;
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
  async sendTextMessage({ to, text }: SendMessageParams) {
    if (!this.phoneNumberId || !this.accessToken) {
      console.warn("Meta WhatsApp API keys not configured. Simulating message dispatch:", { to, text });
      return { success: true, simulated: true, messageId: `wamid_sim_${Date.now()}` };
    }

    const cleanPhone = to.replace(/[^0-9]/g, "");

    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Meta WhatsApp API error:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    return { success: true, data };
  }

  // Send structured appointment confirmation
  async sendBookingConfirmation({
    to,
    patientName,
    doctorName,
    date,
    time,
    clinicName = "DOCTECH Clinic",
  }: SendBookingConfirmationParams) {
    const confirmationText = `مرحبًا ${patientName} 👋\n\nتم استلام وتأكيد حجز كشفك في ${clinicName} بنجاح ✅\n\n📅 الموعد: ${date} الساعة ${time}\n👨‍⚕️ الطبيب: ${doctorName}\n\n📍 يرجى الحضور قبل الموعد بـ ١٠ دقائق. في حال الرغبة في التعديل أو الاستفسار يمكنك الرد على هذه الرسالة مباشرة. نتمنى لك دوام الصحة والعافية! 🩺`;

    return this.sendTextMessage({ to, text: confirmationText });
  }

  // Mark incoming WhatsApp message as read
  async markAsRead(messageId: string) {
    if (!this.phoneNumberId || !this.accessToken) return { success: true, simulated: true };

    try {
      await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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
