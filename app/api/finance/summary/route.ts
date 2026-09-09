import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date") || "today";

    const mockSummary = {
      totalRevenue: doctorId ? 2850 : 5400,
      todayRevenue: doctorId ? 1450 : 2750,
      totalAppointments: doctorId ? 8 : 16,
      paidAppointments: doctorId ? 7 : 14,
      unpaidAppointments: doctorId ? 1 : 2,
      byPaymentMethod: {
        CASH: doctorId ? 850 : 1600,
        CARD: doctorId ? 400 : 750,
        BANK_TRANSFER: doctorId ? 200 : 400,
        INSURANCE: 0,
      },
      recentTransactions: [
        { id: "TX-101", patientName: "Ahmed Hassan", amount: 350, method: "CASH", date: "Today, 09:15 AM", doctor: "Dr. Ahmed Hossam", status: "PAID" },
        { id: "TX-102", patientName: "Youssef Nabil", amount: 400, method: "CARD", date: "Today, 09:40 AM", doctor: "Dr. Ahmed Hossam", status: "PAID" },
        { id: "TX-103", patientName: "Sara Ibrahim", amount: 450, method: "CASH", date: "Today, 10:45 AM", doctor: "Dr. Ahmed Hossam", status: "PENDING" },
        { id: "TX-104", patientName: "Mohamed Ali", amount: 300, method: "BANK_TRANSFER", date: "Today, 11:15 AM", doctor: "Dr. Ahmed Hossam", status: "PAID" },
        { id: "TX-105", patientName: "Fatima Omar", amount: 350, method: "CASH", date: "Today, 01:10 PM", doctor: "Dr. Ahmed Hossam", status: "PAID" },
      ],
      weeklyTrend: [
        { day: "Sat", revenue: 1800, consultations: 5 },
        { day: "Sun", revenue: 2400, consultations: 7 },
        { day: "Mon", revenue: 2100, consultations: 6 },
        { day: "Tue", revenue: 2850, consultations: 8 },
        { day: "Wed", revenue: 2600, consultations: 7 },
        { day: "Thu", revenue: 1950, consultations: 5 },
      ],
    };

    return NextResponse.json({ success: true, summary: mockSummary });
  } catch (error) {
    console.error("Finance summary error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch financial data" }, { status: 500 });
  }
}
