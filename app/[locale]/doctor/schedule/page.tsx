"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  Search,
  CheckCircle2,
  Lock,
  Printer,
  ChevronRight,
  User,
  AlertCircle,
  Settings,
  Stethoscope,
  UserPlus,
  Inbox,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface DoctorSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

interface GeneratedSlot {
  id: string;
  time: string;
  time24: string;
  doctorName: string;
  doctorId: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
  patientName?: string;
  patientPhone?: string;
  appointmentType?: string;
  fee?: number;
  notes?: string;
}

const WEEK_DAYS = [
  { dayEn: "Saturday", dayAr: "السبت", dayOfWeek: 6 },
  { dayEn: "Sunday", dayAr: "الأحد", dayOfWeek: 0 },
  { dayEn: "Monday", dayAr: "الاثنين", dayOfWeek: 1 },
  { dayEn: "Tuesday", dayAr: "الثلاثاء", dayOfWeek: 2 },
  { dayEn: "Wednesday", dayAr: "الأربعاء", dayOfWeek: 3 },
  { dayEn: "Thursday", dayAr: "الخميس", dayOfWeek: 4 },
  { dayEn: "Friday", dayAr: "الجمعة", dayOfWeek: 5 },
];

export default function DoctorSchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<{ id: string; name: string; specialty: string | null } | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Selected Day (defaults to Today's day name)
  const todayDayOfWeek = new Date().getDay();
  const initialDayObj = WEEK_DAYS.find((d) => d.dayOfWeek === todayDayOfWeek) || WEEK_DAYS[0];
  const [selectedDay, setSelectedDay] = useState<string>(initialDayObj.dayEn);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Blocked slots local state (for doctor breaks)
  const [blockedSlotTimes, setBlockedSlotTimes] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Load doctor profile & schedules
        const profRes = await fetch("/api/doctor/profile", { cache: "no-store" });
        const profData = await profRes.json();

        if (profData.success && profData.user) {
          setDoctor(profData.user);
          setSchedules(profData.schedules || []);
        }

        // Load appointments
        const aptRes = await fetch("/api/appointments", { cache: "no-store" });
        const aptData = await aptRes.json();
        if (aptData.success && Array.isArray(aptData.data)) {
          setAppointments(aptData.data);
        }
      } catch (e) {
        console.error("Failed to load doctor schedule data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute dynamic slots for the selected day based on real schedule
  const activeDayObj = WEEK_DAYS.find((d) => d.dayEn === selectedDay) || WEEK_DAYS[0];
  const activeDaySchedule = schedules.find(
    (s) => s.day_of_week === activeDayObj.dayOfWeek && s.is_active
  );

  const dynamicSlots: GeneratedSlot[] = useMemo(() => {
    if (!activeDaySchedule || !doctor) return [];

    const slotDuration = activeDaySchedule.slot_duration || 30;
    const [startH, startM] = activeDaySchedule.start_time.split(":").map(Number);
    const [endH, endM] = activeDaySchedule.end_time.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slotsList: GeneratedSlot[] = [];

    for (let current = startMinutes; current + slotDuration <= endMinutes; current += slotDuration) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const time24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      // Convert to 12h format
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const time12 = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;

      // Check if blocked by doctor
      const isBlocked = blockedSlotTimes.includes(`${selectedDay}-${time24}`);

      // Check if booked in real appointments
      const matchedApt = appointments.find((apt) => {
        // match time or date
        return apt.time?.includes(time12) || apt.rawDate?.includes(time24);
      });

      if (matchedApt) {
        slotsList.push({
          id: `slot-${selectedDay}-${time24}`,
          time: time12,
          time24,
          doctorName: doctor.name,
          doctorId: doctor.id,
          status: "BOOKED",
          patientName: matchedApt.patientName,
          patientPhone: matchedApt.patientPhone,
          appointmentType: matchedApt.type,
          fee: matchedApt.fee,
          notes: matchedApt.notes,
        });
      } else if (isBlocked) {
        slotsList.push({
          id: `slot-${selectedDay}-${time24}`,
          time: time12,
          time24,
          doctorName: doctor.name,
          doctorId: doctor.id,
          status: "BLOCKED",
          notes: isRTL ? "استراحة الطبيب" : "Doctor break",
        });
      } else {
        slotsList.push({
          id: `slot-${selectedDay}-${time24}`,
          time: time12,
          time24,
          doctorName: doctor.name,
          doctorId: doctor.id,
          status: "AVAILABLE",
        });
      }
    }

    return slotsList;
  }, [activeDaySchedule, doctor, selectedDay, blockedSlotTimes, appointments, isRTL]);

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return dynamicSlots.filter((slot) => {
      if (statusFilter !== "all" && slot.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchPatient = slot.patientName?.toLowerCase().includes(q);
        const matchTime = slot.time.toLowerCase().includes(q);
        const matchType = slot.appointmentType?.toLowerCase().includes(q);
        if (!matchPatient && !matchTime && !matchType) {
          return false;
        }
      }
      return true;
    });
  }, [dynamicSlots, statusFilter, search]);

  const dayStats = useMemo(() => {
    const total = dynamicSlots.length;
    const booked = dynamicSlots.filter((s) => s.status === "BOOKED").length;
    const available = dynamicSlots.filter((s) => s.status === "AVAILABLE").length;
    const blocked = dynamicSlots.filter((s) => s.status === "BLOCKED").length;
    const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { total, booked, available, blocked, occupancyRate };
  }, [dynamicSlots]);

  const handleToggleBlockSlot = (slotTime24: string) => {
    const key = `${selectedDay}-${slotTime24}`;
    setBlockedSlotTimes((prev) => {
      if (prev.includes(key)) {
        toast.success(isRTL ? "تم فتح الفترة وإتاحتها للسكرتيرة" : "Slot reopened for booking");
        return prev.filter((k) => k !== key);
      } else {
        toast.warning(isRTL ? "تم حجب الفترة (استراحة طبيب)" : "Slot blocked for doctor break");
        return [...prev, key];
      }
    });
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-2">
            <Calendar size={13} />
            <span>{isRTL ? "الجدول السريري وفترات الكشوفات" : "Clinical Timetable & Slot Schedule"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "جدول كشوفات الطبيب" : "Physician Clinical Timetable"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-2xl">
            {isRTL
              ? "متابعة فترات العمل، المواعيد المتاحة والمحجوزة، والتحكم في فترات الاستراحة"
              : "Review consultation shifts, open slots for reception, and block doctor break periods"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto shrink-0">
          <button
            onClick={handlePrintSchedule}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">{isRTL ? "طباعة" : "Print"}</span>
          </button>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="h-10 px-4 rounded-xl bg-[#1A4B8C] hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/15 cursor-pointer active:scale-95"
          >
            <UserPlus size={15} />
            <span>{isRTL ? "حجز كشف جديد عبر الاستقبال" : "Book via Secretary"}</span>
          </Link>
        </div>
      </div>

      {/* ━━━ 2. SECRETARY WORKFLOW BANNER ━━━ */}
      <div className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-blue-500/10 border border-blue-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A4B8C] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Stethoscope size={20} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isRTL
                ? `الطبيب المعالج: د. ${doctor?.name || "..."} (${doctor?.specialty || "عيادة DOCTECH"})`
                : `Attending Physician: Dr. ${doctor?.name || "..."} (${doctor?.specialty || "Practice Lead"})`}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isRTL
                ? "يتم حجز المواعيد والكشوفات بواسطة السكرتيرة من مكتب الاستقبال، وتظهر هنا فورياً."
                : "Appointments are scheduled via the reception desk by the clinic secretary."}
            </p>
          </div>
        </div>

        <Link
          href={`/${locale}/secretary/appointments/new`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1A4B8C] hover:bg-blue-800 shadow-sm transition-all shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <span>{isRTL ? "الانتقال لشاشة حجز الاستقبال" : "Go to Secretary Booking"}</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* ━━━ 3. DAY SELECTOR TABS ━━━ */}
      <div className="bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isRTL ? "اختر يوم الأسبوع لعرض الفترات الزمنية:" : "Select Day of Week:"}
          </span>
          <Link
            href={`/${locale}/doctor/profile`}
            className="text-xs font-semibold text-[#1A4B8C] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>{isRTL ? "تعديل ساعات العمل" : "Configure Hours"}</span>
            <Settings size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {WEEK_DAYS.map(({ dayEn, dayAr, dayOfWeek }) => {
            const hasShift = schedules.some((s) => s.day_of_week === dayOfWeek && s.is_active);
            const isSelected = selectedDay === dayEn;

            return (
              <button
                key={dayEn}
                type="button"
                onClick={() => setSelectedDay(dayEn)}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? "bg-[#1A4B8C] text-white shadow-md shadow-blue-900/20 scale-102"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                <span>{isRTL ? dayAr : dayEn}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : hasShift
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-200/60 dark:bg-slate-700/60 text-slate-400"
                  }`}
                >
                  {hasShift ? (isRTL ? "وردية عمل" : "Active Shift") : (isRTL ? "عطلة" : "Off")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ━━━ 4. DAY METRICS ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? "إجمالي الفترات" : "Total Slots"}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{dayStats.total}</p>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{isRTL ? "متاحة للحجز" : "Open Slots"}</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{dayStats.available}</p>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{isRTL ? "حالات محجوزة" : "Booked Visits"}</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{dayStats.booked}</p>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{isRTL ? "استراحات محجوبة" : "Blocked Breaks"}</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{dayStats.blocked}</p>
        </div>

        <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? "نسبة الإشغال" : "Occupancy Rate"}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{dayStats.occupancyRate}%</p>
        </div>
      </div>

      {/* ━━━ 5. SLOTS GRID OR NO-SHIFT NOTICE ━━━ */}
      {!activeDaySchedule ? (
        <div className="bg-white dark:bg-[#131E2E] p-12 sm:p-16 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Clock size={28} />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isRTL ? `لا توجد وردية عمل مسجلة ليوم (${activeDayObj.dayAr})` : `No working shift scheduled on ${selectedDay}`}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            {isRTL
              ? "يمكنك تفعيل هذا اليوم وتحديد مواعيد البداية والنهاية من صفحة الملف الشخصي للطبيب."
              : "You can configure your working days and shift times from your profile settings."}
          </p>
          <Link
            href={`/${locale}/doctor/profile`}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1A4B8C] hover:bg-blue-800 transition-colors"
          >
            <Settings size={14} />
            <span>{isRTL ? "تعديل جدول العمل" : "Manage Working Days"}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-[#1A4B8C] dark:text-blue-400" />
              <span>
                {isRTL
                  ? `فترات كشوفات يوم (${activeDayObj.dayAr}) — دوام ${activeDaySchedule.start_time} إلى ${activeDaySchedule.end_time}`
                  : `${selectedDay.toUpperCase()} CLINICAL SLOTS — Shift: ${activeDaySchedule.start_time} to ${activeDaySchedule.end_time}`}
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {filteredSlots.length} {isRTL ? "فترة" : "slots"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredSlots.map((slot) => {
              const isBooked = slot.status === "BOOKED";
              const isBlocked = slot.status === "BLOCKED";

              return (
                <div
                  key={slot.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isBooked
                      ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 shadow-xs"
                      : isBlocked
                      ? "bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75"
                      : "bg-white dark:bg-[#131E2E] border-emerald-200/80 dark:border-emerald-950 hover:border-emerald-400 dark:hover:border-emerald-800 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Time Badge */}
                      <div
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black shrink-0 ${
                          isBooked
                            ? "bg-[#1A4B8C] text-white"
                            : isBlocked
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {slot.time}
                      </div>

                      {/* Status Tag & Patient or Open info */}
                      <div>
                        {isBooked ? (
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {slot.patientName}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {slot.appointmentType || "Consultation"} {slot.fee ? `• ${slot.fee} EGP` : ""}
                            </p>
                          </div>
                        ) : isBlocked ? (
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                              {isRTL ? "فترة استراحة محجوبة" : "Blocked Clinical Break"}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {isRTL ? "غير متاحة لحجوزات الاستقبال" : "Not open for secretary booking"}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              {isRTL ? "متاح للحجز (OPEN)" : "OPEN FOR BOOKING"}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {isRTL ? "جاهز لاستقبال حجز من السكرتيرة" : "Available for secretary to book"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      {doctor?.name || ""}
                    </span>
                  </div>

                  {/* Slot Footer Controls */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-medium">
                      ⏱ {activeDaySchedule.slot_duration} mins
                    </span>

                    {!isBooked && (
                      <button
                        type="button"
                        onClick={() => handleToggleBlockSlot(slot.time24)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <Lock size={12} />
                        <span>{isBlocked ? (isRTL ? "إلغاء الحجب" : "Unblock") : (isRTL ? "حجب كاستراحة" : "Block as Break")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
