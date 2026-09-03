import { NextResponse } from "next/server";
import { processHermesMessage } from "@/lib/ai/hermesAgent";
import { createNotification } from "@/lib/notificationService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fromPhone = "201031445949",
      patientName = "مريض تجريبي",
      messageText,
      clinicContextPrompt,
    } = body;

    if (!messageText || typeof messageText !== "string" || !messageText.trim()) {
      return NextResponse.json(
        { success: false, error: "messageText is required" },
        { status: 400 }
      );
    }

    // Process message through AI assistant
    const result = await processHermesMessage({
      fromPhone,
      patientName,
      messageText: messageText.trim(),
      clinicContextPrompt: clinicContextPrompt || undefined,
    });

    // If an appointment booking was requested, notify reception
    if (result.createdBookingRequest) {
      try {
        await createNotification({
          role: "secretary",
          type: "AI_BOOKING_REQUEST",
          title: "طلب حجز جديد من المساعد الذكي",
          titleAr: "طلب حجز جديد من المساعد الذكي",
          body: `${patientName} (${fromPhone}) requested consultation: "${messageText.trim().slice(0, 50)}"`,
          bodyAr: `${patientName} (${fromPhone}) طلب كشف: "${messageText.trim().slice(0, 50)}"`,
          link: "whatsapp",
        });
      } catch (notifErr) {
        console.warn("Failed creating AI booking notification:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WhatsApp simulation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process simulation" },
      { status: 500 }
    );
  }
}
