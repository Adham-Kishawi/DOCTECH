"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Clock } from "lucide-react";

interface Slot {
  id: string;
  time: string;
  patient?: string;
  patientAr?: string;
  type?: string;
  typeAr?: string;
  isBooked: boolean;
}

const days = [
  { en: "Sunday", ar: "الأحد" },
  { en: "Monday", ar: "الاثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
];

export default function DoctorSchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [selectedDay, setSelectedDay] = useState("Sunday");

  const slots: Slot[] = [
    { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", patientAr: "أحمد حسن", type: "Follow-up Check", typeAr: "متابعة", isBooked: true },
    { id: "2", time: "09:30 AM", patient: "Omar Farouk", patientAr: "عمر فاروق", type: "Lab Consultation", typeAr: "استشارة تحاليل", isBooked: true },
    { id: "3", time: "10:00 AM", isBooked: false },
    { id: "4", time: "10:30 AM", patient: "Sara Ibrahim", patientAr: "سارة إبراهيم", type: "New Patient Consultation", typeAr: "كشف مريض جديد", isBooked: true },
    { id: "5", time: "11:00 AM", patient: "Mohamed Ali", patientAr: "محمد علي", type: "Post-Op Wound Check", typeAr: "فحص جرح بعد العملية", isBooked: true },
    { id: "6", time: "11:30 AM", isBooked: false },
    { id: "7", time: "12:00 PM", isBooked: false },
    { id: "8", time: "01:00 PM", patient: "Fatima Omar", patientAr: "فاطمة عمر", type: "Prescription Renewal", typeAr: "تجديد روشتة", isBooked: true },
    { id: "9", time: "01:30 PM", patient: "Nouran Mahmoud", patientAr: "نوران محمود", type: "Diabetes Follow-up", typeAr: "متابعة سكر", isBooked: true },
    { id: "10", time: "02:00 PM", isBooked: false },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 border border-blue-100 dark:border-blue-900 mb-1.5">
            <Calendar size={13} />
            {isRTL ? "الجدول الأسبوعي والورديات" : "Weekly Schedule & Shift Matrix"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "جدول كشوفات الطبيب" : "Doctor Clinical Timetable"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "استعراض فترات العمل والمواعيد المحجوزة والمتاحة لكل يوم"
              : "Review booked consultation slots, open availability & shift hours"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/${locale}/doctor/schedule/settings`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
          >
            <Clock size={14} className="text-[#1A4B8C] dark:text-blue-400" />
            <span>{isRTL ? "تعديل المواعيد والمدد" : "Configure Hours & Slots"}</span>
          </Link>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
            <Clock size={14} className="text-[#1A4B8C] dark:text-blue-400" />
            <span>09:00 AM - 05:00 PM</span>
          </div>
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-[#131E2E] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {days.map((day) => (
          <button
            key={day.en}
            onClick={() => setSelectedDay(day.en)}
            className={`flex-1 min-w-[90px] sm:min-w-[120px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-center transition-all cursor-pointer ${
              selectedDay === day.en
                ? "bg-[#1A4B8C] text-white font-bold shadow-sm"
                : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            }`}
          >
            <p className="text-xs">{isRTL ? day.ar : day.en}</p>
            <p className="text-[10px] opacity-80 mt-0.5">
              {isRTL ? "٦ محجوز • ٤ متاح" : "6 Booked • 4 Free"}
            </p>
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isRTL
              ? `مواعيد يوم: ${days.find(d => d.en === selectedDay)?.ar || selectedDay}`
              : `${selectedDay} Schedule Slots`}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">
            {isRTL ? "فترات ٣٠ دقيقة" : "30 Mins Consultation Slots"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-6">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                slot.isBooked
                  ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 hover:border-[#1A4B8C]"
                  : "bg-emerald-50/20 dark:bg-emerald-950/10 border-dashed border-emerald-300/80 dark:border-emerald-800/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
              }`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-mono text-[10px] sm:text-xs font-extrabold shrink-0 ${
                    slot.isBooked
                      ? "bg-[#1A4B8C] text-white shadow-xs"
                      : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-400"
                  }`}
                >
                  {slot.time.split(" ")[0]}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {slot.time}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        slot.isBooked
                          ? "bg-blue-100 dark:bg-blue-900/40 text-[#1A4B8C] dark:text-blue-400"
                          : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {slot.isBooked ? (isRTL ? "محجوز" : "Booked") : (isRTL ? "متاح" : "Available")}
                    </span>
                  </div>

                  {slot.isBooked ? (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {isRTL ? slot.patientAr : slot.patient}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {isRTL ? slot.typeAr : slot.type}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
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
}
