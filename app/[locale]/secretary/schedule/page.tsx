"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Plus } from "lucide-react";

export default function SecretarySchedulePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [selectedDay, setSelectedDay] = useState("Sunday");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-[#0891B2] border border-cyan-200 mb-1.5">
            <Calendar size={13} />
            {isRTL ? "إدارة جدول كشوفات العيادة" : "Clinic Master Schedule"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "جدول الحجوزات والمواعيد" : "Master Schedule Desk"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة وتخصيص الفترات الشاغرة وحجز المرضى"
              : "Organize doctor consultation hours, book slots, and avoid double booking"}
          </p>
        </div>

        <Link
          href={`/${locale}/secretary/appointments/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-md shadow-cyan-900/15 transition-all"
        >
          <Plus size={15} />
          <span>{isRTL ? "حجز كشف جديد" : "Book New Slot"}</span>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-center transition-all cursor-pointer ${
                selectedDay === day
                  ? "bg-[#0891B2] text-white font-bold shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
              }`}
            >
              <p className="text-xs">{day}</p>
              <p className="text-[10px] opacity-80 mt-0.5">6 Booked • 4 Free</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
