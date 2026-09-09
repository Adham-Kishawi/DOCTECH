"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  MessageCircle,
  Printer,
  ChevronRight,
  User,
  Activity,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  ScheduleSlot,
  WEEK_DAYS,
  INITIAL_SCHEDULE_SLOTS,
} from "@/lib/schedule/scheduleData";
import { CLINIC_DOCTORS } from "@/lib/doctor/historyData";
import { SecretarySlotModal } from "@/components/secretary/schedule/SecretarySlotModal";
import { toast } from "sonner";

export default function SecretarySchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  // Slots State
  const [slots, setSlots] = useState<ScheduleSlot[]>(INITIAL_SCHEDULE_SLOTS);

  // Selected Doctor Filter ('all' or doc.id)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("doc-1");

  // Selected Day Filter
  const [selectedDay, setSelectedDay] = useState<string>("Sunday");

  // Status Filter ('all' | 'AVAILABLE' | 'BOOKED' | 'BLOCKED')
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Search filter
  const [search, setSearch] = useState("");

  // Modal State
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active Doctor object
  const activeDoctor = useMemo(() => {
    return CLINIC_DOCTORS.find((d) => d.id === selectedDoctorId) || null;
  }, [selectedDoctorId]);

  // Filtered Slots for the current view
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // 1. Doctor filter
      if (selectedDoctorId !== "all" && slot.doctorId !== selectedDoctorId) {
        return false;
      }

      // 2. Day filter
      if (slot.dayEn !== selectedDay) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== "all" && slot.status !== statusFilter) {
        return false;
      }

      // 4. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchPatient =
          slot.patientName?.toLowerCase().includes(q) ||
          slot.patientNameAr?.includes(q);
        const matchTime = slot.time.toLowerCase().includes(q);
        const matchType =
          slot.appointmentType?.toLowerCase().includes(q) ||
          slot.appointmentTypeAr?.includes(q);

        if (!matchPatient && !matchTime && !matchType) {
          return false;
        }
      }

      return true;
    });
  }, [slots, selectedDoctorId, selectedDay, statusFilter, search]);

  // Aggregate stats for current day & doctor selection
  const dayStats = useMemo(() => {
    const daySlots = slots.filter((s) => {
      const matchDoc = selectedDoctorId === "all" || s.doctorId === selectedDoctorId;
      return matchDoc && s.dayEn === selectedDay;
    });

    const total = daySlots.length;
    const booked = daySlots.filter((s) => s.status === "BOOKED" || s.status === "IN_PROGRESS" || s.status === "COMPLETED").length;
    const available = daySlots.filter((s) => s.status === "AVAILABLE").length;
    const blocked = daySlots.filter((s) => s.status === "BLOCKED").length;
    const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;

    return { total, booked, available, blocked, occupancyRate };
  }, [slots, selectedDoctorId, selectedDay]);

  const handleOpenSlotModal = (slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleUpdateSlot = (updated: ScheduleSlot) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setSelectedSlot(updated);
  };

  const handlePrintSchedule = () => {
    window.print();
    toast.success(isRTL ? "تم تجهيز جدول المواعيد للطباعة" : "Daily schedule prepared for printing");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ━━━ 1. PAGE HEADER ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 mb-2">
            <Calendar size={13} />
            {isRTL ? "إدارة جدول كشوفات العيادة والورديات" : "Clinic Master Timetable & Shift Matrix"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "جدول المواعيد والفترات الشاغرة" : "Master Consultation Schedule"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            {isRTL
              ? "متابعة فترات كشف أطباء العيادة، حجز الفترات المتاحة للمرضى، وتنسيق أوقات الاستراحة وتفادي التعارض"
              : "Coordinate doctor consultation hours, book open slots for patients, manage breaks and prevent overlapping"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
          <button
            onClick={handlePrintSchedule}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">{isRTL ? "طباعة الجدول" : "Print"}</span>
          </button>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="h-10 px-4 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/15 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>{isRTL ? "حجز كشف جديد" : "New Booking"}</span>
          </Link>
        </div>
      </div>

      {/* ━━━ 2. DOCTOR SELECTOR TABS & ACTIVE DOCTOR PROFILE ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-5 sm:p-6 space-y-5">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            {isRTL ? "اختر الطبيب لعرض فترات جدول الكشف:" : "Select Physician to View Consultation Slots:"}
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* All Doctors option */}
            <button
              onClick={() => setSelectedDoctorId("all")}
              className={`h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                selectedDoctorId === "all"
                  ? "bg-[#0891B2] text-white shadow-md shadow-cyan-900/15"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Users size={15} />
              <span>{isRTL ? "جميع أطباء العيادة" : "All Clinic Doctors"}</span>
            </button>

            {/* Individual Doctors */}
            {CLINIC_DOCTORS.map((doc) => {
              const isSelected = selectedDoctorId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  className={`h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-[#0891B2] text-white shadow-md shadow-cyan-900/15"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isSelected ? "bg-white text-[#0891B2]" : doc.avatarBg
                    }`}
                  >
                    {doc.initials}
                  </span>
                  <span>{isRTL ? doc.nameAr : doc.name}</span>
                  <span className="text-[10px] opacity-75 font-medium hidden md:inline">
                    ({isRTL ? doc.specialtyAr : doc.specialty})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Doctor Profile Banner */}
        {activeDoctor && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-50/70 via-slate-50 to-blue-50/40 dark:from-cyan-950/20 dark:via-slate-900 dark:to-blue-950/10 border border-cyan-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-13 h-13 rounded-2xl ${activeDoctor.avatarBg} font-black text-lg flex items-center justify-center shrink-0 shadow-sm`}
              >
                {activeDoctor.initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {isRTL ? activeDoctor.nameAr : activeDoctor.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {activeDoctor.licenseId}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#0891B2] dark:text-cyan-400 mt-0.5">
                  {isRTL ? activeDoctor.titleAr : activeDoctor.title} • {isRTL ? activeDoctor.departmentAr : activeDoctor.department}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRTL ? "مواعيد الكشف" : "Shift Hours"}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <Clock size={12} className="text-[#0891B2]" />
                  09:00 AM - 05:00 PM
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRTL ? "مدة كل كشف" : "Slot Duration"}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {isRTL ? "٣٠ دقيقة" : "30 Mins"}
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isRTL ? "نسبة إشغال اليوم" : "Occupancy"}
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {dayStats.occupancyRate}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ 3. WEEK DAYS SELECTOR TABS ━━━ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-[#131E2E] p-3.5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {WEEK_DAYS.map((day) => {
          const isSelected = selectedDay === day.en;
          const daySlotsCount = slots.filter((s) => {
            const matchDoc = selectedDoctorId === "all" || s.doctorId === selectedDoctorId;
            return matchDoc && s.dayEn === day.en;
          });
          const bookedCount = daySlotsCount.filter((s) => s.status === "BOOKED" || s.status === "IN_PROGRESS" || s.status === "COMPLETED").length;
          const freeCount = daySlotsCount.filter((s) => s.status === "AVAILABLE").length;

          return (
            <button
              key={day.en}
              onClick={() => setSelectedDay(day.en)}
              className={`flex-1 min-w-[110px] sm:min-w-[130px] py-3 px-3 rounded-2xl text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#0891B2] text-white font-bold shadow-md shadow-cyan-900/15"
                  : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
              }`}
            >
              <p className="text-xs sm:text-sm font-bold">
                {isRTL ? day.ar : day.en}
              </p>
              <p className={`text-[10px] mt-0.5 ${isSelected ? "text-cyan-100 font-medium" : "text-slate-400"}`}>
                {bookedCount > 0 || freeCount > 0
                  ? isRTL
                    ? `${bookedCount} محجوز • ${freeCount} متاح`
                    : `${bookedCount} Booked • ${freeCount} Open`
                  : isRTL ? "لا توجد فترات" : "No Slots"}
              </p>
            </button>
          );
        })}
      </div>

      {/* ━━━ 4. KPI SUMMARY CARDS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "إجمالي الفترات" : "Total Slots"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {dayStats.total}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "فترات محجوزة" : "Booked Slots"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {dayStats.booked}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "فترات متاحة" : "Open Available"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {dayStats.available}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Lock size={19} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isRTL ? "فترات محجوبة" : "Blocked / Breaks"}
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {dayStats.blocked}
            </p>
          </div>
        </div>
      </div>

      {/* ━━━ 5. FILTER & SEARCH TOOLBAR ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث باسم المريض أو الوقت..." : "Search patient name or slot time..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", en: "All Slots", ar: "كل الفترات" },
            { id: "AVAILABLE", en: "Available", ar: "المتاحة فقط" },
            { id: "BOOKED", en: "Booked", ar: "المحجوزة فقط" },
            { id: "BLOCKED", en: "Blocked", ar: "المحجوبة" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isRTL ? st.ar : st.en}
            </button>
          ))}
        </div>
      </div>

      {/* ━━━ 6. SCHEDULE SLOTS GRID ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {isRTL
              ? `فترات كشف يوم ${WEEK_DAYS.find((d) => d.en === selectedDay)?.ar || selectedDay}`
              : `${selectedDay} Consultation Slots Matrix`}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {isRTL ? `المعروض: ${filteredSlots.length} فترة` : `Showing: ${filteredSlots.length} slots`}
          </span>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            {isRTL
              ? "لا توجد فترات مجدولة تطابق معايير الفلترة المختارة."
              : "No slots found matching your selected filters."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6">
            {filteredSlots.map((slot) => {
              const isAvailable = slot.status === "AVAILABLE";
              const isBlocked = slot.status === "BLOCKED";
              const isBooked = slot.status === "BOOKED" || slot.status === "IN_PROGRESS" || slot.status === "COMPLETED";

              return (
                <div
                  key={slot.id}
                  onClick={() => handleOpenSlotModal(slot)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isAvailable
                      ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-dashed border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50/50 hover:border-emerald-500"
                      : isBlocked
                      ? "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75"
                      : "bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 hover:border-blue-500 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Time Badge */}
                      <div
                        className={`w-13 h-12 rounded-xl flex flex-col items-center justify-center font-mono text-xs font-black shrink-0 ${
                          isAvailable
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                            : isBlocked
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            : "bg-[#0891B2] text-white shadow-xs"
                        }`}
                      >
                        <span>{slot.time.split(" ")[0]}</span>
                        <span className="text-[9px] uppercase font-bold opacity-85">
                          {slot.time.split(" ")[1]}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {slot.time}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                              isAvailable
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : isBlocked
                                ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            }`}
                          >
                            {isAvailable
                              ? isRTL ? "متاح للحجز" : "Available"
                              : isBlocked
                              ? isRTL ? "محجوب" : "Blocked"
                              : isRTL ? "محجوز" : "Booked"}
                          </span>
                        </div>

                        {isBooked ? (
                          <div className="mt-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {isRTL ? slot.patientNameAr || slot.patientName : slot.patientName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {isRTL ? slot.appointmentTypeAr || slot.appointmentType : slot.appointmentType} • {slot.fee} EGP
                            </p>
                          </div>
                        ) : isBlocked ? (
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">
                            {slot.notes || (isRTL ? "استراحة الطبيب" : "Doctor break")}
                          </p>
                        ) : (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                            {isRTL ? "اضغط لحجز مريض فوراً ⚡" : "Click to book a patient ⚡"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Doctor indicator */}
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                      {isRTL ? slot.doctorNameAr : slot.doctorName}
                    </span>
                  </div>

                  {/* Bottom Action strip */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-[11px]">
                    <span className="text-slate-400 font-medium">
                      ⏱ {slot.durationMinutes} {isRTL ? "دقيقة" : "mins"}
                    </span>

                    {isBooked && (
                      <span className="text-[#0891B2] font-bold hover:underline flex items-center gap-1">
                        {isRTL ? "استعراض وتفاصيل" : "View Details"}
                        <ChevronRight size={13} className={isRTL ? "rotate-180" : ""} />
                      </span>
                    )}

                    {isAvailable && (
                      <span className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                        {isRTL ? "حجز الفترة الآن" : "Book Slot"}
                        <Plus size={13} />
                      </span>
                    )}

                    {isBlocked && (
                      <span className="text-slate-500 font-bold hover:underline flex items-center gap-1">
                        {isRTL ? "فك الحجب" : "Unblock"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ━━━ 7. INTERACTIVE SLOT MODAL ━━━ */}
      <SecretarySlotModal
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateSlot={handleUpdateSlot}
        isRTL={isRTL}
      />
    </div>
  );
}
