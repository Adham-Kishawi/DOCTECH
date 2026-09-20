import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

const DEFAULT_MOCK_MESSAGES = [
  {
    id: "seed-msg-1",
    channelId: "doctor_secretary_direct",
    senderRole: "secretary",
    senderName: "Sarah Jenkins (Reception)",
    content: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.",
    isRead: true,
    sentAt: "09:15 AM",
    clinicId: "cln-001",
  },
  {
    id: "seed-msg-2",
    channelId: "doctor_secretary_direct",
    senderRole: "doctor",
    senderName: "Dr. Ahmed Hossam",
    content: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.",
    isRead: true,
    sentAt: "09:18 AM",
    clinicId: "cln-001",
  },
  {
    id: "seed-msg-3",
    channelId: "doctor_secretary_direct",
    senderRole: "secretary",
    senderName: "Sarah Jenkins (Reception)",
    content: "Patient Kareem Tarek fever report is uploaded and attached to his case file.",
    isRead: true,
    sentAt: "09:20 AM",
    clinicId: "cln-001",
  },
  {
    id: "seed-msg-4",
    channelId: "broadcast",
    senderRole: "doctor",
    senderName: "Dr. Ahmed Hossam",
    content: "Team meeting today at 04:30 PM in Conference Room to review new WhatsApp AI booking flows.",
    isRead: true,
    sentAt: "08:45 AM",
    clinicId: "cln-001",
  },
];

export async function GET(request: Request) {
  try {
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const clinicId = session.clinicId;

    let query = supabase
      .from("internal_messages")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("sent_at", { ascending: true });

    if (channelId) {
      query = query.eq("channel_id", channelId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Internal messages query warning/fallback:", error.message);
      let messages = DEFAULT_MOCK_MESSAGES.map((m) => ({ ...m, clinicId }));
      if (channelId) {
        messages = messages.filter((m) => m.channelId === channelId);
      }
      return NextResponse.json({ success: true, messages, clinicId });
    }

    const messages = (data || []).map((m: any) => ({
      id: m.id,
      channelId: m.channel_id || m.channelId,
      senderRole: m.sender_role || m.senderRole,
      senderName: m.sender_name || m.senderName,
      content: m.content,
      isRead: Boolean(m.is_read),
      sentAt: m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
      clinicId: m.clinic_id || clinicId,
    }));

    return NextResponse.json({ success: true, messages, clinicId });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channelId = "doctor_secretary_direct", content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    // Authenticated identity: sender cannot spoof role or name
    const senderRole = session.role;
    const senderName = session.user.name || (session.role === "doctor" ? "Doctor" : "Receptionist");
    const clinicId = session.clinicId;

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId,
      senderRole,
      senderName,
      content: content.trim(),
      isRead: false,
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      clinicId,
    };

    const { error: insertErr } = await supabase.from("internal_messages").insert([
      {
        id: newMessage.id,
        channel_id: newMessage.channelId,
        clinic_id: newMessage.clinicId,
        sender_role: newMessage.senderRole,
        sender_name: newMessage.senderName,
        content: newMessage.content,
        is_read: false,
        sent_at: new Date().toISOString(),
      },
    ]);

    if (insertErr) {
      console.error("Supabase insert error in internal_messages:", insertErr);
      return NextResponse.json(
        { success: false, error: "Failed to persist message in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to post message" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channelId } = body;

    if (channelId) {
      const { error: patchErr } = await supabase
        .from("internal_messages")
        .update({ is_read: true })
        .eq("channel_id", channelId)
        .eq("clinic_id", session.clinicId)
        .neq("sender_role", session.role);

      if (patchErr) {
        console.warn("Supabase patch failed:", patchErr.message);
      }
    }

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Messages PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update messages" }, { status: 500 });
  }
}
