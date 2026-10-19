"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, Calendar, Bot, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { WhatsAppConversationItem, WhatsAppThreadMessage } from "@/types/index";

export default function SecretaryWhatsAppChatRoomPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [conversation, setConversation] = useState<WhatsAppConversationItem | null>(null);
  const [messages, setMessages] = useState<WhatsAppThreadMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/whatsapp/conversations/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}) as Record<string, unknown>);
        if (cancelled) return;
        if (!res.ok || !json.success) {
          throw new Error(typeof json.error === "string" ? json.error : "Failed to load thread");
        }
        const data = json.data as {
          conversation: WhatsAppConversationItem;
          messages: WhatsAppThreadMessage[];
        };
        setConversation(data.conversation);
        setMessages(data.messages ?? []);
        setLoadError("");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load thread");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const formatTime = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const displayName =
    conversation?.patientName || conversation?.patientPhone || (isRTL ? "مريض" : "Patient");
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !conversation) return;

    setSending(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Send failed");
      }

      const sent = json.data as WhatsAppThreadMessage;
      setMessages((prev) => [...prev, sent]);
      setInputText("");
      toast.success(isRTL ? "تم إرسال رسالة الواتساب بنجاح!" : "WhatsApp message delivered!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      toast.error(message);
    } finally {
      setSending(false);
    }
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

      {/* Conversation header */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center border border-emerald-100 dark:border-emerald-900 shrink-0">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium" dir="ltr">
              {conversation?.patientPhone || conversation?.waId || ""}
              {conversation && conversation.status !== "OPEN" ? ` • ${conversation.status}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
          {loading ? (
            <p className="text-center text-xs text-slate-400 font-medium">
              {isRTL ? "جارِ تحميل المحادثة..." : "Loading thread..."}
            </p>
          ) : loadError ? (
            <div className="text-center space-y-3 pt-8">
              <p className="text-xs text-rose-600 font-bold">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 font-medium pt-8">
              {isRTL
                ? "لا توجد رسائل في هذه المحادثة بعد."
                : "No messages in this conversation yet."}
            </p>
          ) : (
            messages.map((msg) => {
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
                        <Bot size={11} /> {isRTL ? "الرد الآلي" : "Automated Assistant"}
                      </span>
                    )}
                    {isClinic && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <UserCheck size={11} /> {isRTL ? "فريق الاستقبال" : "Clinic Reception"}
                      </span>
                    )}
                    {!isOutgoing && <span>{displayName}</span>}
                    <span>•</span>
                    <span>{formatTime(msg.sentAt)}</span>
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
                    {msg.content}
                    {msg.status === "FAILED" && (
                      <span className="block mt-1.5 text-[10px] font-bold text-rose-200 uppercase">
                        {isRTL ? "فشل الإرسال" : "Failed to deliver"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              isRTL ? "اكتب رسالة واتساب للرد على المريض يدويًا..." : "Type manual WhatsApp response to patient..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading || Boolean(loadError) || sending}
            className="flex-1 h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="h-11 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
