"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface DaySchedule {
  dayOfWeek: number;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const initialSchedule: DaySchedule[] = [
  { dayOfWeek: 0, nameEn: "Sunday", nameAr: "الأحد", isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { dayOfWeek: 1, nameEn: "Monday", nameAr: "الاثنين", isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { dayOfWeek: 2, nameEn: "Tuesday", nameAr: "الثلاثاء", isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { dayOfWeek: 3, nameEn: "Wednesday", nameAr: "الأربعاء", isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
  { dayOfWeek: 4, nameEn: "Thursday", nameAr: "الخميس", isActive: true, startTime: "09:00", endTime: "15:00", slotDuration: 30 },
  { dayOfWeek: 5, nameEn: "Friday", nameAr: "الجمعة", isActive: false, startTime: "10:00", endTime: "14:00", slotDuration: 30 },
  { dayOfWeek: 6, nameEn: "Saturday", nameAr: "السبت", isActive: false, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
];

export default function DoctorScheduleSettingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [schedules, setSchedules] = useState<DaySchedule[]>(initialSchedule);
  const [saving, setSaving] = useState(false);

  const handleToggleDay = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((s, idx) => (idx === dayIndex ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleTimeChange = (dayIndex: number, field: "startTime" | "endTime" | "slotDuration", value: string | number) => {
    setSchedules((prev) =>
      prev.map((s, idx) => (idx === dayIndex ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(
        isRTL
          ? "✅ تم حفظ وتحديث جدول الورديات وفترات الحجز بنجاح!"
          : "✅ Working hours & appointment slot durations updated successfully!"
      );
    }, 400);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/doctor/schedule`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى جدول الكشوفات" : "Back to Clinical Timetable"}</span>
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <Clock size={13} />
            <span>{isRTL ? "إعدادات فترات العمل والحجز" : "Consultation Slots & Shifts Configuration"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "تحديد مواعيد العمل ومدد الكشف" : "Doctor Working Hours & Slot Duration"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "يحدد النظام فترات الحجز المتاحة تلقائيًا بناءً على هذه الإعدادات لمنع الازدواجية"
              : "System calculates available booking slots automatically based on these parameters"}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold shadow-md shadow-blue-900/15 transition-all cursor-pointer"
        >
          <Save size={15} />
          <span>{saving ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التغييرات" : "Save Settings")}</span>
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {schedules.map((sched, idx) => (
          <div
            key={sched.dayOfWeek}
            className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              sched.isActive ? "hover:bg-slate-50/70 dark:hover:bg-slate-800/40" : "bg-slate-50/50 dark:bg-slate-900/40 opacity-70"
            }`}
          >
            {/* Day name & toggle */}
            <div className="flex items-center gap-3 min-w-[150px]">
              <input
                type="checkbox"
                checked={sched.isActive}
                onChange={() => handleToggleDay(idx)}
                className="w-4 h-4 text-[#1A4B8C] rounded cursor-pointer"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRTL ? sched.nameAr : sched.nameEn}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {sched.isActive ? (isRTL ? "يوم عمل نشط" : "Working Day") : (isRTL ? "يوم عطلة" : "Day Off")}
                </span>
              </div>
            </div>

            {/* Shift hours & Duration */}
            {sched.isActive ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400">{isRTL ? "من" : "From"}:</span>
                  <input
                    type="time"
                    value={sched.startTime}
                    onChange={(e) => handleTimeChange(idx, "startTime", e.target.value)}
                    className="h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400">{isRTL ? "إلى" : "To"}:</span>
                  <input
                    type="time"
                    value={sched.endTime}
                    onChange={(e) => handleTimeChange(idx, "endTime", e.target.value)}
                    className="h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400">{isRTL ? "مدة الكشف" : "Slot"}:</span>
                  <select
                    value={sched.slotDuration}
                    onChange={(e) => handleTimeChange(idx, "slotDuration", Number(e.target.value))}
                    className="h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value={15}>{isRTL ? "١٥ دقيقة" : "15 mins"}</option>
                    <option value={20}>{isRTL ? "٢٠ دقيقة" : "20 mins"}</option>
                    <option value={30}>{isRTL ? "٣٠ دقيقة" : "30 mins"}</option>
                    <option value={45}>{isRTL ? "٤٥ دقيقة" : "45 mins"}</option>
                    <option value={60}>{isRTL ? "٦٠ دقيقة" : "60 mins"}</option>
                  </select>
                </div>
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-400 italic">
                {isRTL ? "مغلق (لا توجد مواعيد متاحة)" : "Closed (No slots generated)"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
