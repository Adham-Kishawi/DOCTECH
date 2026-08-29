"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, Search, AlertCircle, Clock, ChevronRight, Stethoscope, MessageCircle } from "lucide-react";

interface Report {
  id: string;
  patientName: string;
  phone: string;
  summary: string;
  urgency: "High" | "Medium" | "Normal";
  triageStatus: "pending_triage" | "sent_to_doctor" | "doctor_replied" | "dispatched";
  time: string;
}

const reportsList: Report[] = [
  { id: "REP-401", patientName: "Kareem Tarek", phone: "+20 100 123 4567", summary: "High fever 39.2C with chills post antibiotic course.", urgency: "High", triageStatus: "sent_to_doctor", time: "15 mins ago" },
  { id: "REP-402", patientName: "Nouran Mahmoud", phone: "+20 102 345 6789", summary: "Glucose lab test result image received via WhatsApp.", urgency: "Normal", triageStatus: "pending_triage", time: "1 hour ago" },
  { id: "REP-403", patientName: "Hany Youssef", phone: "+20 103 456 7890", summary: "Mild rash on forearm after 2nd dose.", urgency: "Medium", triageStatus: "sent_to_doctor", time: "3 hours ago" },
  { id: "REP-404", patientName: "Mariam Khaled", phone: "+20 104 567 8901", summary: "Vitamin dosage clarification inquiry.", urgency: "Normal", triageStatus: "doctor_replied", time: "Yesterday" },
];

export default function SecretaryReportsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = reportsList.filter((r) => {
    const matchesFilter = filter === "all" || r.triageStatus === filter;
    const matchesSearch = r.patientName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
            <AlertCircle size={13} />
            {isRTL ? "فرز وتصنيف استفسارات وتقارير المرضى" : "Reports Triage & Intake Dispatch"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "صندوق فرز التقارير" : "Reports Triage Desk"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "فرز رسائل المرضى، تصنيف درجة الاستعجال، وإرسالها للطبيب للمراجعة"
              : "Review incoming patient inquiries, assign triage urgency, and route to doctor"}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في التقارير..." : "Search patient or Report ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "pending_triage", "sent_to_doctor", "doctor_replied"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                filter === tab
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((rep) => (
          <Link
            key={rep.id}
            href={`/${locale}/secretary/reports/${rep.id}`}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                  rep.urgency === "High"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : rep.urgency === "Medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-cyan-50 text-[#0891B2] border-cyan-200"
                }`}
              >
                <FileText size={20} />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0891B2] transition-colors">
                    {rep.patientName}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 font-bold">({rep.id})</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      rep.urgency === "High"
                        ? "bg-red-100 text-red-700"
                        : rep.urgency === "Medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {rep.urgency}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">{rep.summary}</p>
                <p className="text-[11px] text-slate-400 mt-1">Status: {rep.triageStatus.replace("_", " ")} • {rep.time}</p>
              </div>
            </div>

            <span className="text-xs font-bold text-[#0891B2] group-hover:underline flex items-center gap-1 self-end sm:self-center">
              {isRTL ? "فتح الفرز والتوجيه" : "Open Triage & Route"}
              <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}