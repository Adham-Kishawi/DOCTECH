


// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { MessageSquare, Send } from "lucide-react";
// import { supabase } from "@/lib/supabase";

// interface Message {
//   id: string;
//   doctor_id: string;
//   secretary_id: string;
//   content: string;
//   is_read: boolean;
//   sent_at: string;
// }

// const DOCTOR_ID = "doc-101";
// const SECRETARY_ID = "sec-202";

// export default function SecretaryCommunicationsPage() {
//   const params = useParams();
//   const locale = (params?.locale as string) || "en";
//   const isRTL = locale === "ar";

//   const [messages, setMessages] = useState<Message[]>([]);
//   const [inputText, setInputText] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);

//   const formatTime = (date: string) => {
//     return new Date(date).toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   useEffect(() => {
//     const loadMessages = async () => {
//       const { data, error } = await supabase
//         .from("internal_messages")
//         .select("*")
//         .eq("doctor_id", DOCTOR_ID)
//         .eq("secretary_id", SECRETARY_ID)
//         .order("sent_at", { ascending: true });

//       if (error) {
//         console.error("Failed to load messages:", error);
//         setLoading(false);
//         return;
//       }

//       setMessages(data ?? []);
//       setLoading(false);
//     };

//     loadMessages();
//   }, []);

//   const handleSend = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const content = inputText.trim();

//     if (!content || sending) return;

//     setSending(true);

//     const { data, error } = await supabase
//       .from("internal_messages")
//       .insert({
//         doctor_id: DOCTOR_ID,
//         secretary_id: SECRETARY_ID,
//         content,
//       })
//       .select()
//       .single();

//     if (error) {
//       console.error("Failed to send message:", error);
//       setSending(false);
//       return;
//     }

//     setMessages((prev) => [...prev, data]);
//     setInputText("");
//     setSending(false);
//   };

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto">
//       <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-[#36ADA3] text-white flex items-center justify-center font-bold">
//             <MessageSquare size={18} />
//           </div>

//           <div>
//             <h1 className="text-lg font-bold text-slate-900 dark:text-white">
//               Doctor Communications Line
//             </h1>

//             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
//               Live sync with Dr. Clinical Lead
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

//           <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
//             Connected Realtime
//           </span>
//         </div>
//       </div>

//       <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px] overflow-hidden">
//         <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
//           {loading ? (
//             <div className="h-full flex items-center justify-center text-xs text-slate-400">
//               Loading messages...
//             </div>
//           ) : messages.length === 0 ? (
//             <div className="h-full flex items-center justify-center text-xs text-slate-400">
//               No messages yet.
//             </div>
//           ) : (
//             messages.map((m) => {
//               const isSecretary = m.secretary_id === SECRETARY_ID;

//               return (
//                 <div
//                   key={m.id}
//                   className={`flex flex-col ${
//                     isSecretary ? "items-end" : "items-start"
//                   }`}
//                 >
//                   <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
//                     <span>
//                       {isSecretary
//                         ? "You (Sarah Jenkins)"
//                         : "Dr. Clinical Lead"}
//                     </span>

//                     <span>•</span>

//                     <span>{formatTime(m.sent_at)}</span>
//                   </div>

//                   <div
//                     className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
//                       isSecretary
//                         ? "bg-[#36ADA3] text-white rounded-br-none"
//                         : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none"
//                     }`}
//                   >
//                     {m.content}
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         <form
//           onSubmit={handleSend}
//           className="p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
//         >
//           <input
//             type="text"
//             placeholder={
//               isRTL
//                 ? "اكتب رسالة إلى الطبيب..."
//                 : "Type message or query to Doctor..."
//             }
//             value={inputText}
//             onChange={(e) => setInputText(e.target.value)}
//             disabled={sending}
//             className="flex-1 h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#36ADA3] disabled:opacity-50"
//           />

//           <button
//             type="submit"
//             disabled={sending}
//             className="h-11 px-5 rounded-xl bg-[#36ADA3] hover:bg-[#298F86] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <span>{isRTL ? "إرسال" : "Send"}</span>
//             <Send size={14} />
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

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

export default function SecretaryCommunicationsPage() {
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
  }, []);

  const handleSend = async (e: React.FormEvent) => {
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
        sender_role: "secretary",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send message:", error);
      setSending(false);
      return;
    }

    setMessages((prev) => [...prev, data]);
    setInputText("");
    setSending(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#36ADA3] text-white flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Doctor Communications Line
              </h1>

              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Live sync with Dr. Clinical Lead
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
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[calc(100vh-250px)] min-h-[450px] max-h-[620px] overflow-hidden">
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
              const isSecretary = m.sender_role === "secretary";

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    isSecretary ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender + Time */}
                  <div
                    className={`flex items-center gap-1.5 mb-1.5 text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase ${
                      isSecretary ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span>
                      {isSecretary ? "Secretary" : "Doctor"}
                    </span>

                    <span>•</span>

                    <span>{formatTime(m.sent_at)}</span>
                  </div>

                  {/* Message */}
                  <div
                    className={`w-fit max-w-[85%] sm:max-w-md md:max-w-lg p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-medium shadow-xs break-words ${
                      isSecretary
                        ? "bg-[#36ADA3] text-white rounded-br-none"
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
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
         <input
  type="text"
  placeholder={
    isRTL
      ? "اكتب رسالة إلى الطبيب..."
      : "Type message or query to Doctor..."
  }
  value={inputText}
  onChange={(e) => setInputText(e.target.value)}
  disabled={sending}
  className="flex-1 min-w-0 h-10 sm:h-11 px-3 sm:px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#36ADA3] disabled:opacity-50"
/>

          <button
            type="submit"
            disabled={sending}
            className="h-10 sm:h-11 px-3 sm:px-5 shrink-0 rounded-xl bg-[#36ADA3] hover:bg-[#298F86] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}