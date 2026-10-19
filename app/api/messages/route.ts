import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { formatInClinicZone } from "@/lib/schedule/clinicTime";
import { createNotification } from "@/lib/serverNotifications";

interface MessageRow {
  id: string;
  channel_id: string | null;
  sender_role: string | null;
  sender_name: string | null;
  content: string;
  is_read: boolean | null;
  sent_at: string | null;
  clinic_id: string | null;
}

export async function GET(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.WHATSAPP_VIEW });

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const clinicId = session.clinicId;
    // Chat timestamps are rendered here, so they follow the clinic's clock.
    const timeZone = await getClinicTimezone(clinicId);

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
      console.error("Internal messages query failed:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to load messages" },
        { status: 500 }
      );
    }

    const messages = (data || []).map((m: MessageRow) => ({
      id: m.id,
      channelId: m.channel_id || "doctor_secretary_direct",
      senderRole: m.sender_role === "doctor" ? "doctor" : "secretary",
      senderName: m.sender_name || "",
      content: m.content,
      isRead: Boolean(m.is_read),
      sentAt: m.sent_at
        ? formatInClinicZone(
            m.sent_at,
            timeZone,
            { hour: "2-digit", minute: "2-digit" },
            "en-US",
            "Now"
          )
        : "Now",
      clinicId: m.clinic_id || clinicId,
    }));

    return NextResponse.json({ success: true, messages, clinicId });
  } catch (error) {
    return toErrorResponse(error, "Messages GET error:");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.WHATSAPP_SEND });

    const body = await request.json();
    const { channelId = "doctor_secretary_direct", content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    if (typeof channelId !== "string" || !/^[\w-]{1,64}$/.test(channelId)) {
      return NextResponse.json({ success: false, error: "Invalid channelId" }, { status: 400 });
    }

    // Authenticated identity: sender cannot spoof role or name
    const senderRole = session.role;
    const senderName = session.user.name || (session.role === "doctor" ? "Doctor" : "Receptionist");
    const clinicId = session.clinicId;
    const timeZone = await getClinicTimezone(clinicId);

    // The optimistic row rendered by the sender keeps its client id, so it is
    // honoured here when it is a safe, already-namespaced identifier.
    const clientId =
      typeof body.id === "string" && /^msg-[\w-]{1,56}$/.test(body.id) ? body.id : null;

    const newMessage = {
      id: clientId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      channelId,
      senderRole,
      senderName,
      content: content.trim(),
      isRead: false,
      sentAt: formatInClinicZone(new Date(), timeZone, {
        hour: "2-digit",
        minute: "2-digit",
      }),
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

    // Tell the other side of the conversation. A failed notification never
    // fails the message itself.
    try {
      const recipientRole = senderRole === "doctor" ? "secretary" : "doctor";
      await createNotification({
        clinicId,
        role: recipientRole,
        type: "INTERNAL_MESSAGE",
        title:
          senderRole === "secretary"
            ? `New direct message from ${senderName}`
            : `New clinical note from ${senderName}`,
        titleAr:
          senderRole === "secretary"
            ? `رسالة مباشرة جديدة من ${senderName}`
            : `توجيه سريري جديد من ${senderName}`,
        body: newMessage.content.slice(0, 200),
        bodyAr: newMessage.content.slice(0, 200),
        link: "communications",
      });
    } catch (notifErr) {
      console.warn("Failed creating internal message notification:", notifErr);
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return toErrorResponse(error, "Messages POST error:");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.WHATSAPP_SEND });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error, "Messages PATCH error:");
  }
}
