"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bell, CalendarCheck, FileText, MessageCircle, ShieldCheck, Check } from "lucide-react";

export default function DoctorNotificationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [items, setItems] = useState([
    { id: "1", title: "Urgent Patient Report Triaged", desc: "Patient Kareem Tarek submitted a high fever report requiring review.", time: "15 mins ago", icon: FileText, unread: true, color: "text-red-600 bg-red-50" },
    { id: "2", title: "New Appointment Booked", desc: "Secretary booked follow-up consultation for Ahmed Hassan at 09:00 AM.", time: "1 hour ago", icon: CalendarCheck, unread: true, color: "text-blue-600 bg-blue-50" },
    { id: "3", title: "WhatsApp Message Received", desc: "Nouran Mahmoud sent lab report image via clinic WhatsApp number.", time: "2 hours ago", icon: MessageCircle, unread: false, color: "text-emerald-600 bg-emerald-50" },
    { id: "4", title: "System Security Health Check", desc: "All patient database records backed up and encrypted successfully.", time: "Yesterday", icon: ShieldCheck, unread: false, color: "text-slate-600 bg-slate-100" },
  ]);

  const markAllRead = () => {
    setItems(items.map((i) => ({ ...i, unread: false })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-1.5">
            <Bell size={13} />
            {isRTL ? "مركز التنبيهات السريرية" : "Clinical Activity & Notification Feed"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة التحديثات اللحظية للمرضى والمواعيد والتقارير"
              : "Live updates regarding incoming cases, triage alerts, and reception activities"}
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A4B8C] bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Check size={14} />
          <span>{isRTL ? "تحديد الكل كمقروء" : "Mark all as read"}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                item.unread ? "bg-blue-50/25" : "hover:bg-slate-50"
              }`}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">{item.time}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}