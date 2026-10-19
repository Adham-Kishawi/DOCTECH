import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { formatInClinicZone, wallDate } from "@/lib/schedule/clinicTime";
import { fromPiastres } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.FINANCE_VIEW });
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    // Tenant comes from the session ONLY — never from the query string.
    const clinicId = session.clinicId;
    // Every date bucket below is a clinic calendar day, not a UTC day.
    const timeZone = await getClinicTimezone(clinicId);

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
    // `toISOString().split("T")[0]` is the UTC calendar day — the previous day
    // for anything booked late in the clinic's evening. Bucket by the clinic's
    // own calendar instead.
    const todayStr = wallDate(new Date(), timeZone);

    let totalRevenue = 0;
    let todayRevenue = 0;
    const totalAppointments = aptList.length;
    let paidAppointments = 0;
    let unpaidAppointments = 0;

    const byPaymentMethod: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      INSURANCE: 0,
    };

    const recentTransactions: any[] = [];

    // Grouping by last 7 days for weeklyTrend.
    // Pure calendar arithmetic on the clinic's own day: deriving each bucket by
    // subtracting 86400000 ms from "now" renames or duplicates a column
    // whenever a DST change falls inside the window.
    const daysMap: Record<string, { day: string; revenue: number; consultations: number }> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const [todayY, todayM, todayD] = todayStr.split("-").map(Number);
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.UTC(todayY, todayM - 1, todayD - i));
      const k = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(
        day.getUTCDate()
      ).padStart(2, "0")}`;
      if (daysMap[k]) continue;
      daysMap[k] = { day: dayNames[day.getUTCDay()], revenue: 0, consultations: 0 };
    }

    aptList.forEach((apt: any) => {
      const paid = Number(apt.amount_paid) || 0;
      const fee = Number(apt.fee) || 0;
      const method = (apt.payment_method as string) || "CASH";
      // The clinic's calendar day. Splitting the ISO string takes the UTC day,
      // so a 00:30 booking (22:30 UTC the previous day) lands in yesterday.
      const aptDateStr = apt.date ? wallDate(new Date(apt.date), timeZone) : "";

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
        recentTransactions.push({
          id: apt.id,
          patientName: apt.patients?.name || "Patient",
          amount: paid,
          method,
          date: formatInClinicZone(
            apt.date,
            timeZone,
            { month: "short", day: "numeric" },
            "en-US",
            "Today"
          ),
          doctor: apt.doctors?.name || "Doctor",
          status: paid >= fee ? "PAID" : "PENDING",
        });
      }
    });

    // Cash drawer computation (Cash in - Cash out)
    // expenses.amount is stored in piastres; the drawer is reported in EGP.
    const cashOut = expList
      .filter((e: any) => (e.payment_method || "CASH") === "CASH")
      .reduce((sum: number, e: any) => sum + fromPiastres(Number(e.amount) || 0), 0);
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
    return toErrorResponse(error, "Finance summary error");
  }
}
