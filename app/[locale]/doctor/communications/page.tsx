"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Send, Paperclip, CheckCheck, User, Stethoscope } from "lucide-react";

interface Message {
  id: string;
  sender: "doctor" | "secretary";
  text: string;
  time: string;
}

export default function DoctorCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "secretary", text: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.", time: "09:15 AM" },
    { id: "2", sender: "doctor", text: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.", time: "09:18 AM" },
    { id: "3", sender: "secretary", text: "CBC report is uploaded and attached to his case file.", time: "09:20 AM" },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: "doctor",
        text: inputText.trim(),
        time: "Just now",
      },
    ]);
    setInputText("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A4B8C] text-white flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Internal Clinic Channel</h1>
            <p className="text-xs text-slate-500 font-medium">Direct line with Reception (Sarah Jenkins)</p>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[500px] overflow-hidden">
        {/* Messages Thread */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/40">
          {messages.map((m) => {
            const isDoctor = m.sender === "doctor";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isDoctor ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>{isDoctor ? "You (Dr. Clinical Lead)" : "Sarah Jenkins (Secretary)"}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                    isDoctor
                      ? "bg-[#1A4B8C] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder={isRTL ? "اكتب رسالة إلى السكرتيرة..." : "Type instructions or reply to reception..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isRTL ? "إرسال" : "Send"}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}