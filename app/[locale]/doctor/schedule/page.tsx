"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, ChevronLeft, ChevronRight, User, Stethoscope, ShieldCheck } from "lucide-react";

interface Slot {
  id: string;
  time: string;
  patient?: string;
  type?: string;
  isBooked: boolean;
}

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export default function DoctorSchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [selectedDay, setSelectedDay] = useState("Sunday");

  const slots: Slot[] = [
    { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", type: "Follow-up Check", isBooked: true },
    { id: "2", time: "09:30 AM", patient: "Omar Farouk", type: "Lab Consultation", isBooked: true },
    { id: "3", time: "10:00 AM", isBooked: false },
    { id: "4", time: "10:30 AM", patient: "Sara Ibrahim", type: "New Patient Consultation", isBooked: true },
    { id: "5", time: "11:00 AM", patient: "Mohamed Ali", type: "Post-Op Wound Check", isBooked: true },
    { id: "6", time: "11:30 AM", isBooked: false },
    { id: "7", time: "12:00 PM", isBooked: false },
    { id: "8", time: "01:00 PM", patient: "Fatima Omar", type: "Prescription Renewal", isBooked: true },
    { id: "9", time: "01:30 PM", patient: "Nouran Mahmoud", type: "Diabetes Follow-up", isBooked: true },
    { id: "10", time: "02:00 PM", isBooked: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-1.5">
            <Calendar size={13} />
            {isRTL ? "الجدول الأسبوعي والورديات" : "Weekly Schedule & Shift Matrix"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "جدول كشوفات الطبيب" : "Doctor Clinical Timetable"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "استعراض فترات العمل والمواعيد المحجوزة والمتاحة لكل يوم"
              : "Review booked consultation slots, open availability & shift hours"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 p-1.5 rounded-xl">
            <Clock size={14} className="text-[#1A4B8C]" />
            <span>09:00 AM - 05:00 PM</span>
          </div>
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-center transition-all cursor-pointer ${
              selectedDay === day
                ? "bg-[#1A4B8C] text-white font-bold shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
            }`}
          >
            <p className="text-xs">{day}</p>
            <p className="text-[10px] opacity-80 mt-0.5">6 Booked • 4 Free</p>
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isRTL ? `مواعيد يوم: ${selectedDay}` : `${selectedDay} Schedule Slots`}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            30 Mins Consultation Slots
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                slot.isBooked
                  ? "bg-blue-50/40 border-blue-200/80 hover:border-[#1A4B8C]"
                  : "bg-emerald-50/20 border-dashed border-emerald-300/80 hover:bg-emerald-50/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xs font-extrabold shrink-0 ${
                    slot.isBooked
                      ? "bg-[#1A4B8C] text-white shadow-xs"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {slot.time.split(" ")[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {slot.time}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        slot.isBooked
                          ? "bg-blue-100 text-[#1A4B8C]"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {slot.isBooked ? (isRTL ? "محجوز" : "Booked") : (isRTL ? "متاح" : "Available")}
                    </span>
                  </div>

                  {slot.isBooked ? (
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-800">{slot.patient}</p>
                      <p className="text-[11px] text-slate-500">{slot.type}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
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