import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getConversation, recordMessage } from "@/lib/whatsapp/store";
import { metaWhatsApp } from "@/lib/whatsapp/metaClient";

const SendMessageSchema = z.object({
  text: z.string().trim().min(1).max(4000),
});

/** POST /api/whatsapp/conversations/[id]/messages — send a clinic reply. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.WHATSAPP_SEND });

    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "text is required (1-4000 characters)" },
        { status: 400 }
      );
    }

    const conversation = await getConversation(id, session.clinicId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Deliver first: nothing is recorded unless Cloud API accepted it.
    try {
      await metaWhatsApp.sendTextMessage({ to: conversation.waId, text: parsed.data.text });
    } catch (error) {
      throw new ApiError(
        502,
        error instanceof Error ? error.message : "Failed to send the WhatsApp message"
      );
    }

    const messageId = await recordMessage({
      conversationId: conversation.id,
      from: "clinic",
      content: parsed.data.text,
      status: "SENT",
    });

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "Message delivered but could not be stored" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: messageId,
        conversationId: conversation.id,
        from: "clinic",
        content: parsed.data.text,
        status: "SENT",
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return toErrorResponse(error, "WhatsApp send error:");
  }
}
