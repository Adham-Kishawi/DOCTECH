"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  CalendarCheck, Search, FileText
} from "lucide-react";

interface Appointment {
  id: string;
  time: string;
  date: string;
  patientName: string;
  patientNameAr: string;
  patientPhone: string;
  patientAge: number;
  type: string;
  typeAr: string;
  status: "confirmed" | "scheduled" | "completed" | "cancelled";
  notes: string;
  notesAr: string;
  history: string;
  historyAr: string;
}

const initialAppointments: Appointment[] = [
  { id: "APT-101", time: "09:00 AM", date: "Today", patientName: "Ahmed Hassan", patientNameAr: "أحمد حسن", patientPhone: "+20 100 123 4567", patientAge: 42, type: "Follow-up", typeAr: "متابعة", status: "confirmed", notes: "Blood pressure evaluation & dosage adjustment", notesAr: "تقييم ضغط الدم وتعديل الجرعة", history: "Hypertension (3 years)", historyAr: "ارتفاع ضغط الدم (٣ سنوات)" },
  { id: "APT-102", time: "10:00 AM", date: "Today", patientName: "Sara Ibrahim", patientNameAr: "سارة إبراهيم", patientPhone: "+20 102 345 6789", patientAge: 29, type: "New Consultation", typeAr: "كشف جديد", status: "scheduled", notes: "Severe migraines for 2 weeks", notesAr: "صداع نصفي شديد لمدة أسبوعين", history: "None reported", historyAr: "لا يوجد" },
  { id: "APT-103", time: "11:30 AM", date: "Today", patientName: "Mohamed Ali", patientNameAr: "محمد علي", patientPhone: "+20 103 456 7890", patientAge: 55, type: "Post-op Review", typeAr: "مراجعة بعد العملية", status: "confirmed", notes: "Surgical wound healing assessment", notesAr: "تقييم التئام الجرح الجراحي", history: "Appendectomy (2 weeks ago)", historyAr: "استئصال الزائدة (منذ أسبوعين)" },
  { id: "APT-104", time: "01:00 PM", date: "Today", patientName: "Fatima Omar", patientNameAr: "فاطمة عمر", patientPhone: "+20 104 567 8901", patientAge: 34, type: "Follow-up", typeAr: "متابعة", status: "completed", notes: "Routine thyroid check", notesAr: "فحص غدة درقية روتيني", history: "Hypothyroidism", historyAr: "قصور الغدة الدرقية" },
  { id: "APT-105", time: "02:30 PM", date: "Today", patientName: "Youssef Nabil", patientNameAr: "يوسف نبيل", patientPhone: "+20 105 678 9012", patientAge: 19, type: "Check-up", typeAr: "فحص عام", status: "cancelled", notes: "Rescheduled by patient", notesAr: "أعيد جدولته من المريض", history: "Asthma", historyAr: "ربو" },
  { id: "APT-106", time: "09:30 AM", date: "Tomorrow", patientName: "Mariam Khaled", patientNameAr: "مريم خالد", patientPhone: "+20 106 789 0123", patientAge: 38, type: "Consultation", typeAr: "استشارة", status: "scheduled", notes: "Persistent dry cough", notesAr: "سعال جاف مستمر", history: "Non-smoker", historyAr: "غير مدخنة" },
];

export default function DoctorAppointmentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(initialAppointments[0]);
  const [showDetails, setShowDetails] = useState(false);

  const filtered = initialAppointments.filter((apt) => {
    const matchesFilter = filterStatus === "all" || apt.status === filterStatus;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const handleSelectApt = (apt: Appointment) => {
    setSelectedApt(apt);
    setShowDetails(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <CalendarCheck size={13} />
            {isRTL ? "عرض المواعيد (للقراءة فقط)" : "Doctor Schedule View (Read-Only)"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "مواعيد العيادة" : "Clinic Appointments"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "متابعة تدفق المرضى اليومي والكشوفات (إدارة الحجوزات تتم عبر السكرتيرة)"
              : "Review daily patient flow & clinical visits managed by reception"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
            {isRTL ? `إجمالي المعروض: ${filtered.length}` : `Total Listed: ${filtered.length}`}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
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

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === tab.id
                  ? "bg-[#1A4B8C] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Appointments View + Patient Clinical Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isRTL ? "قائمة المواعيد" : "Appointment Queue"}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
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
                    onClick={() => handleSelectApt(apt)}
                    className={`p-3 sm:p-4 transition-all cursor-pointer flex items-center justify-between gap-2 sm:gap-3 ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30 border-r-4 rtl:border-r-0 rtl:border-l-4 border-[#1A4B8C]"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <div className="w-14 sm:w-16 h-10 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                        <span className="text-[10px] sm:text-xs font-extrabold text-slate-900 dark:text-white font-mono leading-none">
                          {apt.time.split(" ")[0]}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-none mt-0.5 sm:mt-1">
                          {apt.time.split(" ")[1]}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {isRTL ? apt.patientNameAr : apt.patientName}
                          </h3>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 font-mono hidden sm:inline">({apt.id})</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                          {isRTL ? apt.typeAr : apt.type} • {apt.patientAge} {isRTL ? "سنة" : "yrs"}
                          <span className="hidden sm:inline"> • {apt.patientPhone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span
                        className={`text-[9px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider ${
                          apt.status === "confirmed"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                            : apt.status === "completed"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            : apt.status === "cancelled"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                        }`}
                      >
                        {isRTL
                          ? (apt.status === "confirmed" ? "مؤكد" : apt.status === "completed" ? "مكتمل" : apt.status === "cancelled" ? "ملغى" : "مجدول")
                          : apt.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Patient Details — on mobile, show as overlay modal */}
        {/* Desktop: always visible panel */}
        <div className="hidden lg:block bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-5 h-fit sticky top-20">
          {selectedApt ? (
            <PatientDetailsContent apt={selectedApt} locale={locale} isRTL={isRTL} />
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-medium">
              {isRTL ? "اختر موعداً لعرض التفاصيل السريرية" : "Select an appointment to inspect patient sheet"}
            </div>
          )}
        </div>

        {/* Mobile: bottom sheet overlay */}
        {showDetails && selectedApt && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
            <div className="relative w-full max-h-[85vh] bg-white dark:bg-[#131E2E] rounded-t-3xl p-5 pb-8 space-y-5 overflow-y-auto animate-slide-up">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <PatientDetailsContent apt={selectedApt} locale={locale} isRTL={isRTL} />
              <button
                onClick={() => setShowDetails(false)}
                className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Extracted patient details into its own component for reuse in both desktop panel and mobile sheet
function PatientDetailsContent({ apt, locale, isRTL }: { apt: Appointment; locale: string; isRTL: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 text-base font-extrabold flex items-center justify-center mb-3">
            {apt.patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isRTL ? apt.patientNameAr : apt.patientName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{apt.patientPhone}</p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400">
          {apt.id}
        </span>
      </div>

      <div className="space-y-3.5 text-xs">
        <div>
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            {isRTL ? "سبب الزيارة / ملاحظات" : "Clinical Reason / Notes"}
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
            {isRTL ? apt.notesAr : apt.notes}
          </p>
        </div>

        <div>
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            {isRTL ? "التاريخ المرضي" : "Medical History"}
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
            {isRTL ? apt.historyAr : apt.history}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "العمر" : "Age"}</span>
            <p className="font-bold text-slate-800 dark:text-slate-200">{apt.patientAge} {isRTL ? "سنة" : "Years"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? "الحالة" : "Status"}</span>
            <p className="font-bold text-[#1A4B8C] dark:text-blue-400 uppercase">{apt.status}</p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href={`/${locale}/doctor/reports/1`}
          className="w-full h-10 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <FileText size={15} />
          <span>{isRTL ? "فتح تقرير المريض الطبي" : "Open Clinical Report"}</span>
        </Link>
      </div>
    </>
  );
}
