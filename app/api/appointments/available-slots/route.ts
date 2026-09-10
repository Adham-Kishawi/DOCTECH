// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const doctorId = searchParams.get("doctorId");
//     const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

//      Standard schedule: 9:00 AM to 5:00 PM with 30 min slots
//     const allSlots = [
//       "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
//       "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
//       "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
//       "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
//     ];

//     Mock booked slots for simulation/fallback
//     const bookedTimes = ["09:00 AM", "10:30 AM", "01:00 PM"];

//     const availableSlots = allSlots.map((time) => ({
//       time,
//       isAvailable: !bookedTimes.includes(time),
//       doctorId: doctorId || "doc-1",
//       date,
//     }));

//     return NextResponse.json({
//       success: true,
//       doctorId,
//       date,
//       slots: availableSlots,
//     });
//   } catch (error) {
//     console.error("Available slots error:", error);
//     return NextResponse.json({ success: false, error: "Failed to fetch available slots" }, { status: 500 });
//   }
// }


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