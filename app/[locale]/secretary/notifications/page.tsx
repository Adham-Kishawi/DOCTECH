"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Bell, CalendarCheck, MessageCircle, FileText, Check } from "lucide-react";

export default function SecretaryNotificationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [items, setItems] = useState([
    { id: "1", title: "Doctor Reviewed Treatment Plan", desc: "Dr. Clinical Lead submitted decision for Patient Kareem Tarek. Ready to dispatch via WhatsApp.", time: "5 mins ago", icon: FileText, unread: true, color: "text-emerald-600 bg-emerald-50" },
    { id: "2", title: "New WhatsApp Inquiry", desc: "Nouran Mahmoud asked for glucose report review.", time: "45 mins ago", icon: MessageCircle, unread: true, color: "text-cyan-600 bg-cyan-50" },
    { id: "3", title: "Appointment Scheduled", desc: "Ahmed Hassan consultation confirmed for 09:00 AM.", time: "2 hours ago", icon: CalendarCheck, unread: false, color: "text-blue-600 bg-blue-50" },
  ]);

  const markAllRead = () => {
    setItems(items.map((i) => ({ ...i, unread: false })));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-[#0891B2] border border-cyan-200 mb-1.5">
            <Bell size={13} />
            {isRTL ? "مركز تنبيهات الاستقبال" : "Reception Operational Feed"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "متابعة قرارات الطبيب ورسائل الواتساب الواردة وحجوزات المواعيد"
              : "Live activity regarding doctor decisions, patient WhatsApp queries, and appointments"}
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0891B2] bg-cyan-50 hover:bg-cyan-100 transition-colors flex items-center gap-1.5 cursor-pointer"
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
                item.unread ? "bg-cyan-50/25" : "hover:bg-slate-50"
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