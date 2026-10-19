import { NextResponse } from "next/server";
import { processHermesMessage } from "@/lib/ai/hermesAgent";
import { metaWhatsApp } from "@/lib/whatsapp/metaClient";
import { verifyMetaSignature } from "@/lib/whatsapp/verifySignature";
import {
  ensureConversation,
  findPatientByPhone,
  listMessages,
  recordMessage,
} from "@/lib/whatsapp/store";
import { createNotification } from "@/lib/serverNotifications";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** The slice of Meta's webhook payload this handler reads. */
interface MetaWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ profile?: { name?: string } }>;
        messages?: Array<{ id?: string; from?: string; text?: { body?: string } }>;
      };
    }>;
  }>;
}

// 1. GET: Webhook verification endpoint for Meta Developers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (!expectedToken) {
      console.error("[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set in environment.");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    if (mode === "subscribe" && token && token === expectedToken) {
      console.log("WhatsApp Webhook verified successfully!");
      return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden: Verification token mismatch", { status: 403 });
  } catch (error) {
    console.error("Webhook GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// 2. POST: Ingest incoming WhatsApp messages -> AI Assistant -> Reply
export async function POST(request: Request) {
  // The raw body MUST be read as text: Meta signs the exact bytes it sent, so
  // `request.json()` would re-serialize and invalidate the signature.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Verify the X-Hub-Signature-256 header before doing anything else.
  const signatureValid = verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"));
  if (!signatureValid.valid) {
    console.warn(
      `[WhatsApp Webhook] Rejected POST — signature ${signatureValid.reason}. ` +
        "Incoming messages are NOT trusted."
    );
    // Always 401 on failure: never reveal whether the secret is simply missing.
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: MetaWebhookPayload;
  try {
    body = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    // Validate Meta Cloud API Webhook payload structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Status update or read receipt event
      return NextResponse.json({ status: "acknowledged" });
    }

    const fromPhone = message.from; // e.g. "201001234567"
    const messageId = message.id;
    const messageText = message.text?.body || "";
    const senderName = value?.contacts?.[0]?.profile?.name || "";

    if (!fromPhone || !messageId) {
      console.warn("[WhatsApp] Payload without sender or message id — ignored.");
      return NextResponse.json({ status: "acknowledged", reason: "malformed_message" });
    }

    console.log(`[WhatsApp Incoming] Message event received (id: ${messageId || "unknown"})`);

    // Mark message as read
    await metaWhatsApp.markAsRead(messageId);

    // Resolve the tenant: an unknown number is logged, never guessed.
    const contact = await findPatientByPhone(fromPhone);
    if (!contact) {
      console.warn(`[WhatsApp] No patient matches ${fromPhone}; message stored nowhere.`);
      return NextResponse.json({ status: "acknowledged", reason: "unknown_number" });
    }

    const conversation = await ensureConversation(contact, fromPhone);
    if (!conversation) {
      console.warn(`[WhatsApp] Could not open a conversation for ${fromPhone}.`);
      return NextResponse.json({ status: "acknowledged", reason: "conversation_failed" });
    }

    await recordMessage({
      conversationId: conversation.id,
      from: "patient",
      content: messageText,
      waMessageId: messageId,
      status: "RECEIVED",
    });

    // Recent thread as context for the assistant
    const history = await listMessages(conversation.id, contact.clinicId);
    const conversationHistory = (history ?? [])
      .filter((entry) => entry.from !== "patient" && entry.content)
      .slice(-6)
      .map((entry) => ({
        role: entry.from === "clinic" || entry.from === "ai" ? ("assistant" as const) : ("user" as const),
        text: entry.content,
      }));

    const hermesResult = await processHermesMessage({
      fromPhone,
      patientName: contact.name || senderName,
      messageText,
      conversationHistory,
      clinicId: contact.clinicId,
    });

    const replyId = await recordMessage({
      conversationId: conversation.id,
      from: "ai",
      content: hermesResult.replyText,
      status: "PENDING",
    });

    // Send AI reply back via WhatsApp Cloud API
    let replyStatus = "SENT";
    try {
      await metaWhatsApp.sendTextMessage({
        to: fromPhone,
        text: hermesResult.replyText,
      });
    } catch (error) {
      replyStatus = "FAILED";
      console.error("[WhatsApp] Failed to deliver AI reply:", error);
    }

    if (replyId) {
      await supabaseAdmin.from("whatsapp_messages").update({ status: replyStatus }).eq("id", replyId);
    }

    // A detected booking request reaches reception as a real notification.
    if (hermesResult.createdBookingRequest) {
      try {
        await createNotification({
          clinicId: contact.clinicId,
          role: "secretary",
          type: "AI_BOOKING_REQUEST",
          title: "طلب حجز جديد عبر واتساب",
          titleAr: "طلب حجز جديد عبر واتساب",
          body: `${contact.name || fromPhone} asked about a booking: "${messageText.slice(0, 50)}"`,
          bodyAr: `${contact.name || fromPhone} طلب حجز: "${messageText.slice(0, 50)}"`,
          link: "whatsapp",
        });
      } catch (notifErr) {
        console.warn("Failed creating AI booking notification:", notifErr);
      }
    }

    console.log(
      `[AI Reply Sent] To: ${fromPhone}, Intent: ${hermesResult.intent}, Delivery: ${replyStatus}`
    );

    return NextResponse.json({
      success: true,
      intent: hermesResult.intent,
      createdBookingRequest: hermesResult.createdBookingRequest,
      delivery: replyStatus,
    });
  } catch (error) {
    console.error("WhatsApp Webhook POST error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
