"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Calendar, Bot, Sparkles, UserCheck, Shield } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  from: "patient" | "clinic" | "ai";
  text: string;
  time: string;
}

export default function SecretaryWhatsAppChatRoomPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = (params?.id as string) || "1";

  const [aiEnabled, setAiEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", from: "ai", text: "أهلاً بك في العيادة 🩺 كيف يمكنني مساعدتك؟", time: "10:00 AM" },
    { id: "2", from: "patient", text: "مساء الخير، كنت عايز أعرف مواعيد كشف دكتور أحمد حسام وسعر الكشف كام؟", time: "10:02 AM" },
    { id: "3", from: "ai", text: "أهلاً بحضرتك 🩺 قيمة الكشف لأول مرة ٤٠٠ ج.م والمواعيد المتاحة اليوم:\n١. الساعة ١٠:٠٠ ص\n٢. الساعة ٠١:٣٠ م\nهل تحب أحجز لحضرتك؟", time: "10:03 AM" },
    { id: "4", from: "patient", text: "تمام، احجزلي الساعة ١٠:٠٠ صباحًا باسم أحمد حسن ورقمي مسجل عندكم.", time: "10:05 AM" },
    { id: "5", from: "ai", text: "تم تسجيل طلب حجز لحضرتك اليوم الساعة ١٠:٠٠ ص بنجاح! طلبك قيد المراجعة الآن من مكتب الاستقبال وسيصلك تأكيد نهائي خلال دقائق قليلة ✅", time: "10:06 AM" },
    { id: "6", from: "clinic", text: "مرحبًا أستاذ أحمد، تم اعتماد وتأكيد موعدك اليوم الساعة ١٠:٠٠ ص. بانتظار تشريفك بالعيادة.", time: "10:10 AM" },
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
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInputText("");
    toast.success(isRTL ? "تم إرسال رسالة الواتساب بنجاح!" : "WhatsApp message delivered!");
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/secretary/whatsapp`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى محادثات الواتساب" : "Back to WhatsApp Inbox"}</span>
      </Link>

      {/* Header with AI Takeover Toggle */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            AH
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Ahmed Hassan (أحمد حسن)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">+20 100 123 4567 • Patient #{id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* AI Auto-Reply Switch */}
          <button
            onClick={() => {
              setAiEnabled(!aiEnabled);
              toast.info(
                aiEnabled
                  ? (isRTL ? "تم إيقاف الرد التلقائي وتفعيل التحكم اليدوي" : "Auto-replies paused. Manual mode active.")
                  : (isRTL ? "تم تفعيل الرد التلقائي" : "Auto-replies enabled.")
              );
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              aiEnabled
                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Sparkles size={13} className={aiEnabled ? "text-purple-600 animate-pulse" : "text-slate-400"} />
            <span>{aiEnabled ? (isRTL ? "رد تلقائي" : "Auto Reply") : (isRTL ? "تحكم يدوي" : "Manual")}</span>
          </button>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 text-xs font-bold hover:bg-cyan-100 dark:hover:bg-cyan-950/70 transition-colors"
          >
            <Calendar size={13} />
            <span>{isRTL ? "حجز كشف" : "Book Visit"}</span>
          </Link>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px] overflow-hidden">
        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/40">
          {messages.map((msg) => {
            const isClinic = msg.from === "clinic";
            const isAI = msg.from === "ai";
            const isOutgoing = isClinic || isAI;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase mb-1">
                  {isAI && (
                    <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <Bot size={11} /> {isRTL ? "المساعد الذكي" : "Smart Assistant"}
                    </span>
                  )}
                  {isClinic && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <UserCheck size={11} /> {isRTL ? "الاستقبال (بشري)" : "Reception (Human)"}
                    </span>
                  )}
                  {!isOutgoing && <span>Ahmed Hassan</span>}
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>

                <div
                  className={`max-w-md p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs whitespace-pre-line ${
                    isAI
                      ? "bg-purple-600 text-white rounded-br-none"
                      : isClinic
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة واتساب للرد على المريض يدويًا..." : "Type manual WhatsApp response to patient..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="h-11 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
