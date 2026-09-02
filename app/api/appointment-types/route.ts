import { NextResponse } from "next/server";

export async function GET() {
  try {
    const types = [
      { id: "type-1", nameEn: "New Consultation", nameAr: "كشف أول مرة", fee: 400, isActive: true },
      { id: "type-2", nameEn: "Follow-up Check", nameAr: "إعادة واستشارة", fee: 200, isActive: true },
      { id: "type-3", nameEn: "Post-Op Wound Review", nameAr: "مراجعة جراحية", fee: 300, isActive: true },
      { id: "type-4", nameEn: "Urgent Clinical Visit", nameAr: "كشف طارئ", fee: 500, isActive: true },
      { id: "type-5", nameEn: "Lab Results Follow-up", nameAr: "متابعة تحاليل وأشعة", fee: 150, isActive: true },
    ];

    return NextResponse.json({ success: true, types });
  } catch (error) {
    console.error("Appointment types error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch appointment types" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nameEn, nameAr, fee } = body;

    const newType = {
      id: `type-${Date.now()}`,
      nameEn,
      nameAr,
      fee: Number(fee) || 300,
      isActive: true,
    };

    return NextResponse.json({ success: true, type: newType });
  } catch (error) {
    console.error("Create appointment type error:", error);
    return NextResponse.json({ success: false, error: "Failed to create appointment type" }, { status: 500 });
  }
}
