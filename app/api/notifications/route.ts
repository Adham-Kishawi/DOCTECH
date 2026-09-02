import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "secretary";

    const mockNotifications = [
      {
        id: "notif-1",
        type: "AI_BOOKING_REQUEST",
        title: "New AI Booking Request (Hermes)",
        titleAr: "طلب حجز جديد من الذكاء الاصطناعي (Hermes)",
        body: "Sara Ibrahim requested consultation today at 10:30 AM via WhatsApp.",
        bodyAr: "سارة إبراهيم طلبت كشف اليوم الساعة ١٠:٣٠ ص عبر الواتساب.",
        time: "5 mins ago",
        isRead: false,
        link: "appointments/pending",
        createdAt: new Date().toISOString(),
      },
      {
        id: "notif-2",
        type: "NEW_APPOINTMENT",
        title: "New Appointment Scheduled",
        titleAr: "تم تسجيل حجز جديد",
        body: "Youssef Nabil booked for 09:30 AM with Dr. Ahmed Hossam.",
        bodyAr: "تم حجز موعد ليوسف نبيل الساعة ٠٩:٣٠ ص مع د. أحمد حسام.",
        time: "25 mins ago",
        isRead: false,
        link: "appointments",
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: "notif-3",
        type: "NEW_REPORT",
        title: "Urgent Medical Inquiry",
        titleAr: "استفسار طبي عاجل",
        body: "Kareem Tarek sent high-fever symptoms report for review.",
        bodyAr: "كريم طارق أرسل تقرير أعراض حرارة مرتفعة للمراجعة.",
        time: "1 hour ago",
        isRead: true,
        link: "reports",
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({ success: true, notifications: mockNotifications, role });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    return NextResponse.json({
      success: true,
      message: markAll ? "All marked as read" : `Notification ${notificationId} marked as read`,
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}
