"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare, Send, Search, BellRing, SendHorizontal, Users,
  CheckCheck, Clock, User, Sparkles, Shield, Circle, Paperclip, ChevronRight
} from "lucide-react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import { toast } from "sonner";

interface StaffContact {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
}

interface ChatMessage {
  id: string;
  conversationId: string; // "staff-1", "staff-2", "broadcast"
  senderId: "doctor" | string;
  senderName: string;
  text: string;
  time: string;
  isUrgent?: boolean;
}

const CLINIC_STAFF: StaffContact[] = [
  {
    id: "broadcast",
    name: "📢 All Clinic Team Broadcast",
    role: "General Announcements",
    avatarBg: "bg-purple-600",
    isOnline: true,
    unreadCount: 0,
    lastMessage: "Team meeting today at 04:30 PM in Conference Room.",
    lastMessageTime: "08:45 AM",
  },
  {
    id: "staff-1",
    name: "Sarah Jenkins",
    role: "Head Secretary & Reception Lead",
    avatarBg: "bg-teal-600",
    isOnline: true,
    unreadCount: 2,
    lastMessage: "Patient Kareem Tarek fever report is uploaded and attached.",
    lastMessageTime: "09:20 AM",
  },
  {
    id: "staff-2",
    name: "Dina Mansour",
    role: "Evening Receptionist",
    avatarBg: "bg-blue-600",
    isOnline: true,
    unreadCount: 0,
    lastMessage: "Confirmed evening shift schedule for Thursday.",
    lastMessageTime: "Yesterday",
  },
  {
    id: "staff-3",
    name: "Hossam Zaki",
    role: "Billing & Cashier Officer",
    avatarBg: "bg-emerald-600",
    isOnline: false,
    unreadCount: 0,
    lastMessage: "Today's cashier balance reconciled successfully.",
    lastMessageTime: "Yesterday",
  },
  {
    id: "staff-4",
    name: "Nurse Mariam",
    role: "Triage & Clinical Nurse",
    avatarBg: "bg-rose-600",
    isOnline: true,
    unreadCount: 1,
    lastMessage: "ECG machine calibrated and ready in Room 2.",
    lastMessageTime: "09:05 AM",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    conversationId: "staff-1",
    senderId: "staff-1",
    senderName: "Sarah Jenkins",
    text: "Good morning Doctor! Patient Kareem Tarek just sent a report about fever. I triaged it as High urgency.",
    time: "09:15 AM",
  },
  {
    id: "m-2",
    conversationId: "staff-1",
    senderId: "doctor",
    senderName: "Dr. Ahmed Hossam",
    text: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.",
    time: "09:18 AM",
  },
  {
    id: "m-3",
    conversationId: "staff-1",
    senderId: "staff-1",
    senderName: "Sarah Jenkins",
    text: "Patient Kareem Tarek fever report is uploaded and attached to his case file.",
    time: "09:20 AM",
  },
  {
    id: "m-4",
    conversationId: "staff-4",
    senderId: "staff-4",
    senderName: "Nurse Mariam",
    text: "Doctor, I took vitals for patient Ahmed Hassan: BP 128/82, Pulse 74 bpm, Sugar 105 mg/dL.",
    time: "09:05 AM",
  },
  {
    id: "m-5",
    conversationId: "broadcast",
    senderId: "doctor",
    senderName: "Dr. Ahmed Hossam",
    text: "Team meeting today at 04:30 PM in Conference Room to review new WhatsApp AI booking flows.",
    time: "08:45 AM",
  },
];

const QUICK_CLINICAL_TEMPLATES = [
  "Please call the next patient into Exam Room 1.",
  "Have patient's latest lab & CBC results ready.",
  "Prepare ECG test in Room 2.",
  "Please issue prescription renewal receipt.",
  "Ask patient to wait 10 minutes in reception.",
];

export default function DoctorCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [staffList, setStaffList] = useState<StaffContact[]>(CLINIC_STAFF);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("staff-1");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedContact = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedStaffId]);

  // Real-time listener for incoming messages & summons
  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "CHAT_MESSAGE") {
        const incoming = event.payload;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [
            ...prev,
            {
              id: incoming.id,
              conversationId: selectedStaffId,
              senderId: incoming.sender,
              senderName: incoming.sender === "doctor" ? "Dr. Ahmed Hossam" : "Reception Desk",
              text: incoming.text,
              time: incoming.time,
            },
          ];
        });
      }
    });

    return () => unsub();
  }, [selectedStaffId]);

  const handleSelectContact = (id: string) => {
    setSelectedStaffId(id);
    // Clear unread count for this contact
    setStaffList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedStaffId,
      senderId: "doctor",
      senderName: "Dr. Ahmed Hossam",
      text: content,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);

    // Update last message in sidebar
    setStaffList((prev) =>
      prev.map((c) =>
        c.id === selectedStaffId
          ? { ...c, lastMessage: content, lastMessageTime: "Just now" }
          : c
      )
    );

    // Publish to Realtime Bus
    realtimeBus.publish({
      type: "CHAT_MESSAGE",
      payload: {
        id: newMsg.id,
        sender: "doctor",
        text: content,
        time: newMsg.time,
      },
    });

    if (!textToSend) setInputText("");
  };

  // Quick Summon specifically to this staff member
  const handleSummonContact = () => {
    realtimeBus.publish({
      type: "SUMMON_SECRETARY",
      payload: {
        doctorName: "Dr. Ahmed Hossam",
        room: "Examination Room #1",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        urgent: true,
      },
    });
    toast.info(`🚨 Summon alert sent directly to ${selectedContact.name}!`);
  };

  const currentThreadMessages = messages.filter((m) => m.conversationId === selectedStaffId);

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] flex flex-col">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3368A0] text-white flex items-center justify-center font-bold shadow-sm">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Clinic Direct Staff Messaging & Comms
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              1-on-1 direct channels with secretaries, nursing staff & team broadcast
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Realtime Synchronized</span>
          </span>
        </div>
      </div>

      {/* Main 2-Column Chat Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-0 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Left Column: Staff Contacts List & Search */}
        <div className="md:col-span-1 border-r border-slate-200/80 dark:border-slate-800 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/40">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search className="doctech-input-icon" size={15} />
              <input
                type="text"
                placeholder="Search staff or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="doctech-input !h-9 text-xs"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {filteredStaff.map((contact) => {
              const isSelected = contact.id === selectedStaffId;
              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? "bg-[#3368A0] text-white shadow-sm"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl ${contact.avatarBg} text-white font-extrabold text-xs flex items-center justify-center`}
                      >
                        {contact.id === "broadcast" ? "📢" : contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {contact.isOnline && contact.id !== "broadcast" && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#131E2E]"></span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold truncate">{contact.name}</h4>
                      </div>
                      <p className={`text-[10px] truncate ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {contact.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-medium ${isSelected ? "text-blue-200" : "text-slate-500"}`}>
                      {contact.lastMessageTime}
                    </span>
                    {contact.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active 1-on-1 Chat Thread */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col min-h-0 bg-white dark:bg-[#131E2E]">
          {/* Active Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl ${selectedContact.avatarBg} text-white font-extrabold text-sm flex items-center justify-center shrink-0`}
              >
                {selectedContact.id === "broadcast" ? "📢" : selectedContact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedContact.name}
                  </h3>
                  {selectedContact.isOnline && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Online</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">{selectedContact.role}</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            {selectedContact.id !== "broadcast" && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSummonContact}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Summon directly to Exam Room 1"
                >
                  <BellRing size={13} className="animate-pulse" />
                  <span className="hidden sm:inline">Summon to Room 1</span>
                  <span className="sm:hidden">Summon</span>
                </button>
              </div>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 space-y-3.5 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
            {currentThreadMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                <MessageSquare size={28} className="text-slate-500" />
                <p>No messages yet with {selectedContact.name}.</p>
                <p className="text-[11px] text-slate-500">Type a message below or use quick clinical instructions.</p>
              </div>
            ) : (
              currentThreadMessages.map((msg) => {
                const isDoctor = msg.senderId === "doctor";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isDoctor ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold uppercase">
                      <span>{isDoctor ? "You (Dr. Ahmed Hossam)" : msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`max-w-lg p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                        isDoctor
                          ? "bg-[#3368A0] text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Clinical Instruction Chips */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-blue-400" /> Quick:
            </span>
            {QUICK_CLINICAL_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(tmpl)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200/80 dark:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
              >
                {tmpl}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={`Message ${selectedContact.name}... (Press Enter to send)`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3368A0]"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
