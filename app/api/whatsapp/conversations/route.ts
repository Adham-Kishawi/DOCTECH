import { NextResponse } from "next/server";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { listConversations } from "@/lib/whatsapp/store";

/** GET /api/whatsapp/conversations — the clinic's WhatsApp inbox. */
export async function GET() {
  try {
    const session = await requireSession({ permission: PERMISSIONS.WHATSAPP_VIEW });
    const conversations = await listConversations(session.clinicId);
    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    return toErrorResponse(error, "WhatsApp conversations GET error:");
  }
}
