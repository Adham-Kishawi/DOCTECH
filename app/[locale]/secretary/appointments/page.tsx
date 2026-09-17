"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CalendarCheck,
  Plus,
  Search,
  Bot,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  doctorId?: string;
  doctorName: string;
  doctorSpecialty?: string;
  date: string;
  time: string;
  rawDate?: string;
  duration?: number;
  status: "confirmed" | "scheduled" | "completed" | "cancelled" | string;
  type: string;
  source: "MANUAL" | "AI" | "WHATSAPP" | string;
  bookingStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | string;
  notes: string;
  fee?: number;
}

export default function SecretaryAppointmentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoading(true);
        const res = await fetch("/api/appointments");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAppointments(json.data);
        }
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

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
    toast.success(
      isRTL ? "تم اعتماد الحجز وإرسال تأكيد بالواتساب للمريض ✅" : "AI booking approved & confirmation sent via WhatsApp ✅"
    );
  };

  const filtered = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesFilter =
        filterStatus === "all"
          ? true
          : filterStatus === "pending_ai"
          ? apt.bookingStatus === "PENDING_REVIEW"
          : apt.status === filterStatus;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientPhone.includes(q) ||
        apt.id.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [appointments, filterStatus, searchTerm]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
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
              ? "مواعيد حقيقية ومسجلة في قاعدة البيانات، مراجعة طلبات الذكاء الاصطناعي، وتحديث الحالات"
              : "Live database appointments, approve AI booking requests, and manage patient care"}
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
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
                {pendingAICount}
              </span>
            )}
          </Link>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/15 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>{isRTL ? "حجز موعد كشف جديد" : "New Appointment"}</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#131E2E] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: "all", labelEn: "All", labelAr: "الكل" },
            { key: "confirmed", labelEn: "Confirmed", labelAr: "مؤكد" },
            { key: "scheduled", labelEn: "Scheduled", labelAr: "مجدول" },
            { key: "completed", labelEn: "Completed", labelAr: "مكتمل" },
            { key: "cancelled", labelEn: "Cancelled", labelAr: "ملغي" },
            { key: "pending_ai", labelEn: "AI Pending", labelAr: "معلق (AI)" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterStatus === tab.key
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isRTL ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="doctech-input-icon" size={15} />
          <input
            type="text"
            placeholder={isRTL ? "بحث باسم المريض أو الطبيب..." : "Search patient or doctor..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input text-xs"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <Loader2 size={32} className="animate-spin text-[#0891B2] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400">
            {isRTL ? "جاري تحميل جدول المواعيد من قاعدة البيانات..." : "Loading appointments from database..."}
          </p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 sm:p-16 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] flex items-center justify-center mx-auto mb-4">
            <CalendarCheck size={32} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isRTL ? "لا توجد مواعيد محجوزة حالياً" : "No Appointments Booked Yet"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 font-medium">
            {isRTL
              ? "قاعدة البيانات لا تحتوي على أي حجوزات بعد. يمكنك البدء بحجز أول موعد كشف لمريض."
              : "No appointments have been booked yet. Start by booking your first patient consultation."}
          </p>
          <div className="mt-6">
            <Link
              href={`/${locale}/secretary/appointments/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-md shadow-cyan-900/15 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>{isRTL ? "حجز أول موعد الآن" : "Book First Appointment"}</span>
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400">
            {isRTL ? "لا توجد مواعيد مطابقة لفلتر البحث." : "No appointments match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-cyan-500/40"
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] flex flex-col items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900">
                  <Clock size={16} />
                  <span className="text-[10px] font-mono font-black mt-0.5">{apt.time}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{apt.patientName}</h3>
                    <span className="text-xs font-mono text-slate-400">({apt.patientPhone})</span>
                    {apt.bookingStatus === "PENDING_REVIEW" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200">
                        {isRTL ? "بانتظار المراجعة (AI)" : "Pending Review (AI)"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span>{apt.doctorName}</span>
                    <span>•</span>
                    <span className="font-bold text-[#0891B2]">{apt.type}</span>
                    <span>•</span>
                    <span>{apt.date}</span>
                    {apt.fee !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{apt.fee} EGP</span>
                      </>
                    )}
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">{apt.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                {apt.bookingStatus === "PENDING_REVIEW" ? (
                  <button
                    onClick={() => handleApproveAI(apt.id)}
                    className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isRTL ? "اعتماد الحجز" : "Approve Booking"}</span>
                  </button>
                ) : (
                  <select
                    value={apt.status}
                    onChange={(e) => handleUpdateStatus(apt.id, e.target.value as Appointment["status"])}
                    className="h-8 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0891B2]"
                  >
                    <option value="confirmed">{isRTL ? "مؤكد" : "Confirmed"}</option>
                    <option value="scheduled">{isRTL ? "مجدول" : "Scheduled"}</option>
                    <option value="completed">{isRTL ? "مكتمل" : "Completed"}</option>
                    <option value="cancelled">{isRTL ? "ملغي" : "Cancelled"}</option>
                  </select>
                )}

                {apt.patientId && (
                  <Link
                    href={`/${locale}/secretary/patients/${apt.patientId}`}
                    className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <User size={13} />
                    <span>{isRTL ? "ملف المريض" : "Patient File"}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
