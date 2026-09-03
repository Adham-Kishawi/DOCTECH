"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  doctor_id: string;
  secretary_id: string;
  content: string;
  sender_role: "doctor" | "secretary";
  is_read: boolean;
  sent_at: string;
}

const DOCTOR_ID = "doc-101";
const SECRETARY_ID = "sec-202";

export default function DoctorCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .eq("doctor_id", DOCTOR_ID)
        .eq("secretary_id", SECRETARY_ID)
        .order("sent_at", { ascending: true });

      if (error) {
        console.error("Failed to load messages:", error);
        setLoading(false);
        return;
      }

      setMessages(data ?? []);
      setLoading(false);
    };

    loadMessages();

    const channel = supabase
      .channel(`internal-messages-${DOCTOR_ID}-${SECRETARY_ID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
          filter: `doctor_id=eq.${DOCTOR_ID}`,
        },
        (payload) => {
          console.log("Realtime payload:", payload);

          const newMessage = payload.new as Message;

          if (newMessage.secretary_id !== SECRETARY_ID) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((message) => message.id === newMessage.id)) {
              return prev;
            }

            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status, err) => {
        console.log("Realtime status:", status);
        console.log("Realtime error:", err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = inputText.trim();

    if (!content || sending) return;

    setSending(true);

    const { data, error } = await supabase
      .from("internal_messages")
      .insert({
        doctor_id: DOCTOR_ID,
        secretary_id: SECRETARY_ID,
        content,
        sender_role: "doctor",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send message:", error);
      setSending(false);
      return;
    }

    setMessages((prev) => {
      if (prev.some((message) => message.id === data.id)) {
        return prev;
      }

      return [...prev, data];
    });

    setInputText("");
    setSending(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#3368A0] text-white flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Internal Clinic Channel
              </h1>

              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Live sync with Reception (Sarah Jenkins)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Connected Realtime
            </span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[calc(100vh-250px)] min-h-[420px] max-h-[620px] overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-3 sm:p-5 md:p-6 space-y-4 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No messages yet.
            </div>
          ) : (
            messages.map((m) => {
              // Doctor is the current user on this page
              const isMine = m.sender_role === "doctor";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender + Time */}
                  <div
                    className={`flex items-center gap-1.5 mb-1.5 text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase ${
                      isMine ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span>{isMine ? "Doctor" : "Secretary"}</span>

                    <span>•</span>

                    <span>{formatTime(m.sent_at)}</span>
                  </div>

                  {/* Message */}
                  <div
                    className={`w-fit max-w-[85%] sm:max-w-md md:max-w-lg p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium shadow-xs break-words ${
                      isMine
                        ? "bg-[#3368A0] text-white rounded-br-none"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              isRTL
                ? "اكتب رسالة إلى السكرتيرة..."
                : "Type message or clinical instructions to reception..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            className="flex-1 min-w-0 h-10 sm:h-11 px-3 sm:px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3368A0] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={sending}
            className="h-10 sm:h-11 px-3 sm:px-5 shrink-0 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}