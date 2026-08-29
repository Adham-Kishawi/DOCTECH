"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Search, AlertCircle, Clock, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";

interface ReportItem {
  id: string;
  patientName: string;
  patientAge: number;
  phone: string;
  summary: string;
  urgency: "High" | "Medium" | "Normal";
  status: "pending" | "reviewed" | "replied";
  submittedAt: string;
  triageNote: string;
}

const reportsData: ReportItem[] = [
  { id: "REP-401", patientName: "Kareem Tarek", patientAge: 46, phone: "+20 100 123 4567", summary: "High fever (39.2C) with chills for 3 consecutive days post antibiotic course.", urgency: "High", status: "pending", submittedAt: "15 mins ago", triageNote: "Patient states antibiotic isn't reducing fever. Requested urgent doctor review." },
  { id: "REP-402", patientName: "Nouran Mahmoud", patientAge: 32, phone: "+20 102 345 6789", summary: "Fasting blood sugar (165 mg/dL) & HbA1c test results attached for quarterly review.", urgency: "Normal", status: "pending", submittedAt: "1 hour ago", triageNote: "Lab report image received via WhatsApp." },
  { id: "REP-403", patientName: "Hany Youssef", patientAge: 58, phone: "+20 103 456 7890", summary: "Mild erythematous rash observed on forearm after 2nd dose of Amoxicillin.", urgency: "Medium", status: "pending", submittedAt: "3 hours ago", triageNote: "Suspected allergic reaction. Discontinued medication pending doctor advice." },
  { id: "REP-404", patientName: "Mariam Khaled", patientAge: 27, phone: "+20 104 567 8901", summary: "Post-consultation follow-up inquiry regarding vitamin dosage.", urgency: "Normal", status: "reviewed", submittedAt: "Yesterday", triageNote: "Doctor provided reply. WhatsApp notification sent." },
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
            <AlertCircle size={13} />
            {isRTL ? "صندوق الفرز والمراجعة السريرية" : "Clinical Triage & Inquiry Inbox"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "تقارير واستفسارات المرضى" : "Patient Reports & Inquiries"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "مراجعة تقارير واستفسارات المرضى المفرزة من قبل السكرتيرة وتقديم التوجيه الطبي"
              : "Review triage notes from secretary, inspect symptoms, and submit medical decisions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            {isRTL ? "3 بانتظار المراجعة" : "3 Awaiting Review"}
          </span>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
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

        <div className="flex items-center gap-1.5">
          {["all", "pending", "reviewed"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                filter === t
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((rep) => (
          <Link
            key={rep.id}
            href={`/${locale}/doctor/reports/${rep.id}`}
            className="p-5 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                  rep.urgency === "High"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : rep.urgency === "Medium"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-[#1A4B8C] border border-blue-200"
                }`}
              >
                <FileText size={20} />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1A4B8C] transition-colors">
                    {rep.patientName}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 font-bold">({rep.id})</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      rep.urgency === "High"
                        ? "bg-red-100 text-red-700"
                        : rep.urgency === "Medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {rep.urgency} Urgency
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                  {rep.summary}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Secretary Note: &quot;{rep.triageNote}&quot; • {rep.submittedAt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <span className="text-xs font-bold text-[#1A4B8C] group-hover:underline flex items-center gap-1">
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