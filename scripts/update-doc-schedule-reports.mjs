import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\doctor";

// ============================================
// 2. DOCTOR SCHEDULE (Weekly Timetable Calendar)
// ============================================
const schedule = `"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, ChevronLeft, ChevronRight, User, Stethoscope, ShieldCheck } from "lucide-react";

interface Slot {
  id: string;
  time: string;
  patient?: string;
  type?: string;
  isBooked: boolean;
}

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export default function DoctorSchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [selectedDay, setSelectedDay] = useState("Sunday");

  const slots: Slot[] = [
    { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", type: "Follow-up Check", isBooked: true },
    { id: "2", time: "09:30 AM", patient: "Omar Farouk", type: "Lab Consultation", isBooked: true },
    { id: "3", time: "10:00 AM", isBooked: false },
    { id: "4", time: "10:30 AM", patient: "Sara Ibrahim", type: "New Patient Consultation", isBooked: true },
    { id: "5", time: "11:00 AM", patient: "Mohamed Ali", type: "Post-Op Wound Check", isBooked: true },
    { id: "6", time: "11:30 AM", isBooked: false },
    { id: "7", time: "12:00 PM", isBooked: false },
    { id: "8", time: "01:00 PM", patient: "Fatima Omar", type: "Prescription Renewal", isBooked: true },
    { id: "9", time: "01:30 PM", patient: "Nouran Mahmoud", type: "Diabetes Follow-up", isBooked: true },
    { id: "10", time: "02:00 PM", isBooked: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-1.5">
            <Calendar size={13} />
            {isRTL ? "الجدول الأسبوعي والورديات" : "Weekly Schedule & Shift Matrix"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "جدول كشوفات الطبيب" : "Doctor Clinical Timetable"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "استعراض فترات العمل والمواعيد المحجوزة والمتاحة لكل يوم"
              : "Review booked consultation slots, open availability & shift hours"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 p-1.5 rounded-xl">
            <Clock size={14} className="text-[#1A4B8C]" />
            <span>09:00 AM - 05:00 PM</span>
          </div>
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={\`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-center transition-all cursor-pointer \${
              selectedDay === day
                ? "bg-[#1A4B8C] text-white font-bold shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
            }\`}
          >
            <p className="text-xs">{day}</p>
            <p className="text-[10px] opacity-80 mt-0.5">6 Booked • 4 Free</p>
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isRTL ? \`مواعيد يوم: \${selectedDay}\` : \`\${selectedDay} Schedule Slots\`}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            30 Mins Consultation Slots
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={\`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 \${
                slot.isBooked
                  ? "bg-blue-50/40 border-blue-200/80 hover:border-[#1A4B8C]"
                  : "bg-emerald-50/20 border-dashed border-emerald-300/80 hover:bg-emerald-50/40"
              }\`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={\`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xs font-extrabold shrink-0 \${
                    slot.isBooked
                      ? "bg-[#1A4B8C] text-white shadow-xs"
                      : "bg-emerald-100 text-emerald-800"
                  }\`}
                >
                  {slot.time.split(" ")[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {slot.time}
                    </span>
                    <span
                      className={\`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase \${
                        slot.isBooked
                          ? "bg-blue-100 text-[#1A4B8C]"
                          : "bg-emerald-100 text-emerald-700"
                      }\`}
                    >
                      {slot.isBooked ? (isRTL ? "محجوز" : "Booked") : (isRTL ? "متاح" : "Available")}
                    </span>
                  </div>

                  {slot.isBooked ? (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-800">{slot.patient}</p>
                      <p className="text-[11px] text-slate-500">{slot.type}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      {isRTL ? "شاغر لحجوزات الاستقبال" : "Open for booking by secretary"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;

// ============================================
// 3. DOCTOR REPORTS LIST & MEDICAL REVIEW
// ============================================
const reportsList = `"use client";

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
              className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize \${
                filter === t
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }\`}
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
            href={\`/\${locale}/doctor/reports/\${rep.id}\`}
            className="p-5 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div
                className={\`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs \${
                  rep.urgency === "High"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : rep.urgency === "Medium"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-[#1A4B8C] border border-blue-200"
                }\`}
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
                    className={\`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase \${
                      rep.urgency === "High"
                        ? "bg-red-100 text-red-700"
                        : rep.urgency === "Medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }\`}
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
}`;

// Write schedule and reports list
fs.writeFileSync(path.join(base, "schedule", "page.tsx"), schedule, "utf8");
fs.writeFileSync(path.join(base, "reports", "page.tsx"), reportsList, "utf8");
console.log("doctor/schedule and doctor/reports list written");
