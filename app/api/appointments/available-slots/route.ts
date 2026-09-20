import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/schedule/availabilityService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const doctorId = searchParams.get("doctorId");
    const date =
      searchParams.get("date") ||
      new Date().toISOString().split("T")[0];

    if (!doctorId) {
      return NextResponse.json(
        {
          success: false,
          error: "doctorId is required",
        },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(doctorId, date);

    return NextResponse.json({
      success: true,
      doctorId,
      date,
      slots,
    });
  } catch (error) {
    console.error("Available slots error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch available slots",
      },
      { status: 500 }
    );
  }
}