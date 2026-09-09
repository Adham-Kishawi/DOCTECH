"use client";

import { Printer, Download, Sparkles, TrendingUp, DollarSign, Calendar } from "lucide-react";
import type { ExpenseItem, RevenueItem } from "@/app/api/doctor/finance/route";

interface ProfitLossStatementProps {
  monthName: string;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  expenses: ExpenseItem[];
  revenues: RevenueItem[];
  isRTL: boolean;
}

export function ProfitLossStatement({
  monthName,
  grossRevenue,
  totalExpenses,
  netProfit,
  profitMargin,
  expenses,
  revenues,
  isRTL,
}: ProfitLossStatementProps) {
  // Aggregate expenses by category
  const salariesTotal = expenses.filter((e) => e.category === "SALARIES").reduce((s, e) => s + e.amount, 0);
  const rentTotal = expenses.filter((e) => e.category === "RENT").reduce((s, e) => s + e.amount, 0);
  const utilitiesTotal = expenses.filter((e) => e.category === "UTILITIES").reduce((s, e) => s + e.amount, 0);
  const suppliesTotal = expenses.filter((e) => e.category === "SUPPLIES").reduce((s, e) => s + e.amount, 0);
  const maintenanceTotal = expenses.filter((e) => e.category === "MAINTENANCE").reduce((s, e) => s + e.amount, 0);
  const marketingTotal = expenses.filter((e) => e.category === "MARKETING").reduce((s, e) => s + e.amount, 0);
  const taxesTotal = expenses.filter((e) => e.category === "TAXES").reduce((s, e) => s + e.amount, 0);
  const miscTotal = expenses.filter((e) => e.category === "MISC").reduce((s, e) => s + e.amount, 0);

  const directCosts = suppliesTotal;
  const grossProfit = grossRevenue - directCosts;
  const grossMargin = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : "0.0";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action toolbar */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {isRTL ? `قائمة الأرباح والخسائر والدخل — ${monthName}` : `Income & P&L Statement — ${monthName}`}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isRTL ? "تقرير مالي رسمي مفصل للإيرادات والمصروفات وصافي الربح" : "Detailed breakdown of clinical revenues, operating costs, and net margin"}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white shadow-xs transition-all cursor-pointer"
        >
          <Printer size={14} />
          <span>{isRTL ? "طباعة التقرير المالي" : "Print Statement"}</span>
        </button>
      </div>

      {/* Statement Card / Printable Canvas */}
      <div
        id="printable-pl-statement"
        className="bg-white dark:bg-[#131E2E] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6"
      >
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1A4B8C]"></span>
              <span className="text-xs font-extrabold tracking-wider text-[#1A4B8C] dark:text-blue-400 uppercase">
                DOCTECH CLINICAL FINANCIAL REPORT
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isRTL ? "عيادات النور التخصصية — د. أحمد حسام" : "Al-Noor Medical Practice — Dr. Ahmed Hossam"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRTL ? "قائمة الدخل والأداء المالي الشهري" : "Monthly Profit & Loss (P&L) Financial Statement"}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-sm">{monthName}</div>
            <div>{isRTL ? "العملة: الجنيه المصري (EGP)" : "Currency: Egyptian Pound (EGP)"}</div>
            <div>{isRTL ? "تاريخ الإصدار: " : "Generated on: "} {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US")}</div>
          </div>
        </div>

        {/* Section 1: REVENUES */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
            <span>{isRTL ? "١. الإيرادات الإجمالية (Gross Revenue)" : "1. Gross Clinical Revenue"}</span>
            <span>{isRTL ? "المبلغ (ج.م)" : "Amount (EGP)"}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300">
                {isRTL ? "• إيرادات الكشوفات الجديدة والاستشارات الطبية" : "• Outpatient Consultations & Checkups"}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {(grossRevenue * 0.65).toLocaleString()} EGP
              </span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300">
                {isRTL ? "• إيرادات المتابعة والإعادة" : "• Follow-up Visits & Care"}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {(grossRevenue * 0.22).toLocaleString()} EGP
              </span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300">
                {isRTL ? "• العمليات والإجراءات الصغرى والتقارير" : "• Minor Procedures, Dressing & Medical Reports"}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {(grossRevenue * 0.13).toLocaleString()} EGP
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 px-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-800">
            <span>{isRTL ? "إجمالي الإيرادات السريرية" : "Total Gross Revenue"}</span>
            <span className="font-mono font-black">{grossRevenue.toLocaleString()} EGP</span>
          </div>
        </div>

        {/* Section 2: DIRECT OPERATING EXPENSES (COGS/Supplies) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
            <span>{isRTL ? "٢. تكلفة المستلزمات الطبية المباشرة (Direct Supplies Cost)" : "2. Direct Medical Supplies & Consumables"}</span>
            <span>{isRTL ? "المبلغ (ج.م)" : "Amount (EGP)"}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300">
                {isRTL ? "• المستلزمات الطبية، القفازات، والسرنجات والمطهرات" : "• Gloves, Syringes, Antiseptics & Surgical Dressing"}
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                ({suppliesTotal.toLocaleString()}) EGP
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
            <span>{isRTL ? "مجمل الربح المباشر (Gross Profit)" : "Gross Operating Profit"} ({grossMargin}%)</span>
            <span className="font-mono font-bold">{grossProfit.toLocaleString()} EGP</span>
          </div>
        </div>

        {/* Section 3: OVERHEAD & ADMINISTRATIVE EXPENSES */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
            <span>{isRTL ? "٣. المصروفات التشغيلية والإدارية (Overhead Expenses)" : "3. Operating & Administrative Overhead"}</span>
            <span>{isRTL ? "المبلغ (ج.م)" : "Amount (EGP)"}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isRTL ? "👥 المرتبات وأجور الفريق (سكرة، تمريض، مساعد)" : "👥 Staff Payroll (Secretary, Nurse & Assistants)"}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                ({salariesTotal.toLocaleString()}) EGP
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isRTL ? "🏢 إيجار مقر العيادة وصيانة البرج" : "🏢 Clinic Lease & Premises Rent"}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                ({rentTotal.toLocaleString()}) EGP
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isRTL ? "⚡ فواتير الكهرباء، المياه، والإنترنت والاتصالات" : "⚡ Electricity, Water, Internet & Telecom"}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                ({utilitiesTotal.toLocaleString()}) EGP
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isRTL ? "🛠️ صيانة الأجهزة الطبية واشتراكات الأنظمة" : "🛠️ Equipment Calibration & Software Subscriptions"}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                ({maintenanceTotal.toLocaleString()}) EGP
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isRTL ? "📢 التسويق والإعلانات الممولة ومطبوعات العيادة" : "📢 Marketing, Ads & Clinic Printouts"}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                ({marketingTotal.toLocaleString()}) EGP
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isRTL ? "☕ نثريات، ضيافة المرضى، ومواد النظافة والتعقيم" : "☕ Hospitality, Patient Amenities & Cleaning"}
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                ({(miscTotal + taxesTotal).toLocaleString()}) EGP
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 px-2 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 border-t border-slate-200 dark:border-slate-800">
            <span>{isRTL ? "إجمالي كافة المصروفات التشغيلية" : "Total Operating Expenses"}</span>
            <span className="font-mono font-black">({totalExpenses.toLocaleString()}) EGP</span>
          </div>
        </div>

        {/* Section 4: NET PROFIT FINAL RESULT */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Sparkles size={16} />
              <span>{isRTL ? "صافي أرباح العيادة (Net Profit)" : "Net Clinical Profit"}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL ? "صافي الدخل بعد استقطاع كافة الرواتب والإيجارات والفواتير" : "Final physician earnings after deducting all overhead and payroll"}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {netProfit.toLocaleString()} <span className="text-sm font-normal text-slate-500">EGP</span>
            </div>
            <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              {isRTL ? `هامش الربح الصافي: ${profitMargin}%` : `Net Margin: ${profitMargin}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
