import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse } from "@/lib/apiAuth";
import type { SystemNotification } from "@/types/index";

const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  }
  if (diffMins > 0) {
    return `${diffMins}m ago`;
  }
  return "Just now";
};

export async function GET() {
  try {
    const session = await requireSession();

    // Notifications targeted at a role are only visible to that role; the
    // clinic scope itself comes from the session, never from the query string.
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("clinic_id", session.clinicId)
      .in("role", ["all", session.role])
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Notifications GET error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to load notifications" },
        { status: 500 }
      );
    }

    const notifications: SystemNotification[] = (data || []).map((n) => {
      const createdAt = n.created_at || new Date().toISOString();
      return {
        id: n.id,
        clinicId: n.clinic_id,
        role: n.role || "all",
        type: n.type,
        title: n.title,
        titleAr: n.title_ar || n.title,
        body: n.body,
        bodyAr: n.body_ar || n.body,
        time: timeAgo(createdAt),
        isRead: Boolean(n.is_read),
        link: n.link || "dashboard",
        createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      notifications,
      role: session.role,
    });
  } catch (error) {
    return toErrorResponse(error, "Notifications GET error");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("clinic_id", session.clinicId)
        .in("role", ["all", session.role]);

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to update notifications" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (notificationId) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("clinic_id", session.clinicId)
        .in("role", ["all", session.role]);

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to update notification" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Notification ${notificationId} marked as read`,
      });
    }

    return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    return toErrorResponse(error, "Notifications PATCH error");
  }
}
