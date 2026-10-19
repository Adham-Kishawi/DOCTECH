"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShiftUI {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  shiftName: string | null;
  isActive: boolean;
}

interface DaySchedule {
  dayOfWeek: number;
  nameEn: string;
  nameAr: string;
  shifts: ShiftUI[];
}

const DAYS: Omit<DaySchedule, "shifts">[] = [
  { dayOfWeek: 0, nameEn: "Sunday", nameAr: "الأحد" },
  { dayOfWeek: 1, nameEn: "Monday", nameAr: "الاثنين" },
  { dayOfWeek: 2, nameEn: "Tuesday", nameAr: "الثلاثاء" },
  { dayOfWeek: 3, nameEn: "Wednesday", nameAr: "الأربعاء" },
  { dayOfWeek: 4, nameEn: "Thursday", nameAr: "الخميس" },
  { dayOfWeek: 5, nameEn: "Friday", nameAr: "الجمعة" },
  { dayOfWeek: 6, nameEn: "Saturday", nameAr: "السبت" },
];

const EMPTY_DAYS: DaySchedule[] = DAYS.map((day) => ({
  ...day,
  shifts: [{ dayOfWeek: day.dayOfWeek, startTime: "09:00", endTime: "17:00", slotDuration: 30, shiftName: null, isActive: true }],
}));

type BusyKey = `add:${number}` | `del:${string}` | `put:${string}`;

export default function DoctorScheduleSettingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [schedules, setSchedules] = useState<DaySchedule[]>(EMPTY_DAYS);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<BusyKey | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/doctor/shifts")
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        const rows: Record<string, unknown>[] = Array.isArray(res?.data) ? res.data : [];
        const grouped = DAYS.map((day) => {
          const dayShifts: ShiftUI[] = rows
            .filter((s) => s.dayOfWeek === day.dayOfWeek)
            .map((s) => ({
              id: s.id as string | undefined,
              dayOfWeek: s.dayOfWeek as number,
              startTime: s.startTime as string,
              endTime: s.endTime as string,
              slotDuration: (s.slotDuration as number) ?? 30,
              shiftName: (s.shiftName as string | null) ?? null,
              isActive: (s.isActive as boolean) !== false,
            }));
          return {
            ...day,
            shifts: dayShifts.length > 0
              ? dayShifts
              : [{ dayOfWeek: day.dayOfWeek, startTime: "09:00", endTime: "17:00", slotDuration: 30, shiftName: null, isActive: false }],
          };
        });
        setSchedules(grouped);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        toast.error(isRTL ? "تعذر تحميل إعدادات الورديات" : "Failed to load shift settings");
        setLoaded(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchShifts = (dayOfWeek: number, updater: (prev: ShiftUI[]) => ShiftUI[]) => {
    setSchedules((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, shifts: updater(d.shifts) } : d)));
  };

  const run = async (key: BusyKey, action: () => Promise<Response>) => {
    setBusy(key);
    try {
      const res = await action();
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { message?: string }).message || (isRTL ? "فشلت العملية" : "Operation failed"));
        return false;
      }
      return true;
    } catch {
      toast.error(isRTL ? "تعذر الاتصال بالخادم" : "Network error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const addShift = async (dayOfWeek: number) => {
    const day = schedules.find((d) => d.dayOfWeek === dayOfWeek)!;
    const startTime = "09:00";
    const toMinutes = (t: string) => Number(t.split(":")[0]) * 60 + Number(t.split(":")[1]);
    const latest = day.shifts.reduce((max, s) => Math.max(max, toMinutes(s.endTime)), toMinutes("09:00"));
    const endMinutes = Math.min(latest + 120, 23 * 60);
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    setBusy(`add:${dayOfWeek}`);
    try {
      const res = await fetch("/api/doctor/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, startTime, endTime, slotDuration: 30, isActive: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { message?: string }).message || (isRTL ? "فشلت العملية" : "Operation failed"));
        return;
      }
      const created = (json as { data?: Record<string, unknown> }).data;
      if (created) {
        patchShifts(dayOfWeek, (prev) => [
          ...prev,
          {
            id: created.id as string,
            dayOfWeek: created.dayOfWeek as number,
            startTime: created.startTime as string,
            endTime: created.endTime as string,
            slotDuration: (created.slotDuration as number) ?? 30,
            shiftName: (created.shiftName as string | null) ?? null,
            isActive: (created.isActive as boolean) !== false,
          },
        ]);
      }
      toast.success(isRTL ? "تمت إضافة الوردية" : "Shift added");
    } catch {
      toast.error(isRTL ? "تعذر الاتصال بالخادم" : "Network error");
    } finally {
      setBusy(null);
    }
  };

  const updateShift = async (shift: ShiftUI, patch: Partial<ShiftUI>) => {
    const next = { ...shift, ...patch };
    patchShifts(shift.dayOfWeek, (prev) => prev.map((s) => (s.id === shift.id ? next : s)));
    if (!shift.id) return;
    const body: Record<string, unknown> = { id: shift.id };
    if (patch.startTime !== undefined) body.startTime = patch.startTime;
    if (patch.endTime !== undefined) body.endTime = patch.endTime;
    if (patch.slotDuration !== undefined) body.slotDuration = patch.slotDuration;
    if (patch.isActive !== undefined) body.isActive = patch.isActive;
    const ok = await run(`put:${shift.id}`, () =>
      fetch("/api/doctor/shifts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    );
    if (!ok) patchShifts(shift.dayOfWeek, (prev) => prev.map((s) => (s.id === shift.id ? shift : s)));
  };

  const deleteShift = async (shift: ShiftUI) => {
    if (!shift.id) {
      patchShifts(shift.dayOfWeek, (prev) => prev.filter((s) => s.id !== shift.id));
      return;
    }
    const ok = await run(`del:${shift.id}`, () => fetch(`/api/doctor/shifts?id=${shift.id}`, { method: "DELETE" }));
    if (ok) {
      patchShifts(shift.dayOfWeek, (prev) => prev.filter((s) => s.id !== shift.id));
      toast.success(isRTL ? "تم حذف الوردية" : "Shift deleted");
    }
  };

  const dayIsActive = (day: DaySchedule) => day.shifts.some((s) => s.isActive);

  const toggleDay = async (day: DaySchedule) => {
    const turnOn = !dayIsActive(day);
    if (turnOn) {
      const activeShifts = day.shifts.filter((s) => s.isActive);
      if (activeShifts.length === 0) {
        await Promise.all(
          day.shifts.length > 0
            ? day.shifts.map((s, i) => updateShift(s, { isActive: i === 0 }))
            : [addShift(day.dayOfWeek)]
        );
      }
      return;
    }
    await Promise.all(day.shifts.map((s) => updateShift(s, { isActive: false })));
  };

  const okLabel = schedules.filter((d) => d.shifts.some((s) => s.isActive)).length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/doctor/schedule`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى جدول الكشوفات" : "Back to Clinical Timetable"}</span>
      </Link>

      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <Clock size={13} />
            <span>{isRTL ? "إعدادات الورديات وفترات الحجز" : "Shifts & Booking Slots"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "تحديد مواعيد العمل ومدد الكشف" : "Doctor Working Hours & Slot Duration"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "كل تغيير يُحفظ مباشرةً، ولا تُصدَر فترات حجز من ورديات غير منشطة"
              : "Every change saves immediately; inactive shifts generate no slots"}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-300">
          <Calendar size={14} />
          <span>{isRTL ? `ورديات نشطة: ${okLabel}` : `Active days: ${okLabel}`}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {!loaded && (
          <div className="p-10 flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            {isRTL ? "جارٍ التحميل..." : "Loading..."}
          </div>
        )}

        {loaded &&
          schedules.map((sched) => {
            const isActive = dayIsActive(sched);
            return (
              <div
                key={sched.dayOfWeek}
                className={`p-4 sm:p-5 transition-colors ${
                  isActive ? "hover:bg-slate-50/70 dark:hover:bg-slate-800/40" : "bg-slate-50/50 dark:bg-slate-900/40 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-[170px]">
                    <button
                      onClick={() => toggleDay(sched)}
                      disabled={busy !== null}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out relative flex items-center p-0.5 shrink-0 cursor-pointer disabled:opacity-50 ${
                        isActive ? "bg-[#1A4B8C] dark:bg-blue-600 shadow-sm shadow-blue-600/30" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                      aria-label={isRTL ? "تفعيل اليوم" : "Toggle day"}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                          isActive ? (isRTL ? "-translate-x-5" : "translate-x-5") : "translate-x-0"
                        }`}
                      >
                        {isActive && <Check size={11} className="text-[#1A4B8C] dark:text-blue-600 stroke-[3] m-auto mt-[3px]" />}
                      </div>
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isRTL ? sched.nameAr : sched.nameEn}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400">
                        {isActive ? (isRTL ? "يوم عمل نشط" : "Working Day") : (isRTL ? "يوم عطلة" : "Day Off")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addShift(sched.dayOfWeek)}
                    disabled={!isActive || busy !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-[#1A4B8C] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy === `add:${sched.dayOfWeek}` ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    <span>{isRTL ? "أضف وردية" : "Add shift"}</span>
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {sched.shifts.map((shift) => (
                    <div key={shift.id ?? `local:${shift.startTime}:${shift.dayOfWeek}`} className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400">{isRTL ? "من" : "From"}:</span>
                        <input
                          type="time"
                          value={shift.startTime}
                          disabled={!isActive || busy !== null}
                          onChange={(e) => updateShift(shift, { startTime: e.target.value })}
                          className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400">{isRTL ? "إلى" : "To"}:</span>
                        <input
                          type="time"
                          value={shift.endTime}
                          disabled={!isActive || busy !== null}
                          onChange={(e) => updateShift(shift, { endTime: e.target.value })}
                          className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400">{isRTL ? "مدة الكشف" : "Slot"}:</span>
                        <select
                          value={shift.slotDuration}
                          disabled={!isActive || busy !== null}
                          onChange={(e) => updateShift(shift, { slotDuration: Number(e.target.value) })}
                          className="h-8 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-50 cursor-pointer"
                        >
                          <option value={15}>{isRTL ? "١٥ دقيقة" : "15 mins"}</option>
                          <option value={20}>{isRTL ? "٢٠ دقيقة" : "20 mins"}</option>
                          <option value={30}>{isRTL ? "٣٠ دقيقة" : "30 mins"}</option>
                          <option value={45}>{isRTL ? "٤٥ دقيقة" : "45 mins"}</option>
                          <option value={60}>{isRTL ? "٦٠ دقيقة" : "60 mins"}</option>
                        </select>
                      </div>
                      <button
                        onClick={() => deleteShift(shift)}
                        disabled={busy !== null}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-40"
                        aria-label={isRTL ? "حذف الوردية" : "Delete shift"}
                      >
                        {busy === `del:${shift.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                      {busy === `put:${shift.id}` && <Loader2 size={14} className="animate-spin text-blue-500" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}