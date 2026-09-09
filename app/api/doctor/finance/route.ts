import { NextResponse } from "next/server";

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
  profitMargin: number; // percentage (e.g. 58.5)
  totalVisits: number;
  avgPerPatient: number;
  revenueGrowthMoM: number; // percentage (+18%)
  expensesGrowthMoM: number; // percentage (+5%)
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

const mockFinancialData: Record<string, MonthFinancialRecord> = {
  "2026-09": {
    monthKey: "2026-09",
    monthNameEn: "September 2026",
    monthNameAr: "سبتمبر ٢٠٢٦",
    grossRevenue: 78500,
    totalExpenses: 32400,
    netProfit: 46100,
    profitMargin: 58.7,
    totalVisits: 164,
    avgPerPatient: 478,
    revenueGrowthMoM: 14.2,
    expensesGrowthMoM: -2.1,
    weeklyTrend: [
      { week: "Week 1", weekAr: "الأسبوع ١", revenue: 19200, expenses: 14800, netProfit: 4400 },
      { week: "Week 2", weekAr: "الأسبوع ٢", revenue: 21400, expenses: 5200, netProfit: 16200 },
      { week: "Week 3", weekAr: "الأسبوع ٣", revenue: 18900, expenses: 6100, netProfit: 12800 },
      { week: "Week 4", weekAr: "الأسبوع ٤", revenue: 19000, expenses: 6300, netProfit: 12700 },
    ],
    expenses: [
      {
        id: "EXP-09-01",
        category: "SALARIES",
        categoryNameEn: "Salaries & Staff",
        categoryNameAr: "المرتبات والأجور",
        titleEn: "Staff Payroll (Receptionist, Nurse & Assistant)",
        titleAr: "رواتب الفريق الطبي والإداري (سكرتيرة، ممرضة، ومساعد)",
        amount: 14500,
        date: "2026-09-01",
        paymentMethod: "BANK_TRANSFER",
        paidTo: "Clinic Staff (سارة ومريم ومحمود)",
        notes: "Monthly regular staff compensation",
        isRecurring: true,
      },
      {
        id: "EXP-09-02",
        category: "RENT",
        categoryNameEn: "Clinic Rent",
        categoryNameAr: "إيجار العيادة والمقر",
        titleEn: "Clinic Premises Monthly Lease",
        titleAr: "إيجار مقر العيادة الشهري",
        amount: 8000,
        date: "2026-09-01",
        paymentMethod: "BANK_TRANSFER",
        paidTo: "Al-Noor Tower Management",
        notes: "Unit 402 - Floor 4",
        isRecurring: true,
      },
      {
        id: "EXP-09-03",
        category: "UTILITIES",
        categoryNameEn: "Electricity & Utilities",
        categoryNameAr: "الكهرباء والمرافق",
        titleEn: "Electricity Bill (Air Conditioning & Devices)",
        titleAr: "فاتورة الكهرباء (التكييفات وأجهزة الكشف)",
        amount: 2450,
        date: "2026-09-05",
        paymentMethod: "CASH",
        paidTo: "South Cairo Electricity Co.",
        notes: "Summer peak consumption",
        isRecurring: true,
      },
      {
        id: "EXP-09-04",
        category: "UTILITIES",
        categoryNameEn: "Electricity & Utilities",
        categoryNameAr: "الكهرباء والمرافق",
        titleEn: "High-Speed Internet & Clinic Landline",
        titleAr: "فاتورة الإنترنت فائق السرعة والهاتف الأرضي",
        amount: 650,
        date: "2026-09-08",
        paymentMethod: "CARD",
        paidTo: "WE Telecom Egypt",
        notes: "Fiber 200Mbps static IP",
        isRecurring: true,
      },
      {
        id: "EXP-09-05",
        category: "SUPPLIES",
        categoryNameEn: "Medical Supplies",
        categoryNameAr: "المستلزمات الطبية",
        titleEn: "Sterile Gloves, Syringes & Antiseptics",
        titleAr: "قفازات معقمة، سرنجات، مطهرات، وشاش جراحي",
        amount: 3200,
        date: "2026-09-10",
        paymentMethod: "CASH",
        paidTo: "MedPharma Supplies Co.",
        notes: "Monthly bulk order batch #44",
        isRecurring: false,
      },
      {
        id: "EXP-09-06",
        category: "MAINTENANCE",
        categoryNameEn: "Maintenance & Tech",
        categoryNameAr: "الصيانة والبرمجيات",
        titleEn: "Ultrasound Device Periodic Calibration",
        titleAr: "معايرة دورية وصيانة جهاز السونار",
        amount: 1500,
        date: "2026-09-14",
        paymentMethod: "CASH",
        paidTo: "BioTech Maintenance Eng.",
        notes: "Passed 6-month certification",
        isRecurring: false,
      },
      {
        id: "EXP-09-07",
        category: "MARKETING",
        categoryNameEn: "Marketing & Ads",
        categoryNameAr: "التسويق والإعلانات",
        titleEn: "Meta Sponsored Campaigns (Facebook & IG)",
        titleAr: "حملات إعلانية ممولة على فيسبوك وانستغرام",
        amount: 1200,
        date: "2026-09-15",
        paymentMethod: "CARD",
        paidTo: "Meta Platforms",
        notes: "Awareness & online booking campaign",
        isRecurring: true,
      },
      {
        id: "EXP-09-08",
        category: "MISC",
        categoryNameEn: "Hospitality & Cleaning",
        categoryNameAr: "نثريات وضيافة ونظافة",
        titleEn: "Patient Hospitality (Coffee/Water) & Cleaning Tools",
        titleAr: "ضيافة المرضى (شاي/قهوة/مياه) وأدوات نظافة دورية",
        amount: 900,
        date: "2026-09-18",
        paymentMethod: "CASH",
        paidTo: "Petty Cash (العهدة النقدية)",
        notes: "Weekly replenishment",
        isRecurring: false,
      },
    ],
    revenues: [
      { id: "REV-101", type: "CONSULTATION", typeNameEn: "New Consultation", typeNameAr: "كشف جديد", patientName: "Ahmed Hassan", patientNameAr: "أحمد حسن", amount: 500, date: "2026-09-22", time: "09:15 AM", paymentMethod: "CASH", status: "PAID" },
      { id: "REV-102", type: "FOLLOW_UP", typeNameEn: "Follow-up Check", typeNameAr: "إعادة واستشارة", patientName: "Sara Ibrahim", patientNameAr: "سارة إبراهيم", amount: 250, date: "2026-09-22", time: "10:00 AM", paymentMethod: "CARD", status: "PAID" },
      { id: "REV-103", type: "PROCEDURE", typeNameEn: "Minor Surgical Wound Care", typeNameAr: "غيار جراحي وخياطة صغرى", patientName: "Mohamed Ali", patientNameAr: "محمد علي", amount: 850, date: "2026-09-22", time: "11:30 AM", paymentMethod: "BANK_TRANSFER", status: "PAID" },
      { id: "REV-104", type: "CONSULTATION", typeNameEn: "New Consultation", typeNameAr: "كشف جديد", patientName: "Fatima Omar", patientNameAr: "فاطمة عمر", amount: 500, date: "2026-09-22", time: "01:00 PM", paymentMethod: "CASH", status: "PAID" },
      { id: "REV-105", type: "REPORT", typeNameEn: "Official Medical Report & Review", typeNameAr: "تقرير طبي معتمد وفحص شامل", patientName: "Kareem Tarek", patientNameAr: "كريم طارق", amount: 400, date: "2026-09-22", time: "02:15 PM", paymentMethod: "CASH", status: "PAID" },
    ],
  },
  "2026-08": {
    monthKey: "2026-08",
    monthNameEn: "August 2026",
    monthNameAr: "أغسطس ٢٠٢٦",
    grossRevenue: 68700,
    totalExpenses: 33100,
    netProfit: 35600,
    profitMargin: 51.8,
    totalVisits: 148,
    avgPerPatient: 464,
    revenueGrowthMoM: 9.8,
    expensesGrowthMoM: 4.2,
    weeklyTrend: [
      { week: "Week 1", weekAr: "الأسبوع ١", revenue: 16500, expenses: 15200, netProfit: 1300 },
      { week: "Week 2", weekAr: "الأسبوع ٢", revenue: 17800, expenses: 5800, netProfit: 12000 },
      { week: "Week 3", weekAr: "الأسبوع ٣", revenue: 17200, expenses: 6200, netProfit: 11000 },
      { week: "Week 4", weekAr: "الأسبوع ٤", revenue: 17200, expenses: 5900, netProfit: 11300 },
    ],
    expenses: [
      {
        id: "EXP-08-01",
        category: "SALARIES",
        categoryNameEn: "Salaries & Staff",
        categoryNameAr: "المرتبات والأجور",
        titleEn: "Staff Payroll",
        titleAr: "رواتب الفريق الطبي والإداري",
        amount: 14500,
        date: "2026-08-01",
        paymentMethod: "BANK_TRANSFER",
        paidTo: "Clinic Staff",
        isRecurring: true,
      },
      {
        id: "EXP-08-02",
        category: "RENT",
        categoryNameEn: "Clinic Rent",
        categoryNameAr: "إيجار العيادة والمقر",
        titleEn: "Clinic Premises Monthly Lease",
        titleAr: "إيجار مقر العيادة الشهري",
        amount: 8000,
        date: "2026-08-01",
        paymentMethod: "BANK_TRANSFER",
        paidTo: "Al-Noor Tower Management",
        isRecurring: true,
      },
      {
        id: "EXP-08-03",
        category: "UTILITIES",
        categoryNameEn: "Electricity & Utilities",
        categoryNameAr: "الكهرباء والمرافق",
        titleEn: "Electricity Bill",
        titleAr: "فاتورة الكهرباء",
        amount: 2800,
        date: "2026-08-06",
        paymentMethod: "CASH",
        paidTo: "Electricity Co.",
        isRecurring: true,
      },
      {
        id: "EXP-08-04",
        category: "SUPPLIES",
        categoryNameEn: "Medical Supplies",
        categoryNameAr: "المستلزمات الطبية",
        titleEn: "Medical Consumables & Gauze",
        titleAr: "شاش ومستهلكات طبية",
        amount: 4100,
        date: "2026-08-11",
        paymentMethod: "CASH",
        paidTo: "MedPharma Supplies",
        isRecurring: false,
      },
      {
        id: "EXP-08-05",
        category: "MARKETING",
        categoryNameEn: "Marketing & Ads",
        categoryNameAr: "التسويق والإعلانات",
        titleEn: "Sponsored Ads & Printouts",
        titleAr: "إعلانات ممولة ومطبوعات كروت",
        amount: 1900,
        date: "2026-08-15",
        paymentMethod: "CARD",
        paidTo: "Marketing Agency",
        isRecurring: false,
      },
      {
        id: "EXP-08-06",
        category: "MISC",
        categoryNameEn: "Hospitality & Cleaning",
        categoryNameAr: "نثريات وضيافة ونظافة",
        titleEn: "Clinic Hospitality & Cleaners",
        titleAr: "ضيافة العيادة ومنظفات",
        amount: 1800,
        date: "2026-08-20",
        paymentMethod: "CASH",
        paidTo: "Petty Cash",
        isRecurring: false,
      },
    ],
    revenues: [],
  },
  "2026-07": {
    monthKey: "2026-07",
    monthNameEn: "July 2026",
    monthNameAr: "يوليو ٢٠٢٦",
    grossRevenue: 62500,
    totalExpenses: 31800,
    netProfit: 30700,
    profitMargin: 49.1,
    totalVisits: 135,
    avgPerPatient: 462,
    revenueGrowthMoM: 5.4,
    expensesGrowthMoM: 1.8,
    weeklyTrend: [
      { week: "Week 1", weekAr: "الأسبوع ١", revenue: 15200, expenses: 14500, netProfit: 700 },
      { week: "Week 2", weekAr: "الأسبوع ٢", revenue: 16100, expenses: 5600, netProfit: 10500 },
      { week: "Week 3", weekAr: "الأسبوع ٣", revenue: 15400, expenses: 5800, netProfit: 9600 },
      { week: "Week 4", weekAr: "الأسبوع ٤", revenue: 15800, expenses: 5900, netProfit: 9900 },
    ],
    expenses: [
      {
        id: "EXP-07-01",
        category: "SALARIES",
        categoryNameEn: "Salaries & Staff",
        categoryNameAr: "المرتبات والأجور",
        titleEn: "Staff Payroll",
        titleAr: "رواتب الفريق الطبي والإداري",
        amount: 14000,
        date: "2026-07-01",
        paymentMethod: "BANK_TRANSFER",
        paidTo: "Clinic Staff",
        isRecurring: true,
      },
      {
        id: "EXP-07-02",
        category: "RENT",
        categoryNameEn: "Clinic Rent",
        categoryNameAr: "إيجار العيادة والمقر",
        titleEn: "Clinic Premises Monthly Lease",
        titleAr: "إيجار مقر العيادة الشهري",
        amount: 8000,
        date: "2026-07-01",
        paymentMethod: "BANK_TRANSFER",
        paidTo: "Al-Noor Tower Management",
        isRecurring: true,
      },
      {
        id: "EXP-07-03",
        category: "UTILITIES",
        categoryNameEn: "Electricity & Utilities",
        categoryNameAr: "الكهرباء والمرافق",
        titleEn: "Electricity & Water Bill",
        titleAr: "فاتورة الكهرباء والمياه",
        amount: 2600,
        date: "2026-07-05",
        paymentMethod: "CASH",
        paidTo: "Utilities Provider",
        isRecurring: true,
      },
      {
        id: "EXP-07-04",
        category: "SUPPLIES",
        categoryNameEn: "Medical Supplies",
        categoryNameAr: "المستلزمات الطبية",
        titleEn: "Medical Supplies Batch",
        titleAr: "مستلزمات طبية وجراحية",
        amount: 4500,
        date: "2026-07-12",
        paymentMethod: "CASH",
        paidTo: "MedPharma Supplies",
        isRecurring: false,
      },
      {
        id: "EXP-07-05",
        category: "MISC",
        categoryNameEn: "Hospitality & Cleaning",
        categoryNameAr: "نثريات وضيافة ونظافة",
        titleEn: "Petty Cash & Maintenance",
        titleAr: "نثريات وضيافة وصيانة خفيفة",
        amount: 2700,
        date: "2026-07-19",
        paymentMethod: "CASH",
        paidTo: "Petty Cash",
        isRecurring: false,
      },
    ],
    revenues: [],
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || "2026-09";

    const data = mockFinancialData[month] || mockFinancialData["2026-09"];

    return NextResponse.json({
      success: true,
      currentMonth: data,
      allMonths: Object.keys(mockFinancialData).map((k) => ({
        key: k,
        nameEn: mockFinancialData[k].monthNameEn,
        nameAr: mockFinancialData[k].monthNameAr,
      })),
    });
  } catch (error) {
    console.error("Doctor finance API error:", error);
    return NextResponse.json({ success: false, error: "Failed to load financial records" }, { status: 500 });
  }
}
