import { NextResponse } from "next/server";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getConversation, listMessages } from "@/lib/whatsapp/store";

/** GET /api/whatsapp/conversations/[id] — the thread header plus its messages. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.WHATSAPP_VIEW });

    const conversation = await getConversation(id, session.clinicId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const messages = await listMessages(id, session.clinicId);
    return NextResponse.json({
      success: true,
      data: { conversation, messages: messages ?? [] },
    });
  } catch (error) {
    return toErrorResponse(error, "WhatsApp thread GET error:");
  }
}
