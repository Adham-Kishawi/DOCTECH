import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { clinicCalendarDate, formatInClinicZone, wallDate } from "@/lib/schedule/clinicTime";
import { fromPiastres } from "@/lib/money";
import type { ExpenseItem, MonthFinancialRecord, RevenueItem } from "@/types/index";

export const dynamic = "force-dynamic";

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const EXPENSE_CATEGORY_NAMES: Record<string, { en: string; ar: string }> = {
  SALARIES: { en: "Salaries & Staff", ar: "المرتبات والأجور" },
  UTILITIES: { en: "Electricity & Utilities", ar: "الكهرباء والمرافق" },
  RENT: { en: "Clinic Rent", ar: "إيجار العيادة والمقر" },
  SUPPLIES: { en: "Medical Supplies", ar: "المستلزمات الطبية" },
  LAB: { en: "Laboratory & Tests", ar: "المعمل والتحاليل" },
  MAINTENANCE: { en: "Maintenance & Repairs", ar: "الصيانة والتشغيل" },
  MARKETING: { en: "Marketing & Ads", ar: "التسويق والدعاية" },
  TAXES: { en: "Taxes & Licenses", ar: "الضرائب والتراخيص" },
  MISC: { en: "Petty Cash & Misc", ar: "نثريات ومصروفات عامة" },
};

export async function GET(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.FINANCE_VIEW });
    const { searchParams } = new URL(request.url);
    // Tenant comes from the session ONLY — never from the query string.
    const clinicId = session.clinicId;
    // Month and day buckets below are clinic calendar boundaries; deriving them
    // from UTC puts the first hours of the clinic's month into the previous one.
    const timeZone = await getClinicTimezone(clinicId);
    const selectedMonth = searchParams.get("month") || wallDate(new Date(), timeZone).slice(0, 7);
    const doctorId = session?.role === "doctor" ? session.user.id : searchParams.get("doctorId");

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const monthIndex = m - 1;

    const monthNameEn = `${MONTH_NAMES_EN[monthIndex] || ""} ${year}`;
    const monthNameAr = `${MONTH_NAMES_AR[monthIndex] || ""} ${year}`;

    // 1. Fetch appointments for revenue
    let aptQuery = supabase
      .from("appointments")
      .select("*, patients(name)")
      .order("date", { ascending: false });

    if (clinicId) aptQuery = aptQuery.eq("clinic_id", clinicId);
    if (doctorId) aptQuery = aptQuery.eq("doctor_id", doctorId);

    const { data: appointments, error: aptError } = await aptQuery;
    if (aptError) {
      console.warn("Doctor finance appointments query error:", aptError.message);
    }

    // 2. Fetch expenses
    let expQuery = supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (clinicId) expQuery = expQuery.eq("clinic_id", clinicId);
    if (doctorId) expQuery = expQuery.eq("doctor_id", doctorId);

    const { data: expenses, error: expError } = await expQuery;
    if (expError) {
      console.warn("Doctor finance expenses query error:", expError.message);
    }

    const allApts = appointments || [];
    const allExps = expenses || [];

    // Filter for current selected month
    // Month key read in the clinic's calendar. `date.startsWith(monthKey)` compares
    // against the UTC month, so anything booked in the first hours of the
    // clinic's month is filed under the previous one.
    const monthOf = (value: unknown) =>
      value ? clinicCalendarDate(value as string, timeZone).slice(0, 7) : "";

    const monthApts = allApts.filter((apt: any) => monthOf(apt.date) === selectedMonth);
    const monthExps = allExps.filter((exp: any) => monthOf(exp.date) === selectedMonth);

    // Previous month as plain calendar arithmetic on the key. Going through
    // `new Date(...).toISOString()` re-introduces the server's zone.
    const prevM = monthIndex === 0 ? 12 : monthIndex;
    const prevY = monthIndex === 0 ? year - 1 : year;
    const prevMonthKey = `${prevY}-${String(prevM).padStart(2, "0")}`;
    const prevApts = allApts.filter((apt: any) => monthOf(apt.date) === prevMonthKey);
    const prevExps = allExps.filter((exp: any) => monthOf(exp.date) === prevMonthKey);

    const prevGross = prevApts.reduce((s: number, a: any) => s + (Number(a.amount_paid) || 0), 0);
    const prevExpenses = prevExps.reduce(
      (s: number, e: any) => s + fromPiastres(Number(e.amount) || 0),
      0
    );

    // Format current month expenses
    const formattedExpenses: ExpenseItem[] = monthExps.map((e: any) => {
      const cat = (e.category || "MISC") as ExpenseItem["category"];
      const names = EXPENSE_CATEGORY_NAMES[cat] || { en: cat, ar: cat };
      return {
        id: e.id,
        category: cat,
        categoryNameEn: names.en,
        categoryNameAr: names.ar,
        titleEn: e.title,
        titleAr: e.title_ar || e.title,
        // expenses.amount is stored in piastres; the record below is in EGP.
        amount: fromPiastres(Number(e.amount) || 0),
        date: clinicCalendarDate(e.date, timeZone, e.date || ""),
        paymentMethod: (e.payment_method || "CASH") as ExpenseItem["paymentMethod"],
        paidTo: e.paid_to || undefined,
        notes: e.notes || undefined,
        isRecurring: Boolean(e.is_recurring),
      };
    });

    // Format current month revenues
    const formattedRevenues: RevenueItem[] = monthApts.map((a: any) => {
      const amount = Number(a.amount_paid) || Number(a.fee) || 0;
      return {
        id: a.id,
        type: (a.type || "CONSULTATION") as RevenueItem["type"],
        typeNameEn: a.type || "Consultation",
        typeNameAr: a.type || "كشف",
        patientName: a.patients?.name || "Patient",
        patientNameAr: a.patients?.name || "مريض",
        amount,
        date: clinicCalendarDate(a.date, timeZone),
        time: formatInClinicZone(
          a.date,
          timeZone,
          { hour: "2-digit", minute: "2-digit" },
          "en-US",
          ""
        ),
        paymentMethod: (a.payment_method || "CASH") as RevenueItem["paymentMethod"],
        status: (Number(a.amount_paid) >= Number(a.fee) && Number(a.fee) > 0) ? "PAID" : "PENDING",
      };
    });

    const grossRevenue = formattedRevenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = formattedExpenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? parseFloat(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;
    const totalVisits = monthApts.length;
    const avgPerPatient = totalVisits > 0 ? Math.round(grossRevenue / totalVisits) : 0;

    // Growth rates
    const revenueGrowthMoM = prevGross > 0 ? parseFloat((((grossRevenue - prevGross) / prevGross) * 100).toFixed(1)) : 0;
    const expensesGrowthMoM = prevExpenses > 0 ? parseFloat((((totalExpenses - prevExpenses) / prevExpenses) * 100).toFixed(1)) : 0;

    // Weekly trends (4 weeks of the month)
    const weeklyTrend = [
      { week: "Week 1", weekAr: "الأسبوع ١", revenue: 0, expenses: 0, netProfit: 0 },
      { week: "Week 2", weekAr: "الأسبوع ٢", revenue: 0, expenses: 0, netProfit: 0 },
      { week: "Week 3", weekAr: "الأسبوع ٣", revenue: 0, expenses: 0, netProfit: 0 },
      { week: "Week 4", weekAr: "الأسبوع ٤", revenue: 0, expenses: 0, netProfit: 0 },
    ];

    formattedRevenues.forEach((r) => {
      const day = parseInt(r.date.split("-")[2], 10) || 1;
      const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
      weeklyTrend[weekIndex].revenue += r.amount;
    });

    formattedExpenses.forEach((e) => {
      const day = parseInt(e.date.split("-")[2], 10) || 1;
      const weekIndex = Math.min(3, Math.floor((day - 1) / 7));
      weeklyTrend[weekIndex].expenses += e.amount;
    });

    weeklyTrend.forEach((w) => {
      w.netProfit = w.revenue - w.expenses;
    });

    const currentRecord: MonthFinancialRecord = {
      monthKey: selectedMonth,
      monthNameEn,
      monthNameAr,
      grossRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalVisits,
      avgPerPatient,
      revenueGrowthMoM,
      expensesGrowthMoM,
      expenses: formattedExpenses,
      revenues: formattedRevenues,
      weeklyTrend,
    };

    // Generate list of available months (last 6 months + current)
    const allMonths: { key: string; nameEn: string; nameAr: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(year, monthIndex - i, 1);
      const k = d.toISOString().slice(0, 7);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      allMonths.push({
        key: k,
        nameEn: `${MONTH_NAMES_EN[mIdx]} ${y}`,
        nameAr: `${MONTH_NAMES_AR[mIdx]} ${y}`,
      });
    }

    return NextResponse.json({
      success: true,
      currentMonth: currentRecord,
      allMonths,
    });
  } catch (error) {
    return toErrorResponse(error, "Doctor finance API error");
  }
}
