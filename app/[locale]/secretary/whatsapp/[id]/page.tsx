"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  from: "patient" | "clinic";
  text: string;
  time: string;
}

export default function SecretaryWhatsAppChatRoomPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "1";

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", from: "clinic", text: "Hello Ahmed! This is Al-Amal Clinic reminding you of your consultation tomorrow at 09:00 AM with Dr. Clinical Lead.", time: "10:00 AM" },
    { id: "2", from: "patient", text: "Thank you Sarah! I confirm my attendance. Should I come fasting?", time: "10:10 AM" },
    { id: "3", from: "clinic", text: "Yes please, fasting for 8 hours for routine blood work.", time: "10:12 AM" },
    { id: "4", from: "patient", text: "Understood, see you tomorrow at 09:00 AM.", time: "10:15 AM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        from: "clinic",
        text: inputText.trim(),
        time: "Just now",
      },
    ]);
    setInputText("");
    toast.success("WhatsApp message delivered!");
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/secretary/whatsapp`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى محادثات الواتساب" : "Back to WhatsApp Inbox"}</span>
      </Link>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 font-extrabold text-sm flex items-center justify-center border border-emerald-100">
            AH
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Ahmed Hassan</h1>
            <p className="text-xs text-slate-500 font-medium">+20 100 123 4567 • Patient #{id}</p>
          </div>
        </div>

        <Link
          href={`/${locale}/secretary/appointments/new`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 text-[#0891B2] text-xs font-bold hover:bg-cyan-100 transition-colors"
        >
          <Calendar size={13} />
          <span>Book Appointment</span>
        </Link>
      </div>

      {/* Chat Thread */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
          {messages.map((msg) => {
            const isClinic = msg.from === "clinic";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isClinic ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
                  <span>{isClinic ? "Al-Amal Clinic (You)" : "Ahmed Hassan"}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                    isClinic
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة واتساب..." : "Type WhatsApp reply..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
