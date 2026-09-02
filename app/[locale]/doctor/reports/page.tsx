"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Search, AlertCircle, ChevronRight } from "lucide-react";

interface ReportItem {
  id: string;
  patientName: string;
  patientNameAr: string;
  patientAge: number;
  phone: string;
  summary: string;
  summaryAr: string;
  urgency: "High" | "Medium" | "Normal";
  status: "pending" | "reviewed" | "replied";
  submittedAt: string;
  submittedAtAr: string;
  triageNote: string;
  triageNoteAr: string;
}

const reportsData: ReportItem[] = [
  { id: "REP-401", patientName: "Kareem Tarek", patientNameAr: "كريم طارق", patientAge: 46, phone: "+20 100 123 4567", summary: "High fever (39.2C) with chills for 3 consecutive days post antibiotic course.", summaryAr: "حرارة مرتفعة (٣٩.٢) مع قشعريرة ٣ أيام متتالية بعد المضاد الحيوي.", urgency: "High", status: "pending", submittedAt: "15 mins ago", submittedAtAr: "منذ ١٥ دقيقة", triageNote: "Patient states antibiotic isn't reducing fever. Requested urgent doctor review.", triageNoteAr: "المريض يقول إن المضاد الحيوي لا يقلل الحرارة. طلب مراجعة عاجلة." },
  { id: "REP-402", patientName: "Nouran Mahmoud", patientNameAr: "نوران محمود", patientAge: 32, phone: "+20 102 345 6789", summary: "Fasting blood sugar (165 mg/dL) & HbA1c test results attached for quarterly review.", summaryAr: "سكر صائم (١٦٥) ونتائج HbA1c مرفقة للمراجعة الربعية.", urgency: "Normal", status: "pending", submittedAt: "1 hour ago", submittedAtAr: "منذ ساعة", triageNote: "Lab report image received via WhatsApp.", triageNoteAr: "صورة التقرير المعملي استُلمت عبر واتساب." },
  { id: "REP-403", patientName: "Hany Youssef", patientNameAr: "هاني يوسف", patientAge: 58, phone: "+20 103 456 7890", summary: "Mild erythematous rash observed on forearm after 2nd dose of Amoxicillin.", summaryAr: "طفح جلدي خفيف على الساعد بعد الجرعة الثانية من الأموكسيسيلين.", urgency: "Medium", status: "pending", submittedAt: "3 hours ago", submittedAtAr: "منذ ٣ ساعات", triageNote: "Suspected allergic reaction. Discontinued medication pending doctor advice.", triageNoteAr: "يُشتبه في رد فعل تحسسي. تم إيقاف الدواء بانتظار توجيه الطبيب." },
  { id: "REP-404", patientName: "Mariam Khaled", patientNameAr: "مريم خالد", patientAge: 27, phone: "+20 104 567 8901", summary: "Post-consultation follow-up inquiry regarding vitamin dosage.", summaryAr: "استفسار متابعة بعد الكشف بخصوص جرعة الفيتامينات.", urgency: "Normal", status: "reviewed", submittedAt: "Yesterday", submittedAtAr: "أمس", triageNote: "Doctor provided reply. WhatsApp notification sent.", triageNoteAr: "الطبيب قدم الرد. تم إرسال إشعار واتساب." },
];

export default function DoctorReportsListPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = reportsData.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch = r.patientName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 mb-1.5">
            <AlertCircle size={13} />
            {isRTL ? "صندوق الفرز والمراجعة السريرية" : "Clinical Triage & Inquiry Inbox"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "تقارير واستفسارات المرضى" : "Patient Reports & Inquiries"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "مراجعة تقارير واستفسارات المرضى المفرزة من قبل السكرتيرة وتقديم التوجيه الطبي"
              : "Review triage notes from secretary, inspect symptoms, and submit medical decisions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-3 py-1.5 rounded-xl">
            {isRTL ? "3 بانتظار المراجعة" : "3 Awaiting Review"}
          </span>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث بالاسم أو رقم التقرير..." : "Search patient or Report ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: "all", en: "All", ar: "الكل" },
            { id: "pending", en: "Pending", ar: "معلق" },
            { id: "reviewed", en: "Reviewed", ar: "تمت المراجعة" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === t.id
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? t.ar : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Queue */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.map((rep) => (
          <Link
            key={rep.id}
            href={`/${locale}/doctor/reports/${rep.id}`}
            className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
          >
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                  rep.urgency === "High"
                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                    : rep.urgency === "Medium"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                    : "bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                }`}
              >
                <FileText size={18} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1A4B8C] dark:group-hover:text-blue-400 transition-colors">
                    {isRTL ? rep.patientNameAr : rep.patientName}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 font-bold hidden sm:inline">({rep.id})</span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full uppercase ${
                      rep.urgency === "High"
                        ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                        : rep.urgency === "Medium"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {rep.urgency}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed line-clamp-2">
                  {isRTL ? rep.summaryAr : rep.summary}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                  {isRTL ? `ملاحظة السكرتيرة: "${rep.triageNoteAr}" • ${rep.submittedAtAr}` : `Secretary Note: "${rep.triageNote}" • ${rep.submittedAt}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <span className="text-xs font-bold text-[#1A4B8C] dark:text-blue-400 group-hover:underline flex items-center gap-1">
                {isRTL ? "مراجعة وتقديم قرار" : "Review & Decide"}
                <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
