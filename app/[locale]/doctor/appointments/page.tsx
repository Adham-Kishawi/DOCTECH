"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  CalendarCheck,
  Search,
  FileText,
  UserPlus,
  Inbox,
  Clock,
  Phone,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface Appointment {
  id: string;
  time: string;
  date: string;
  rawDate: string;
  patientName: string;
  patientPhone: string;
  type: string;
  status: "confirmed" | "scheduled" | "completed" | "cancelled";
  notes: string;
  fee?: number;
}

export default function DoctorAppointmentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const res = await fetch("/api/appointments", { cache: "no-store" });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAppointments(json.data);
          if (json.data.length > 0) {
            setSelectedApt(json.data[0]);
          }
        }
      } catch (e) {
        console.error("Failed to load appointments:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  const filtered = appointments.filter((apt) => {
    const matchesFilter = filterStatus === "all" || apt.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      apt.patientName.toLowerCase().includes(q) ||
      apt.id.toLowerCase().includes(q) ||
      apt.patientPhone.includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-2">
            <CalendarCheck size={13} />
            <span>{isRTL ? "سجل الكشوفات الطبية" : "Patient Appointments Directory"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "مواعيد وكشوفات الطبيب" : "Clinical Appointments"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {isRTL
              ? "استعراض الكشوفات المحجوزة، فحص الحالات، وتحديث السجل الطبي"
              : "Review scheduled patient consultations and medical case sheets"}
          </p>
        </div>

        {/* Secretary booking link button */}
        <Link
          href={`/${locale}/secretary/appointments/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white shadow-md shadow-blue-900/15 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={16} />
          <span>{isRTL ? "حجز كشف جديد عبر الاستقبال" : "Book via Secretary Desk"}</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? "بحث باسم المريض أو الهاتف..." : "Search patient name, phone..."}
            className="w-full pl-9 rtl:pl-3.5 rtl:pr-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131E2E] text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {["all", "confirmed", "scheduled", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === status
                  ? "bg-[#1A4B8C] text-white"
                  : "bg-white dark:bg-[#131E2E] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-[#131E2E] p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1A4B8C] border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">{isRTL ? "جاري جلب المواعيد..." : "Loading appointments from database..."}</p>
        </div>
      ) : appointments.length === 0 ? (
        /* Real Clean Empty State */
        <div className="bg-white dark:bg-[#131E2E] p-12 sm:p-16 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center mb-4 shadow-inner">
            <Inbox size={32} />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {isRTL ? "لا توجد كشوفات مسجلة في قاعدة البيانات حتى الآن" : "No patient appointments recorded yet"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            {isRTL
              ? "حسابك جديد ولم يتم تسجيل أي مريض بعد. يتم حجز الكشوفات بواسطة السكرتير من مكتب الاستقبال لتظهر في جدولك فوراً."
              : "This doctor account is brand new. Appointments are booked by your clinic secretary and will appear here in real-time."}
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href={`/${locale}/secretary/appointments/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A4B8C] hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/15 transition-all"
            >
              <UserPlus size={16} />
              <span>{isRTL ? "الانتقال لشاشة الاستقبال وحجز كشف" : "Open Secretary Booking Desk"}</span>
            </Link>

            <Link
              href={`/${locale}/doctor/schedule`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <Calendar size={15} />
              <span>{isRTL ? "مراجعة فترات الجدول" : "View Schedule Slots"}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments List */}
          <div className="lg:col-span-2 bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedApt(apt)}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                  selectedApt?.id === apt.id
                    ? "bg-blue-50/50 dark:bg-blue-950/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 sm:w-20 text-center font-mono text-xs font-bold py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {apt.time}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {apt.patientName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {apt.type} • {apt.patientPhone}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {apt.status}
                </span>
              </div>
            ))}
          </div>

          {/* Details Sidebar */}
          {selectedApt && (
            <div className="bg-white dark:bg-[#131E2E] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                {selectedApt.patientName}
              </h2>
              <div className="space-y-2 text-xs">
                <p className="text-slate-400">Date: <span className="text-slate-800 dark:text-white font-bold">{selectedApt.date} ({selectedApt.time})</span></p>
                <p className="text-slate-400">Phone: <span className="text-slate-800 dark:text-white font-bold">{selectedApt.patientPhone}</span></p>
                <p className="text-slate-400">Type: <span className="text-slate-800 dark:text-white font-bold">{selectedApt.type}</span></p>
                {selectedApt.notes && (
                  <p className="text-slate-400">Notes: <span className="text-slate-800 dark:text-white font-semibold">{selectedApt.notes}</span></p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
