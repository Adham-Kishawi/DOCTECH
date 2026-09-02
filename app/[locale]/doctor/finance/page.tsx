"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DollarSign, TrendingUp, Calendar, Users, BarChart3, ArrowUpRight, Sparkles, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const weeklyData = [
  { day: "Sat", dayAr: "السبت", revenue: 1800, count: 5 },
  { day: "Sun", dayAr: "الأحد", revenue: 2400, count: 7 },
  { day: "Mon", dayAr: "الاثنين", revenue: 2100, count: 6 },
  { day: "Tue", dayAr: "الثلاثاء", revenue: 2850, count: 8 },
  { day: "Wed", dayAr: "الأربعاء", revenue: 2600, count: 7 },
  { day: "Thu", dayAr: "الخميس", revenue: 1950, count: 5 },
];

const consultationTypeBreakdown = [
  { type: "New Consultations (كشف جديد)", count: 18, revenue: 7200, percentage: "52%" },
  { type: "Follow-ups (إعادة ومتابعة)", count: 24, revenue: 4800, percentage: "35%" },
  { type: "Post-Op Wound Care (جراحة ومتابعة)", count: 6, revenue: 1800, percentage: "13%" },
];

export default function DoctorFinancePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  const totalMonthlyRevenue = 13700;
  const totalConsultations = 48;
  const avgPerPatient = Math.round(totalMonthlyRevenue / totalConsultations);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <DollarSign size={13} />
            {isRTL ? "إيرادات الكشوفات الخاصة بالطبيب" : "Personal Physician Revenue & Analytics"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "المحفظة والإيرادات السريرية" : "Clinical Earnings & Revenue"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "متابعة إيرادات كشوفاتك واستشاراتك الطبية بشكل منفصل ومحمي تمامًا"
              : "Doctor-isolated revenue overview, weekly earnings trend & consultation statistics"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3.5 py-2 rounded-xl">
            {isRTL ? "خاص بـ د. أحمد حسام فقط" : "Isolated to Dr. Ahmed Hossam"}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "إيرادات هذا الشهر" : "Monthly Earnings"}</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {totalMonthlyRevenue} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
          </p>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp size={11} /> +18% {isRTL ? "مقارنة بالشهر الماضي" : "vs last month"}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "إجمالي الكشوفات" : "Total Consultations"}</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {totalConsultations} <span className="text-xs font-normal text-slate-500">{isRTL ? "كشف" : "Visits"}</span>
          </p>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">
            {isRTL ? "معدل ٧ كشوفات/يوم" : "Avg 7 visits/day"}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "متوسط قيمة الكشف" : "Avg Fee per Patient"}</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {avgPerPatient} <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
          </p>
          <span className="text-[10px] text-blue-600 font-bold mt-1 block">
            {isRTL ? "كشف جديد وإعادة" : "New & Follow-up mix"}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{isRTL ? "إيراد اليوم" : "Today Earnings"}</span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            2,850 <span className="text-xs font-normal text-slate-500">{isRTL ? "ج.م" : "EGP"}</span>
          </p>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 size={11} /> 8 {isRTL ? "كشوفات مكتملة" : "completed visits"}
          </span>
        </div>
      </div>

      {/* Chart & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isRTL ? "منحنى الإيرادات الأسبوعي" : "Weekly Revenue Trend"}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {isRTL ? "مقارنة الدخل اليومي وعدد المرضى" : "Daily revenue breakdown across clinic shifts"}
              </p>
            </div>
            <span className="text-xs font-bold text-[#1A4B8C] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
              {isRTL ? "أسبوع جاري" : "Current Week"}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey={isRTL ? "dayAr" : "day"} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#131E2E",
                    border: "1px solid #1E2D42",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: unknown) => [`${value} EGP`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#1A4B8C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown by Consultation Type */}
        <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {isRTL ? "توزيع الإيرادات حسب نوع الكشف" : "Revenue by Visit Type"}
          </h2>

          <div className="space-y-3.5">
            {consultationTypeBreakdown.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.type}</span>
                  <span className="font-mono font-bold text-[#1A4B8C] dark:text-blue-400">{item.percentage}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.count} {isRTL ? "حالة" : "patients"}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.revenue} EGP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
