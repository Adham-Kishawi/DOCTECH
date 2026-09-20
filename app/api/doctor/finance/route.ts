import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

export const dynamic = "force-dynamic";

export interface ExpenseItem {
  id: string;
  category: "SALARIES" | "UTILITIES" | "RENT" | "SUPPLIES" | "LAB" | "MAINTENANCE" | "MARKETING" | "TAXES" | "MISC";
  categoryNameEn: string;
  categoryNameAr: string;
  titleEn: string;
  titleAr: string;
  amount: number;
  date: string;
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER";
  paidTo?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface RevenueItem {
  id: string;
  type: "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "REPORT" | "OTHER";
  typeNameEn: string;
  typeNameAr: string;
  patientName: string;
  patientNameAr: string;
  amount: number;
  date: string;
  time: string;
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "INSURANCE";
  status: "PAID" | "PENDING";
}

export interface MonthFinancialRecord {
  monthKey: string; // "2026-09"
  monthNameEn: string;
  monthNameAr: string;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  totalVisits: number;
  avgPerPatient: number;
  revenueGrowthMoM: number;
  expensesGrowthMoM: number;
  expenses: ExpenseItem[];
  revenues: RevenueItem[];
  weeklyTrend: {
    week: string;
    weekAr: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }[];
}

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
    const session = await getClinicSession();
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const clinicId = session?.clinicId || searchParams.get("clinicId");
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
    const monthApts = allApts.filter((apt: any) => apt.date && apt.date.startsWith(selectedMonth));
    const monthExps = allExps.filter((exp: any) => exp.date && exp.date.startsWith(selectedMonth));

    // Previous month calculation for MoM
    const prevDate = new Date(year, monthIndex - 1, 1);
    const prevMonthKey = prevDate.toISOString().slice(0, 7);
    const prevApts = allApts.filter((apt: any) => apt.date && apt.date.startsWith(prevMonthKey));
    const prevExps = allExps.filter((exp: any) => exp.date && exp.date.startsWith(prevMonthKey));

    const prevGross = prevApts.reduce((s: number, a: any) => s + (Number(a.amount_paid) || 0), 0);
    const prevExpenses = prevExps.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

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
        amount: Number(e.amount) || 0,
        date: e.date?.split("T")[0] || e.date,
        paymentMethod: (e.payment_method || "CASH") as ExpenseItem["paymentMethod"],
        paidTo: e.paid_to || undefined,
        notes: e.notes || undefined,
        isRecurring: Boolean(e.is_recurring),
      };
    });

    // Format current month revenues
    const formattedRevenues: RevenueItem[] = monthApts.map((a: any) => {
      const aptDate = a.date ? new Date(a.date) : new Date();
      const amount = Number(a.amount_paid) || Number(a.fee) || 0;
      return {
        id: a.id,
        type: (a.type || "CONSULTATION") as RevenueItem["type"],
        typeNameEn: a.type || "Consultation",
        typeNameAr: a.type || "كشف",
        patientName: a.patients?.name || "Patient",
        patientNameAr: a.patients?.name || "مريض",
        amount,
        date: a.date?.split("T")[0] || "",
        time: aptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
    console.error("Doctor finance API error:", error);
    return NextResponse.json({ success: false, error: "Failed to load financial records" }, { status: 500 });
  }
}
