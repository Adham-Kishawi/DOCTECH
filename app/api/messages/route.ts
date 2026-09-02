import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || "cln-001";

    const mockMessages = [
      { id: "1", sender: "secretary", text: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.", time: "09:15 AM", isRead: true },
      { id: "2", sender: "doctor", text: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.", time: "09:18 AM", isRead: true },
      { id: "3", sender: "secretary", text: "CBC report is uploaded and attached to his case file.", time: "09:20 AM", isRead: true },
      { id: "4", sender: "secretary", text: "Doctor, Patient Ahmed Hassan has arrived at reception for his 09:00 AM checkup.", time: "09:22 AM", isRead: false },
    ];

    return NextResponse.json({ success: true, messages: mockMessages, clinicId });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender, text, clinicId } = body;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: sender || "secretary",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
      clinicId: clinicId || "cln-001",
    };

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to post message" }, { status: 500 });
  }
}
