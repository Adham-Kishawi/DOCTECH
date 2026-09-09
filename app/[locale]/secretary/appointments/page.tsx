"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarCheck, Plus, Search, Edit3, Bot, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientNameAr: string;
  patientPhone: string;
  doctorName: string;
  doctorNameAr: string;
  type: string;
  typeAr: string;
  status: "confirmed" | "scheduled" | "completed" | "cancelled";
  source: "MANUAL" | "AI" | "WHATSAPP";
  bookingStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  notes: string;
  notesAr: string;
  fee?: number;
}

const initialAppointments: Appointment[] = [
  { id: "APT-201", time: "09:00 AM", patientName: "Ahmed Hassan", patientNameAr: "أحمد حسن", patientPhone: "+20 100 123 4567", doctorName: "Dr. Clinical Lead", doctorNameAr: "د. أحمد حسام", type: "Follow-up", typeAr: "متابعة", status: "confirmed", source: "MANUAL", bookingStatus: "APPROVED", notes: "Blood pressure evaluation", notesAr: "تقييم ضغط الدم", fee: 350 },
  { id: "APT-202", time: "09:30 AM", patientName: "Youssef Nabil", patientNameAr: "يوسف نبيل", patientPhone: "+20 101 234 5678", doctorName: "Dr. Clinical Lead", doctorNameAr: "د. أحمد حسام", type: "General Check-up", typeAr: "كشف عام", status: "completed", source: "MANUAL", bookingStatus: "APPROVED", notes: "Annual wellness visit", notesAr: "فحص دوري سنوي", fee: 400 },
  { id: "APT-203", time: "10:30 AM", patientName: "Sara Ibrahim", patientNameAr: "سارة إبراهيم", patientPhone: "+20 102 345 6789", doctorName: "Dr. Clinical Lead", doctorNameAr: "د. أحمد حسام", type: "New Consultation", typeAr: "كشف جديد", status: "scheduled", source: "AI", bookingStatus: "PENDING_REVIEW", notes: "Migraine complaints via WhatsApp AI", notesAr: "شكوى صداع نصفي عبر الذكاء الاصطناعي", fee: 450 },
  { id: "APT-204", time: "11:00 AM", patientName: "Mohamed Ali", patientNameAr: "محمد علي", patientPhone: "+20 103 456 7890", doctorName: "Dr. Clinical Lead", doctorNameAr: "د. أحمد حسام", type: "Post-Op Review", typeAr: "متابعة جراحة", status: "confirmed", source: "WHATSAPP", bookingStatus: "APPROVED", notes: "Wound assessment", notesAr: "تقييم التئام الجرح", fee: 300 },
  { id: "APT-205", time: "01:00 PM", patientName: "Fatima Omar", patientNameAr: "فاطمة عمر", patientPhone: "+20 104 567 8901", doctorName: "Dr. Clinical Lead", doctorNameAr: "د. أحمد حسام", type: "Follow-up", typeAr: "متابعة", status: "scheduled", source: "MANUAL", bookingStatus: "APPROVED", notes: "Thyroid follow-up", notesAr: "متابعة الغدة الدرقية", fee: 350 },
];

export default function SecretaryAppointmentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const pendingAICount = appointments.filter((a) => a.bookingStatus === "PENDING_REVIEW").length;

  const handleUpdateStatus = (id: string, newStatus: Appointment["status"]) => {
    setAppointments((currentAppointments) =>
      currentAppointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    toast.success(isRTL ? `تم تحديث حالة الموعد` : `Appointment status updated to ${newStatus}`);
  };

  const handleApproveAI = (id: string) => {
    setAppointments((currentAppointments) =>
      currentAppointments.map((a) => (a.id === id ? { ...a, bookingStatus: "APPROVED", status: "confirmed" } : a))
    );
    toast.success(isRTL ? "تم اعتماد الحجز وإرسال تأكيد بالواتساب للمريض ✅" : "AI booking approved & confirmation sent via WhatsApp ✅");
  };

  const filtered = appointments.filter((apt) => {
    const matchesFilter =
      filterStatus === "all"
        ? true
        : filterStatus === "pending_ai"
        ? apt.bookingStatus === "PENDING_REVIEW"
        : apt.status === filterStatus;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientNameAr.includes(searchTerm) ||
      apt.patientPhone.includes(searchTerm) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 mb-1.5">
            <CalendarCheck size={13} />
            {isRTL ? "إدارة وتنظيم المواعيد (CRUD)" : "Reception Appointments Management"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "جدول الحجوزات والمواعيد" : "Appointments Registry"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "حجز مواعيد جديدة، مراجعة طلبات المساعد الذكي، وتحديث الحالات"
              : "Book, reschedule, approve AI booking requests, and manage patient appointments"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/${locale}/secretary/appointments/pending`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all relative"
          >
            <Bot size={15} className="text-purple-600 dark:text-purple-400" />
            <span>{isRTL ? "طلبات حجز الـ AI" : "AI Bookings"}</span>
            {pendingAICount > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingAICount}
              </span>
            )}
          </Link>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-md shadow-cyan-900/15 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{isRTL ? "حجز موعد جديد" : "New Appointment"}</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث بالاسم أو الهاتف..." : "Search patient name or phone..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", en: "All", ar: "الكل" },
            { id: "pending_ai", en: `AI Pending (${pendingAICount})`, ar: `بانتظار مراجعة AI (${pendingAICount})` },
            { id: "confirmed", en: "Confirmed", ar: "مؤكد" },
            { id: "scheduled", en: "Scheduled", ar: "مجدول" },
            { id: "completed", en: "Completed", ar: "مكتمل" },
            { id: "cancelled", en: "Cancelled", ar: "ملغى" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st.id
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? st.ar : st.en}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments CRUD List */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">
            {isRTL ? "لا توجد مواعيد مطابقة للبحث" : "No appointments found matching filter"}
          </div>
        ) : (
          filtered.map((apt) => (
            <div
              key={apt.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                apt.bookingStatus === "PENDING_REVIEW"
                  ? "bg-purple-50/40 dark:bg-purple-950/20 border-l-4 rtl:border-l-0 rtl:border-r-4 border-purple-500"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="w-14 sm:w-16 h-11 sm:h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 font-mono text-[11px] sm:text-xs font-extrabold flex flex-col items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900">
                  <span>{apt.time.split(" ")[0]}</span>
                  <span className="text-[8px] sm:text-[9px] uppercase">{apt.time.split(" ")[1]}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {isRTL ? apt.patientNameAr : apt.patientName}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">({apt.id})</span>
                    {apt.source === "AI" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Sparkles size={10} />
                        <span>{isRTL ? "مساعد ذكي" : "AI"}</span>
                      </span>
                    )}
                    {apt.source === "WHATSAPP" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        WhatsApp
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                    {apt.patientPhone} • {isRTL ? apt.typeAr : apt.type} • {isRTL ? apt.doctorNameAr : apt.doctorName}
                    {apt.fee && <span className="text-slate-700 dark:text-slate-300 font-bold"> • {apt.fee} EGP</span>}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                    {isRTL ? `ملاحظات: ${apt.notesAr}` : `Notes: ${apt.notes}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {apt.bookingStatus === "PENDING_REVIEW" ? (
                  <button
                    onClick={() => handleApproveAI(apt.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>{isRTL ? "اعتماد الحجز" : "Approve Booking"}</span>
                  </button>
                ) : (
                  <select
                    value={apt.status}
                    onChange={(e) => handleUpdateStatus(apt.id, e.target.value as Appointment["status"])}
                    className="h-8 px-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:bg-white dark:focus:bg-slate-900"
                  >
                    <option value="scheduled">{isRTL ? "مجدول" : "Scheduled"}</option>
                    <option value="confirmed">{isRTL ? "مؤكد" : "Confirmed"}</option>
                    <option value="completed">{isRTL ? "مكتمل" : "Completed"}</option>
                    <option value="cancelled">{isRTL ? "ملغى" : "Cancelled"}</option>
                  </select>
                )}

                <Link
                  href={`/${locale}/secretary/appointments/${apt.id}`}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#0891B2] dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors"
                  title="Edit / Reschedule"
                >
                  <Edit3 size={15} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
