"use client";

import { Printer, Sparkles, TrendingUp, TrendingDown, Scale, Info, AlertTriangle } from "lucide-react";
import type { ProfitAndLossPayload, ProfitAndLossSectionItem } from "@/types/index";

interface ProfitLossStatementProps {
  monthName: string;
  data: ProfitAndLossPayload | null;
  loading: boolean;
  unavailable: boolean;
  isRTL: boolean;
}

const fmt = (value: number): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: 0 });

function SectionHeader({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
      <span>{title}</span>
      <span>{isRTL ? "المبلغ (ج.م)" : "Amount (EGP)"}</span>
    </div>
  );
}

function SectionRow({
  item,
  isRTL,
  negative,
}: {
  item: ProfitAndLossSectionItem;
  isRTL: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
      <span className="text-slate-700 dark:text-slate-300">
        • {isRTL ? item.labelAr : item.labelEn}
      </span>
      <span
        className={`font-mono font-bold ${
          negative ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
        }`}
      >
        {negative ? `(${fmt(item.amount)})` : fmt(item.amount)}
      </span>
    </div>
  );
}

function EmptySection({ isRTL, what }: { isRTL: boolean; what: string }) {
  return (
    <div className="py-2 px-2 rounded-lg bg-slate-50/60 dark:bg-slate-800/30 text-[11px] text-slate-400 italic">
      {isRTL ? `لا توجد ${what} مسجلة بهذا الشهر` : `No ${what} recorded for this month`}
    </div>
  );
}

export function ProfitLossStatement({ monthName, data, loading, unavailable, isRTL }: ProfitLossStatementProps) {
  const handlePrint = () => {
    window.print();
  };

  const a = data?.analysis;

  return (
    <div className="space-y-6">
      {/* Top action toolbar */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {isRTL ? `قائمة الأرباح والخسائر — ${monthName}` : `Income & P&L Statement — ${monthName}`}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isRTL
              ? "كل رقم هنا مجموع صفوف حقيقية (مواعيد، مصروفات، فواتير، استرجاعات) — لا نسب مُختلقة"
              : "Every figure is a sum over real rows (appointments, expenses, invoices, refunds) — no invented splits"}
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
              {isRTL ? "تقرير الأداء المالي وقائمة الدخل للعيادة" : "Clinical Financial Statement & P&L Report"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRTL ? "قائمة الدخل والأداء المالي الشهري" : "Monthly Profit & Loss (P&L) Financial Statement"}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-sm">{monthName}</div>
            <div>{isRTL ? "العملة: الجنيه المصري (EGP)" : "Currency: Egyptian Pound (EGP)"}</div>
            <div>
              {isRTL ? "تاريخ الإصدار: " : "Generated on: "}
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
            </div>
          </div>
        </div>

        {/* Loading / unavailable / empty */}
        {loading && (
          <div className="py-10 text-center text-xs font-bold text-slate-400 animate-pulse">
            {isRTL ? "جارٍ تجميع القائمة من بيانات العيادة الحقيقية..." : "Assembling the statement from real clinic rows..."}
          </div>
        )}

        {!loading && unavailable && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            {isRTL
              ? "جداول المرحلة 2 (الفواتير، الاسترجاع، قوالب التكاليف الثابتة) غير مطبَّقة بعد على قاعدة البيانات — أضِف ترحيل 0005 لعرض القائمة الكاملة."
              : "Phase 2 tables (invoices, refunds, fixed-cost templates) are not applied to the database yet — add migration 0005 to see the full statement."}
          </div>
        )}

        {!loading && !data && !unavailable && (
          <div className="py-10 text-center text-xs font-bold text-slate-400">
            {isRTL ? "لا توجد بيانات مالية لهذا الشهر" : "No financial data for this month"}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Alerts */}
            {data.alerts.length > 0 && (
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.code}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                      alert.level === "warning"
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {alert.level === "warning" ? <AlertTriangle size={15} className="shrink-0" /> : <Info size={15} className="shrink-0" />}
                    <span>{isRTL ? alert.messageAr : alert.messageEn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Section 1: REVENUE */}
            <div className="space-y-2">
              <SectionHeader title={isRTL ? "١. الإيرادات الإجمالية (Gross Revenue)" : "1. Gross Clinical Revenue"} isRTL={isRTL} />
              <div className="space-y-1.5 text-xs">
                {data.revenue.groups.length === 0 ? (
                  <EmptySection isRTL={isRTL} what={isRTL ? "إيرادات" : "revenue"} />
                ) : (
                  data.revenue.groups.map((group) => (
                    <SectionRow key={group.key} item={group} isRTL={isRTL} />
                  ))
                )}
                {data.revenue.discounts > 0 && (
                  <SectionRow
                    item={{
                      key: "discounts",
                      labelEn: "Invoice discounts",
                      labelAr: "خصومات الفواتير",
                      amount: data.revenue.discounts,
                    }}
                    isRTL={isRTL}
                    negative
                  />
                )}
                {data.revenue.refunds > 0 && (
                  <SectionRow
                    item={{
                      key: "refunds",
                      labelEn: "Patient refunds",
                      labelAr: "استرجاعات المرضى",
                      amount: data.revenue.refunds,
                    }}
                    isRTL={isRTL}
                    negative
                  />
                )}
              </div>
              <div className="flex items-center justify-between pt-2 px-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-800">
                <span>{isRTL ? "صافي الإيرادات السريرية" : "Total Gross Revenue"}</span>
                <span className="font-mono font-black">{fmt(data.revenue.gross)} EGP</span>
              </div>
            </div>

            {/* Section 2: COGS */}
            <div className="space-y-2">
              <SectionHeader
                title={isRTL ? "٢. تكلفة الخدمات السريرية المباشرة (COGS)" : "2. Direct Clinical Cost (COGS)"}
                isRTL={isRTL}
              />
              <div className="space-y-1.5 text-xs">
                {data.cogs.items.length === 0 ? (
                  <EmptySection isRTL={isRTL} what={isRTL ? "تكاليف سريرية مباشرة" : "direct clinical costs"} />
                ) : (
                  data.cogs.items.map((item) => <SectionRow key={item.key} item={item} isRTL={isRTL} negative />)
                )}
              </div>
              <div className="flex items-center justify-between pt-2 px-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
                <span>
                  {isRTL ? "مجمل الربح (Gross Profit)" : "Gross Profit"}{" "}
                  {data.grossMarginPct !== null && `(${data.grossMarginPct}%)`}
                </span>
                <span className="font-mono font-bold">{fmt(data.grossProfit)} EGP</span>
              </div>
            </div>

            {/* Section 3: FIXED OVERHEAD */}
            <div className="space-y-2">
              <SectionHeader title={isRTL ? "٣. المصروفات الثابتة (Fixed Overhead)" : "3. Fixed Overhead"} isRTL={isRTL} />
              <div className="space-y-1.5 text-xs">
                {data.fixedOverhead.items.length === 0 ? (
                  <EmptySection isRTL={isRTL} what={isRTL ? "مصروفات ثابتة" : "fixed costs"} />
                ) : (
                  data.fixedOverhead.items.map((item) => (
                    <SectionRow key={item.key} item={item} isRTL={isRTL} negative />
                  ))
                )}
              </div>
              <div className="flex items-center justify-between pt-2 px-2 text-xs font-bold text-rose-700 dark:text-rose-400 border-t border-slate-200 dark:border-slate-800">
                <span>{isRTL ? "إجمالي المصروفات الثابتة" : "Total Fixed Overhead"}</span>
                <span className="font-mono font-black">({fmt(data.fixedOverhead.total)}) EGP</span>
              </div>
            </div>

            {/* Section 4: VARIABLE OPEX */}
            <div className="space-y-2">
              <SectionHeader title={isRTL ? "٤. المصروفات التشغيلية المتغيرة (Variable Opex)" : "4. Variable Operating Expenses"} isRTL={isRTL} />
              <div className="space-y-1.5 text-xs">
                {data.variableOpex.items.length === 0 ? (
                  <EmptySection isRTL={isRTL} what={isRTL ? "مصروفات متغيرة" : "variable costs"} />
                ) : (
                  data.variableOpex.items.map((item) => (
                    <SectionRow key={item.key} item={item} isRTL={isRTL} negative />
                  ))
                )}
                {data.capex.items.length > 0 && (
                  <>
                    <div className="pt-2 text-[11px] font-extrabold text-slate-400 uppercase">
                      {isRTL ? "أصول وتجهيزات (CAPEX — معروضة منفصلة)" : "Equipment & Assets (CAPEX — shown separately)"}
                    </div>
                    {data.capex.items.map((item) => (
                      <SectionRow key={item.key} item={item} isRTL={isRTL} negative />
                    ))}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 px-2 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 border-t border-slate-200 dark:border-slate-800">
                <span>{isRTL ? "إجمالي المصروفات التشغيلية" : "Total Operating Expenses"}</span>
                <span className="font-mono font-black">({fmt(data.totalOperatingExpenses)}) EGP</span>
              </div>
            </div>

            {/* Section 5: NET PROFIT */}
            <div
              className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                data.netProfit >= 0
                  ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30"
                  : "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30"
              }`}
            >
              <div>
                <div
                  className={`flex items-center gap-1.5 text-xs font-bold ${
                    data.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {data.netProfit >= 0 ? <Sparkles size={16} /> : <TrendingDown size={16} />}
                  <span>{isRTL ? "صافي أرباح العيادة (Net Profit)" : "Net Clinical Profit"}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRTL
                    ? "بعد خصم التكاليف المباشرة والمصروفات الثابتة والمتغيرة"
                    : "After direct clinical costs, fixed overhead and variable expenses"}
                </p>
                {data.comparison.revenueGrowthPct !== null && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1.5">
                    {data.comparison.revenueGrowthPct >= 0 ? (
                      <TrendingUp size={13} className="text-emerald-600" />
                    ) : (
                      <TrendingDown size={13} className="text-rose-600" />
                    )}
                    <span className={data.comparison.revenueGrowthPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                      {isRTL ? "الإيرادات" : "Revenue"} {data.comparison.revenueGrowthPct}%
                    </span>
                    <span className="text-slate-400 font-normal">
                      {isRTL ? `مقارنة بـ ${data.comparison.previousMonth}` : `vs ${data.comparison.previousMonth}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono ${
                    data.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {fmt(data.netProfit)} <span className="text-sm font-normal text-slate-500">EGP</span>
                </div>
                {data.netMarginPct !== null && (
                  <div
                    className={`text-xs font-extrabold ${
                      data.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {isRTL ? `هامش الربح الصافي: ${data.netMarginPct}%` : `Net Margin: ${data.netMarginPct}%`}
                  </div>
                )}
              </div>
            </div>

            {/* Section 6: BREAK-EVEN ANALYSIS */}
            {a && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>{isRTL ? "٦. تحليل نقطة التعادل (Break-Even)" : "6. Break-Even Analysis"}</span>
                  <Scale size={14} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    { labelEn: "Visits", labelAr: "عدد الكشوفات", value: fmt(a.visits), raw: true },
                    { labelEn: "Avg revenue / visit", labelAr: "متوسط الإيراد/كشف", value: a.avgRevenuePerVisit },
                    { labelEn: "Direct cost / visit", labelAr: "التكلفة المباشرة/كشف", value: a.directCostPerVisit },
                    { labelEn: "Contribution / visit", labelAr: "هامش المساهمة/كشف", value: a.contributionPerVisit },
                    { labelEn: "Contribution margin", labelAr: "نسبة هامش المساهمة", value: a.contributionMarginPct !== null ? `${a.contributionMarginPct}%` : null },
                    { labelEn: "Fixed monthly cost", labelAr: "التكاليف الثابتة الشهرية", value: a.fixedMonthly },
                    { labelEn: "Break-even visits / month", labelAr: "كشوفات التعادل الشهرية", value: a.breakEvenVisits !== null ? fmt(a.breakEvenVisits) : null },
                    { labelEn: "Break-even visits / day", labelAr: "كشوفات التعادل اليومية", value: a.breakEvenVisitsPerDay !== null ? a.breakEvenVisitsPerDay.toFixed(1) : null },
                  ].map((cell) => (
                    <div
                      key={cell.labelEn}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
                        {isRTL ? cell.labelAr : cell.labelEn}
                      </p>
                      <p className="mt-1 font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                        {cell.raw ? cell.value : typeof cell.value === "number" ? `${fmt(cell.value)}${cell.labelEn.includes("margin") ? "" : " EGP"}` : cell.value ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {!a.computable && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    {isRTL ? "لا يمكن حساب نقطة التعادل بعد: " : "Break-even not computable yet: "}
                    {isRTL ? "أضِف قوالب التكاليف الثابتة (إيجار، مرتبات، اشتراكات) لتفعيل التحليل." : "add fixed-cost templates (rent, salaries, subscriptions) to enable it."}
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  {isRTL ? "الأساس: " : "Basis: "}
                  {a.basis}
                  {isRTL ? ` — أيام العمل المفترضة: ${a.workingDays}` : ` — assumed working days: ${a.workingDays}`}
                </p>
              </div>
            )}

            {/* Section 7: FIXED COST SCHEDULE */}
            {data.fixedCostTable.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
                  {isRTL ? "٧. جدول التكاليف الثابتة الشهرية" : "7. Monthly Fixed Cost Schedule"}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-start py-1.5 px-2 font-bold">{isRTL ? "البند" : "Item"}</th>
                        <th className="text-start py-1.5 px-2 font-bold">{isRTL ? "التصنيف" : "Category"}</th>
                        <th className="text-start py-1.5 px-2 font-bold">{isRTL ? "الدورية" : "Frequency"}</th>
                        <th className="text-end py-1.5 px-2 font-bold">{isRTL ? "القيمة" : "Amount"}</th>
                        <th className="text-end py-1.5 px-2 font-bold">{isRTL ? "المُعادل الشهري" : "Monthly equivalent"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.fixedCostTable.map((row) => (
                        <tr key={row.templateId}>
                          <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                            {isRTL ? row.titleAr : row.titleEn}
                          </td>
                          <td className="py-1.5 px-2 text-slate-500">{row.categoryCode || "—"}</td>
                          <td className="py-1.5 px-2 text-slate-500">{row.frequency}</td>
                          <td className="py-1.5 px-2 text-end font-mono text-slate-700 dark:text-slate-300">{fmt(row.amount)}</td>
                          <td className="py-1.5 px-2 text-end font-mono font-bold text-slate-900 dark:text-white">{fmt(row.monthly)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer: data provenance */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 space-y-0.5">
              <p className="font-bold uppercase tracking-wider">
                {isRTL ? "مصادر البيانات (صفوف حقيقية)" : "Data sources (real rows)"}
              </p>
              <p className="font-mono">
                {isRTL ? "المواعيد: " : "appointments: "}
                {data.dataSources.appointments} · {isRTL ? "المصروفات: " : "expenses: "}
                {data.dataSources.expenseRows} · {isRTL ? "الفواتير: " : "invoices: "}
                {data.dataSources.invoiceRows} · {isRTL ? "الاسترجاعات: " : "refunds: "}
                {data.dataSources.refundRows} · {isRTL ? "قوالب ثابتة: " : "fixed templates: "}
                {data.dataSources.fixedCostTemplates}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
