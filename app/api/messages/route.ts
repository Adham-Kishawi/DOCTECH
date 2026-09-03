import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || "cln-001";
    const channelId = searchParams.get("channelId");

    let messages = DEFAULT_MOCK_MESSAGES;

    try {
      let query = supabase
        .from("internal_messages")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("sent_at", { ascending: true });

      if (channelId) {
        query = query.eq("channel_id", channelId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        messages = data.map((row) => ({
          id: row.id,
          channelId: row.channel_id || "doctor_secretary_direct",
          senderRole: row.sender_role || "secretary",
          senderName: row.sender_name || (row.sender_role === "doctor" ? "Dr. Ahmed Hossam" : "Reception"),
          content: row.content,
          isRead: !!row.is_read,
          sentAt: row.sent_at
            ? new Date(row.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
          clinicId: row.clinic_id || clinicId,
        }));
      } else if (channelId) {
        messages = DEFAULT_MOCK_MESSAGES.filter((m) => m.channelId === channelId);
      }
    } catch (dbErr) {
      console.warn("Database query skipped, returning seeded messages:", dbErr);
      if (channelId) {
        messages = DEFAULT_MOCK_MESSAGES.filter((m) => m.channelId === channelId);
      }
    }

    return NextResponse.json({ success: true, messages, clinicId });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      channelId = "doctor_secretary_direct",
      senderRole = "secretary",
      senderName,
      content,
      clinicId = "cln-001",
    } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId,
      senderRole,
      senderName: senderName || (senderRole === "doctor" ? "Dr. Ahmed Hossam" : "Reception Desk"),
      content: content.trim(),
      isRead: false,
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      clinicId,
    };

    try {
      await supabase.from("internal_messages").insert([
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
    } catch (insertErr) {
      console.warn("Supabase insert skipped or failed:", insertErr);
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to post message" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { channelId, readerRole } = body;

    try {
      if (channelId && readerRole) {
        await supabase
          .from("internal_messages")
          .update({ is_read: true })
          .eq("channel_id", channelId)
          .neq("sender_role", readerRole);
      }
    } catch (patchErr) {
      console.warn("Supabase patch failed:", patchErr);
    }

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Messages PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update messages" }, { status: 500 });
  }
}
