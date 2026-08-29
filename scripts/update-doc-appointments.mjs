import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\doctor";

// ============================================
// 1. DOCTOR APPOINTMENTS (Filterable List & Drawer)
// ============================================
const appointments = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  CalendarCheck, Search, Filter, Clock, User, Phone, 
  CheckCircle2, AlertCircle, XCircle, ChevronRight, FileText
} from "lucide-react";

interface Appointment {
  id: string;
  time: string;
  date: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  type: string;
  status: "confirmed" | "scheduled" | "completed" | "cancelled";
  notes: string;
  history: string;
}

const initialAppointments: Appointment[] = [
  { id: "APT-101", time: "09:00 AM", date: "Today", patientName: "Ahmed Hassan", patientPhone: "+20 100 123 4567", patientAge: 42, type: "Follow-up", status: "confirmed", notes: "Blood pressure evaluation & dosage adjustment", history: "Hypertension (3 years)" },
  { id: "APT-102", time: "10:00 AM", date: "Today", patientName: "Sara Ibrahim", patientPhone: "+20 102 345 6789", patientAge: 29, type: "New Consultation", status: "scheduled", notes: "Severe migraines for 2 weeks", history: "None reported" },
  { id: "APT-103", time: "11:30 AM", date: "Today", patientName: "Mohamed Ali", patientPhone: "+20 103 456 7890", patientAge: 55, type: "Post-op Review", status: "confirmed", notes: "Surgical wound healing assessment", history: "Appendectomy (2 weeks ago)" },
  { id: "APT-104", time: "01:00 PM", date: "Today", patientName: "Fatima Omar", patientPhone: "+20 104 567 8901", patientAge: 34, type: "Follow-up", status: "completed", notes: "Routine thyroid check", history: "Hypothyroidism" },
  { id: "APT-105", time: "02:30 PM", date: "Today", patientName: "Youssef Nabil", patientPhone: "+20 105 678 9012", patientAge: 19, type: "Check-up", status: "cancelled", notes: "Rescheduled by patient", history: "Asthma" },
  { id: "APT-106", time: "09:30 AM", date: "Tomorrow", patientName: "Mariam Khaled", patientPhone: "+20 106 789 0123", patientAge: 38, type: "Consultation", status: "scheduled", notes: "Persistent dry cough", history: "Non-smoker" },
];

export default function DoctorAppointmentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(initialAppointments[0]);

  const filtered = initialAppointments.filter((apt) => {
    const matchesFilter = filterStatus === "all" || apt.status === filterStatus;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-1.5">
            <CalendarCheck size={13} />
            {isRTL ? "عرض المواعيد (للقراءة فقط)" : "Doctor Schedule View (Read-Only)"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "مواعيد العيادة" : "Clinic Appointments"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة تدفق المرضى اليومي والكشوفات (إدارة الحجوزات تتم عبر السكرتيرة)"
              : "Review daily patient flow & clinical visits managed by reception"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            {isRTL ? \`إجمالي المعروض: \${filtered.length}\` : \`Total Listed: \${filtered.length}\`}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث بالاسم، الهاتف، أو رقم الموعد..." : "Search patient, phone, or APT ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", labelEn: "All", labelAr: "الكل" },
            { id: "confirmed", labelEn: "Confirmed", labelAr: "مؤكد" },
            { id: "scheduled", labelEn: "Scheduled", labelAr: "مجدول" },
            { id: "completed", labelEn: "Completed", labelAr: "مكتمل" },
            { id: "cancelled", labelEn: "Cancelled", labelAr: "ملغى" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap \${
                filterStatus === tab.id
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }\`}
            >
              {isRTL ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Appointments View + Patient Clinical Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isRTL ? "قائمة المواعيد" : "Appointment Queue"}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">
                {isRTL ? "لا توجد مواعيد مطابقة للبحث" : "No appointments found matching filter"}
              </div>
            ) : (
              filtered.map((apt) => {
                const isSelected = selectedApt?.id === apt.id;
                return (
                  <div
                    key={apt.id}
                    onClick={() => setSelectedApt(apt)}
                    className={\`p-4 transition-all cursor-pointer flex items-center justify-between gap-3 \${
                      isSelected
                        ? "bg-blue-50/70 border-r-4 rtl:border-r-0 rtl:border-l-4 border-[#1A4B8C]"
                        : "hover:bg-slate-50"
                    }\`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center shrink-0 border border-slate-200/60">
                        <span className="text-xs font-extrabold text-slate-900 font-mono leading-none">
                          {apt.time.split(" ")[0]}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">
                          {apt.time.split(" ")[1]}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">({apt.id})</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {apt.type} • {apt.patientAge} yrs • {apt.patientPhone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={\`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider \${
                          apt.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : apt.status === "completed"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : apt.status === "cancelled"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }\`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Patient Details Drawer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 h-fit sticky top-20">
          {selectedApt ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A4B8C] text-base font-extrabold flex items-center justify-center mb-3">
                    {selectedApt.patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedApt.patientName}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedApt.patientPhone}</p>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600">
                  {selectedApt.id}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Clinical Reason / Notes</span>
                  <p className="font-semibold text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedApt.notes}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Medical History</span>
                  <p className="font-semibold text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedApt.history}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Age</span>
                    <p className="font-bold text-slate-800">{selectedApt.patientAge} Years</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <p className="font-bold text-[#1A4B8C] uppercase">{selectedApt.status}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={\`/\${locale}/doctor/reports/1\`}
                  className="w-full h-10 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <FileText size={15} />
                  <span>{isRTL ? "فتح تقرير المريض الطبي" : "Open Clinical Report"}</span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              {isRTL ? "اختر موعداً لعرض التفاصيل السريرية" : "Select an appointment to inspect patient sheet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(base, "appointments", "page.tsx"), appointments, "utf8");
console.log("doctor/appointments updated");
