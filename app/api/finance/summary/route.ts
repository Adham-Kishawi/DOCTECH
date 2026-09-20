import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getClinicSession();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const clinicId = session?.clinicId || searchParams.get("clinicId");

    // 1. Fetch appointments
    let aptQuery = supabase
      .from("appointments")
      .select("*, patients(name), doctors(name)")
      .order("date", { ascending: false });

    if (clinicId) {
      aptQuery = aptQuery.eq("clinic_id", clinicId);
    }
    if (doctorId) {
      aptQuery = aptQuery.eq("doctor_id", doctorId);
    }

    const { data: appointments, error: aptError } = await aptQuery;
    if (aptError) {
      console.warn("Summary appointments error:", aptError.message);
    }

    const aptList = appointments || [];

    // 2. Fetch expenses
    let expQuery = supabase.from("expenses").select("*");
    if (clinicId) {
      expQuery = expQuery.eq("clinic_id", clinicId);
    }
    if (doctorId) {
      expQuery = expQuery.eq("doctor_id", doctorId);
    }

    const { data: expenses, error: expError } = await expQuery;
    if (expError) {
      console.warn("Summary expenses error:", expError.message);
    }

    const expList = expenses || [];

    // 3. Compute metrics
    const todayStr = new Date().toISOString().split("T")[0];

    let totalRevenue = 0;
    let todayRevenue = 0;
    let totalAppointments = aptList.length;
    let paidAppointments = 0;
    let unpaidAppointments = 0;

    const byPaymentMethod: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      INSURANCE: 0,
    };

    const recentTransactions: any[] = [];

    // Grouping by last 7 days for weeklyTrend
    const daysMap: Record<string, { day: string; revenue: number; consultations: number }> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split("T")[0];
      const name = dayNames[d.getDay()];
      daysMap[k] = { day: name, revenue: 0, consultations: 0 };
    }

    aptList.forEach((apt: any) => {
      const paid = Number(apt.amount_paid) || 0;
      const fee = Number(apt.fee) || 0;
      const method = (apt.payment_method as string) || "CASH";
      const aptDateStr = apt.date ? apt.date.split("T")[0] : "";

      totalRevenue += paid;

      if (aptDateStr === todayStr) {
        todayRevenue += paid;
      }

      if (paid >= fee && fee > 0) {
        paidAppointments += 1;
      } else if (fee > paid) {
        unpaidAppointments += 1;
      }

      if (paid > 0 && byPaymentMethod[method] !== undefined) {
        byPaymentMethod[method] += paid;
      }

      if (daysMap[aptDateStr]) {
        daysMap[aptDateStr].revenue += paid;
        daysMap[aptDateStr].consultations += 1;
      }

      if (recentTransactions.length < 10 && paid > 0) {
        const aptDate = apt.date ? new Date(apt.date) : new Date();
        recentTransactions.push({
          id: apt.id,
          patientName: apt.patients?.name || "Patient",
          amount: paid,
          method,
          date: aptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          doctor: apt.doctors?.name || "Doctor",
          status: paid >= fee ? "PAID" : "PENDING",
        });
      }
    });

    // Cash drawer computation (Cash in - Cash out)
    const cashOut = expList
      .filter((e: any) => (e.payment_method || "CASH") === "CASH")
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const cashInDrawer = Math.max(0, (byPaymentMethod.CASH || 0) - cashOut);

    const weeklyTrend = Object.values(daysMap);

    const summary = {
      totalRevenue,
      todayRevenue,
      totalAppointments,
      paidAppointments,
      unpaidAppointments,
      cashInDrawer,
      byPaymentMethod,
      recentTransactions,
      weeklyTrend,
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Finance summary error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch financial data" }, { status: 500 });
  }
}
