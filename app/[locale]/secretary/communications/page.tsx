"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare, Send, Search, SendHorizontal, Users,
  CheckCheck, Clock, User, Sparkles, Shield, Circle, Paperclip, ChevronRight, Stethoscope
} from "lucide-react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import {
  fetchInternalMessages,
  saveInternalMessage,
  markInternalMessagesAsRead,
  InternalChatMessage,
} from "@/lib/dataService";
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
  channelId: string;
}

interface ChatMessage {
  id: string;
  conversationId: string; // "doc-1", "doc-2", "broadcast", "sec-2"
  senderId: "secretary" | string;
  senderName: string;
  text: string;
  time: string;
}

const SECRETARY_CONTACTS: StaffContact[] = [
  {
    id: "broadcast",
    name: "📢 All Clinic Team Broadcast",
    role: "General Announcements",
    avatarBg: "bg-purple-600",
    isOnline: true,
    unreadCount: 0,
    lastMessage: "Team meeting today at 04:30 PM in Conference Room.",
    lastMessageTime: "08:45 AM",
    channelId: "broadcast",
  },
  {
    id: "doc-1",
    name: "Dr. Ahmed Hossam",
    role: "Clinical Lead & Cardiology Consultant",
    avatarBg: "bg-blue-600",
    isOnline: true,
    unreadCount: 0,
    lastMessage: "Thanks Sarah, reviewing his case right now. Please have his CBC report ready.",
    lastMessageTime: "09:18 AM",
    channelId: "doctor_secretary_direct",
  },
  {
    id: "doc-2",
    name: "Dr. Tarek Omar",
    role: "Internal Medicine Consultant",
    avatarBg: "bg-indigo-600",
    isOnline: true,
    unreadCount: 0,
    lastMessage: "I will be in the clinic starting 11:00 AM.",
    lastMessageTime: "08:30 AM",
    channelId: "direct:doc-2",
  },
  {
    id: "sec-2",
    name: "Dina Mansour",
    role: "Evening Receptionist",
    avatarBg: "bg-teal-600",
    isOnline: true,
    unreadCount: 1,
    lastMessage: "Handover notes: 3 follow-ups scheduled for evening shift.",
    lastMessageTime: "Yesterday",
    channelId: "direct:sec-2",
  },
  {
    id: "staff-3",
    name: "Hossam Zaki",
    role: "Billing & Cashier Officer",
    avatarBg: "bg-emerald-600",
    isOnline: false,
    unreadCount: 0,
    lastMessage: "Reconciled today's POS transactions.",
    lastMessageTime: "Yesterday",
    channelId: "direct:staff-3",
  },
];

const QUICK_SECRETARY_TEMPLATES = [
  "Patient has arrived and is waiting in reception.",
  "CBC & Lab test results are attached to patient sheet.",
  "Patient requested 5-minute consultation delay.",
  "Follow-up appointment booked for next week.",
  "Patient is asking about prescription renewal.",
];

function getContactIdForChannel(channelId: string): string {
  if (channelId === "doctor_secretary_direct") return "doc-1";
  if (channelId === "broadcast") return "broadcast";
  if (channelId.startsWith("direct:")) return channelId.replace("direct:", "");
  return "doc-1";
}

function getChannelForContactId(contactId: string): string {
  if (contactId === "doc-1") return "doctor_secretary_direct";
  if (contactId === "broadcast") return "broadcast";
  return `direct:${contactId}`;
}

export default function SecretaryCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [contactList, setContactList] = useState<StaffContact[]>(SECRETARY_CONTACTS);
  const [selectedContactId, setSelectedContactId] = useState<string>("doc-1");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedContactIdRef = useRef(selectedContactId);

  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;
  }, [selectedContactId]);

  const selectedContact = contactList.find((s) => s.id === selectedContactId) || contactList[0];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContactId]);

  // Load initial messages from database / local storage
  useEffect(() => {
    async function loadChatHistory() {
      try {
        const stored = await fetchInternalMessages();
        if (stored && stored.length > 0) {
          const mapped: ChatMessage[] = stored.map((m: InternalChatMessage) => ({
            id: m.id,
            conversationId: getContactIdForChannel(m.channelId),
            senderId: m.senderRole,
            senderName: m.senderName,
            text: m.content,
            time: m.sentAt,
          }));
          setMessages(mapped);

          // Update sidebar contact snippets
          setContactList((prev) =>
            prev.map((c) => {
              const channelId = getChannelForContactId(c.id);
              const contactMsgs = stored.filter((m) => m.channelId === channelId);
              if (contactMsgs.length > 0) {
                const latest = contactMsgs[contactMsgs.length - 1];
                return {
                  ...c,
                  lastMessage: latest.content,
                  lastMessageTime: latest.sentAt,
                };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.warn("Failed to load initial messages:", err);
      }
    }
    loadChatHistory();
  }, []);

  // Real-time listener for incoming messages
  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "CHAT_MESSAGE") {
        const incoming = event.payload;
        // Skip own messages sent from this window
        if (incoming.senderRole === "secretary" && incoming.senderName.includes("Sarah")) {
          return;
        }

        const channelId = incoming.channelId || "doctor_secretary_direct";
        const targetContactId = getContactIdForChannel(channelId);

        const newMsg: ChatMessage = {
          id: incoming.id,
          conversationId: targetContactId,
          senderId: incoming.senderRole,
          senderName: incoming.senderName,
          text: incoming.text,
          time: incoming.time,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, newMsg];
        });

        const activeId = selectedContactIdRef.current;
        const isCurrentThread = targetContactId === activeId;

        // Update sidebar last message & unread badge
        setContactList((prev) =>
          prev.map((c) => {
            if (c.id === targetContactId) {
              return {
                ...c,
                lastMessage: incoming.text,
                lastMessageTime: incoming.time,
                unreadCount: isCurrentThread ? 0 : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          })
        );

        // Sound chime for incoming message
        realtimeBus.playMessageChime();

        // Toast notification if on another thread or as a subtle alert
        if (!isCurrentThread) {
          toast.info(`💬 ${incoming.senderName}: "${incoming.text.slice(0, 40)}${incoming.text.length > 40 ? "..." : ""}"`, {
            action: {
              label: "Open",
              onClick: () => handleSelectContact(targetContactId),
            },
          });
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSelectContact = useCallback((id: string) => {
    setSelectedContactId(id);
    setContactList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    const channelId = getChannelForContactId(id);
    markInternalMessagesAsRead(channelId, "secretary");
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const channelId = getChannelForContactId(selectedContactId);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: selectedContactId,
      senderId: "secretary",
      senderName: "Sarah Jenkins (Reception)",
      text: content,
      time: timeStr,
    };

    // 1. Immediately update local UI
    setMessages((prev) => [...prev, newMsg]);

    // 2. Update sidebar
    setContactList((prev) =>
      prev.map((c) =>
        c.id === selectedContactId
          ? { ...c, lastMessage: content, lastMessageTime: "Just now" }
          : c
      )
    );

    if (!textToSend) setInputText("");

    // 3. Save to database / persistent local storage
    try {
      await saveInternalMessage({
        id: newMsg.id,
        channelId,
        senderRole: "secretary",
        senderName: newMsg.senderName,
        content,
        sentAt: timeStr,
        isRead: false,
        clinicId: "cln-001",
      });
    } catch (e) {
      console.warn("Failed saving internal message", e);
    }

    // 4. Publish to realtime bus for doctor (notifySelf = false to prevent duplicate)
    realtimeBus.publish({
      type: "CHAT_MESSAGE",
      payload: {
        id: newMsg.id,
        channelId,
        senderRole: "secretary",
        sender: "secretary",
        senderName: newMsg.senderName,
        receiverRole: selectedContactId === "broadcast" ? "all" : "doctor",
        text: content,
        time: timeStr,
        clinicId: "cln-001",
      },
    }, false);
  };

  // Send Discreet Note to doctor
  const handleSendQuietAlert = () => {
    const note = prompt("Enter discreet note for Doctor (will appear quietly on doctor's screen):", "Next patient Ahmed Hassan is waiting outside.");
    if (note) {
      realtimeBus.publish({
        type: "SECRETARY_DISCREET_ALERT",
        payload: {
          message: note,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      }, true);
      toast.success("Quiet alert delivered directly to Doctor's examination screen.");
    }
  };

  const currentThreadMessages = messages.filter((m) => m.conversationId === selectedContactId);

  const filteredContacts = contactList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] flex flex-col">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#36ADA3] text-white flex items-center justify-center font-bold shadow-sm">
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Reception Direct Comms & Doctor Channels
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Direct communication lines with clinic doctors, co-secretaries & broadcast
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
        {/* Left Column: Contacts List & Search */}
        <div className="md:col-span-1 border-r border-slate-200/80 dark:border-slate-800 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/40">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search className="doctech-input-icon" size={15} />
              <input
                type="text"
                placeholder="Search doctors or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="doctech-input !h-9 text-xs"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {filteredContacts.map((contact) => {
              const isSelected = contact.id === selectedContactId;
              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? "bg-[#36ADA3] text-white shadow-sm"
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
                      <p className={`text-[10px] truncate ${isSelected ? "text-teal-100" : "text-slate-400"}`}>
                        {contact.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-medium ${isSelected ? "text-teal-200" : "text-slate-500"}`}>
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

        {/* Right Column: Active Chat Thread */}
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

            {/* Quiet Alert button */}
            {selectedContact.id.startsWith("doc") && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSendQuietAlert}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-950/60 text-[#36ADA3] border border-[#36ADA3]/40 hover:bg-teal-900/50 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Send discreet note directly to doctor screen"
                >
                  <SendHorizontal size={13} />
                  <span className="hidden sm:inline">Send Quiet Note</span>
                  <span className="sm:hidden">Note</span>
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
                <p className="text-[11px] text-slate-500">Type a message below or use quick intake templates.</p>
              </div>
            ) : (
              currentThreadMessages.map((msg) => {
                const isSecretary = msg.senderId === "secretary";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSecretary ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold uppercase">
                      <span>{isSecretary ? "You (Sarah Jenkins)" : msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`max-w-lg p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                        isSecretary
                          ? "bg-[#36ADA3] text-white rounded-br-none"
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

          {/* Quick Intake Template Chips */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-teal-400" /> Quick:
            </span>
            {QUICK_SECRETARY_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(tmpl)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-950/50 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200/80 dark:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
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
              className="flex-1 h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#36ADA3]"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-[#36ADA3] hover:bg-[#298F86] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
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
