"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";

export default function SecretaryCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [messages, setMessages] = useState([
    { id: "1", sender: "secretary", text: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.", time: "09:15 AM" },
    { id: "2", sender: "doctor", text: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.", time: "09:18 AM" },
    { id: "3", sender: "secretary", text: "CBC report is uploaded and attached to his case file.", time: "09:20 AM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      { id: Date.now().toString(), sender: "secretary", text: inputText.trim(), time: "Just now" },
    ]);
    setInputText("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0891B2] text-white flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Doctor Communications Line</h1>
            <p className="text-xs text-slate-500 font-medium">Direct line with Dr. Clinical Lead</p>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Doctor Online" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[500px] overflow-hidden">
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
          {messages.map((m) => {
            const isSecretary = m.sender === "secretary";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isSecretary ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
                  <span>{isSecretary ? "You (Sarah Jenkins)" : "Dr. Clinical Lead"}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                    isSecretary
                      ? "bg-[#0891B2] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة إلى الطبيب..." : "Type urgent message or query to Doctor..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}