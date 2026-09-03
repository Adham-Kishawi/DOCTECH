import { NextResponse } from "next/server";
import { processHermesMessage } from "@/lib/ai/hermesAgent";
import { metaWhatsApp } from "@/lib/whatsapp/metaClient";

// 1. GET: Webhook verification endpoint for Meta Developers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "doctech_whatsapp_webhook_secret_2026";

    if (mode === "subscribe" && token === expectedToken) {
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
  try {
    const body = await request.json();

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
    const senderName = value?.contacts?.[0]?.profile?.name || "Patient";

    console.log(`[WhatsApp Incoming] From: ${senderName} (${fromPhone}): "${messageText}"`);

    // Mark message as read
    await metaWhatsApp.markAsRead(messageId);

    // Process via AI Assistant
    const hermesResult = await processHermesMessage({
      fromPhone,
      patientName: senderName,
      messageText,
    });

    // Send AI reply back via WhatsApp Cloud API
    await metaWhatsApp.sendTextMessage({
      to: fromPhone,
      text: hermesResult.replyText,
    });

    console.log(`[AI Reply Sent] To: ${fromPhone}, Intent: ${hermesResult.intent}`);

    return NextResponse.json({
      success: true,
      intent: hermesResult.intent,
      createdBookingRequest: hermesResult.createdBookingRequest,
    });
  } catch (error) {
    console.error("WhatsApp Webhook POST error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
