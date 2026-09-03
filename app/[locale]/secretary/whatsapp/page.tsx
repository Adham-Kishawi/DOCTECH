"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, Search, ArrowRight, ExternalLink, Bot, Sparkles } from "lucide-react";
import { CLINIC_WHATSAPP } from "@/lib/whatsapp/config";

interface Conversation {
  id: string;
  patientName: string;
  phone: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

const chats: Conversation[] = [
  { id: "1", patientName: "Ahmed Hassan", phone: "+20 100 123 4567", lastMessage: "Thank you Sarah, see you tomorrow at 09:00 AM.", time: "10:15 AM", unreadCount: 0 },
  { id: "2", patientName: "Nouran Mahmoud", phone: "+20 102 345 6789", lastMessage: "Here is the glucose lab test image as requested.", time: "09:45 AM", unreadCount: 2 },
  { id: "3", patientName: "Kareem Tarek", phone: "+20 105 678 9012", lastMessage: "Did the doctor review my fever inquiry?", time: "08:30 AM", unreadCount: 1 },
  { id: "4", patientName: "Sara Ibrahim", phone: "+20 103 456 7890", lastMessage: "Can I reschedule my appointment to Thursday?", time: "Yesterday", unreadCount: 0 },
];

export default function SecretaryWhatsAppPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");

  const filtered = chats.filter(
    (c) => c.patientName.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Designated WhatsApp Number */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 mb-1.5">
            <MessageCircle size={13} />
            {isRTL ? "محادثات الواتساب الرسمية للعيادة" : "WhatsApp Business Cloud Integration"}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isRTL ? "محادثات الواتساب" : "WhatsApp Inquiries"}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {CLINIC_WHATSAPP.display}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "التواصل المباشر مع المرضى، تأكيد المواعيد، ومتابعة حجوزات المساعد الذكي"
              : "Live patient chat inbox powered by WhatsApp Business API"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={CLINIC_WHATSAPP.waMeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <MessageCircle size={14} />
            <span>{isRTL ? "فتح واتساب (01031445949)" : "Open WhatsApp"}</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <a
            href={`https://web.whatsapp.com/send?phone=${CLINIC_WHATSAPP.international}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isRTL ? "واتساب ويب" : "WhatsApp Web"}</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في المحادثات..." : "Search conversations..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((chat) => (
          <Link
            key={chat.id}
            href={`/${locale}/secretary/whatsapp/${chat.id}`}
            className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 border border-emerald-100">
                <MessageCircle size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {chat.patientName}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{chat.phone}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">
                  {chat.lastMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">{chat.time}</span>
              {chat.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              )}
              <ArrowRight size={15} className={`text-slate-300 group-hover:text-emerald-600 ${isRTL ? "rotate-180" : ""}`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
