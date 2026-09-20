import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

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
    const role = searchParams.get("role") || session.role;

    const { data: dbNotifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("clinic_id", session.clinicId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Notifications GET error:", error);
      return NextResponse.json({ success: true, notifications: [], role });
    }

    const notifications = (dbNotifications || []).map((n) => {
      const createdAt = n.created_at || new Date().toISOString();
      const diffMs = Date.now() - new Date(createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let timeStr = "Just now";
      if (diffMins >= 60) {
        const hours = Math.floor(diffMins / 60);
        timeStr = `${hours}h ago`;
      } else if (diffMins > 0) {
        timeStr = `${diffMins}m ago`;
      }

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        titleAr: n.title,
        body: n.body,
        bodyAr: n.body,
        time: timeStr,
        isRead: n.is_read,
        link: n.link || "dashboard",
        createdAt,
      };
    });

    return NextResponse.json({ success: true, notifications, role });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
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
    const { notificationId, markAll } = body;

    if (markAll) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("clinic_id", session.clinicId);

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (notificationId) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("clinic_id", session.clinicId);

      return NextResponse.json({
        success: true,
        message: `Notification ${notificationId} marked as read`,
      });
    }

    return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}

