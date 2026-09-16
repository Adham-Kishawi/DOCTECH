

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Search,
  BellRing,
  Sparkles,
} from "lucide-react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import {
  fetchInternalMessages,
  saveInternalMessage,
  markInternalMessagesAsRead,
  InternalChatMessage,
} from "@/lib/dataService";
import { toast } from "sonner";

interface CurrentDoctor {
  id: string;
  clerk_user_id: string;
  email: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  clinic_id: string;
}

interface ApiContact {
  id?: string;
  clerk_user_id?: string;
  name?: string;
  email?: string;
  role?: string;
  type?: "doctor" | "secretary" | "staff";
  avatar_url?: string | null;
  clinic_id?: string;
  isOnline?: boolean;
}

interface StaffContact {
  id: string;
  name: string;
  role: string;
  type: "doctor" | "secretary" | "staff" | "broadcast";
  avatarBg: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  channelId: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: "doctor" | string;
  senderName: string;
  text: string;
  time: string;
  isUrgent?: boolean;
}

const QUICK_CLINICAL_TEMPLATES = [
  "Please call the next patient into Exam Room 1.",
  "Have patient's latest lab & CBC results ready.",
  "Prepare ECG test in Room 2.",
  "Please issue prescription renewal receipt.",
  "Ask patient to wait 10 minutes in reception.",
];

function getAvatarBg(type: StaffContact["type"], id: string): string {
  if (id === "broadcast") return "bg-purple-600";

  switch (type) {
    case "doctor":
      return "bg-blue-600";
    case "secretary":
      return "bg-teal-600";
    case "staff":
      return "bg-emerald-600";
    default:
      return "bg-slate-600";
  }
}

function normalizeContact(
  raw: ApiContact,
  index: number
): StaffContact | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id
      : `contact-${index}`;

  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name
      : "Clinic Staff";

  const type: StaffContact["type"] =
    raw.type === "doctor" ||
      raw.type === "secretary" ||
      raw.type === "staff"
      ? raw.type
      : "staff";

  const role =
    typeof raw.role === "string" && raw.role.trim()
      ? raw.role
      : type === "doctor"
        ? "Doctor"
        : type === "secretary"
          ? "Secretary"
          : "Clinic Staff";

  return {
    id,
    name,
    role,
    type,
    avatarBg: getAvatarBg(type, id),
    isOnline: raw.isOnline === true,
    unreadCount: 0,
    lastMessage: "No messages yet.",
    lastMessageTime: "",
    channelId:
      type === "doctor" && index === 0
        ? "doctor_secretary_direct"
        : `direct:${id}`,
  };
}

function getContactIdForChannel(
  channelId: string,
  contacts: StaffContact[]
): string {
  if (channelId === "broadcast") {
    return "broadcast";
  }

  const directContactId = channelId.startsWith("direct:")
    ? channelId.replace("direct:", "")
    : null;

  if (directContactId) {
    const directContact = contacts.find(
      (contact) => contact.id === directContactId
    );

    return directContact?.id || directContactId;
  }

  const matchingContact = contacts.find(
    (contact) => contact.channelId === channelId
  );

  if (matchingContact) {
    return matchingContact.id;
  }

  if (channelId === "doctor_secretary_direct") {
    const secretary = contacts.find(
      (contact) => contact.type === "secretary"
    );

    if (secretary) {
      return secretary.id;
    }
  }

  return contacts[0]?.id || "";
}

function getChannelForContactId(
  contactId: string,
  contacts: StaffContact[]
): string {
  if (contactId === "broadcast") {
    return "broadcast";
  }

  const contact = contacts.find((item) => item.id === contactId);

  if (contact?.channelId) {
    return contact.channelId;
  }

  return `direct:${contactId}`;
}

export default function DoctorCommunicationsPage() {
  const [doctor, setDoctor] = useState<CurrentDoctor | null>(null);
  const [staffList, setStaffList] = useState<StaffContact[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedStaffIdRef = useRef(selectedStaffId);
  const staffListRef = useRef<StaffContact[]>([]);

  useEffect(() => {
    selectedStaffIdRef.current = selectedStaffId;
  }, [selectedStaffId]);

  useEffect(() => {
    staffListRef.current = staffList;
  }, [staffList]);

  const selectedContact =
    staffList.find((s) => s.id === selectedStaffId) || null;

  /*
   * Load current doctor and clinic contacts.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      setLoadingContacts(true);
      setContactsError("");

      try {
        const [doctorResponse, contactsResponse] = await Promise.all([
          fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/doctor/contacts", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        let doctorData: any = null;
        let contactsData: any = null;

        try {
          doctorData = await doctorResponse.json();
        } catch {
          throw new Error("Invalid doctor response from server.");
        }

        try {
          contactsData = await contactsResponse.json();
        } catch {
          throw new Error("Invalid contacts response from server.");
        }

        if (!doctorResponse.ok || !doctorData?.success) {
          throw new Error(
            doctorData?.error || "Failed to load doctor profile."
          );
        }

        if (doctorData.role !== "doctor" || !doctorData.user) {
          throw new Error("Authenticated user is not a doctor.");
        }

        if (!contactsResponse.ok || !contactsData?.success) {
          throw new Error(
            contactsData?.error || "Failed to load clinic contacts."
          );
        }

        if (cancelled) return;

        const currentDoctor: CurrentDoctor = {
          id: doctorData.user.id,
          clerk_user_id: doctorData.user.clerk_user_id || "",
          email: doctorData.user.email || "",
          name: doctorData.user.name || "Doctor",
          specialty: doctorData.user.specialty || null,
          avatar_url: doctorData.user.avatar_url || null,
          clinic_id:
            doctorData.user.clinic_id || contactsData.clinicId || "",
        };


        const rawContacts: ApiContact[] = Array.isArray(
          contactsData.contacts
        )
          ? contactsData.contacts
          : [];

        const normalizedContacts: StaffContact[] = rawContacts
          .map((contact: ApiContact, index: number) =>
            normalizeContact(contact, index)
          )
          .filter(
            (contact: StaffContact | null): contact is StaffContact =>
              contact !== null
          );
        const broadcastContact: StaffContact = {
          id: "broadcast",
          name: "📢 All Clinic Team Broadcast",
          role: "General Announcements",
          type: "broadcast",
          avatarBg: "bg-purple-600",
          isOnline: true,
          unreadCount: 0,
          lastMessage: "No messages yet.",
          lastMessageTime: "",
          channelId: "broadcast",
        };

        const finalContacts = [
          broadcastContact,
          ...normalizedContacts,
        ];

        setDoctor(currentDoctor);
        setStaffList(finalContacts);
        staffListRef.current = finalContacts;

        const firstRealContact = normalizedContacts[0];

        setSelectedStaffId(
          firstRealContact?.id || broadcastContact.id
        );
      } catch (error) {
        console.error("Failed to load doctor communications:", error);

        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load clinic contacts.";

          setContactsError(message);
          toast.error(message);

          const broadcastOnly: StaffContact = {
            id: "broadcast",
            name: "📢 All Clinic Team Broadcast",
            role: "General Announcements",
            type: "broadcast",
            avatarBg: "bg-purple-600",
            isOnline: true,
            unreadCount: 0,
            lastMessage: "No messages yet.",
            lastMessageTime: "",
            channelId: "broadcast",
          };

          setStaffList([broadcastOnly]);
          staffListRef.current = [broadcastOnly];
          setSelectedStaffId("broadcast");
        }
      } finally {
        if (!cancelled) {
          setLoadingContacts(false);
        }
      }
    }

    loadContacts();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Auto scroll to bottom of chat.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, selectedStaffId]);

  /*
   * Load initial messages after contacts are available.
   */
  useEffect(() => {
    if (loadingContacts) return;

    async function loadChatHistory() {
      try {
        const stored = await fetchInternalMessages();

        if (!stored || stored.length === 0) {
          return;
        }

        const mapped: ChatMessage[] = stored.map(
          (m: InternalChatMessage) => ({
            id: m.id,
            conversationId: getContactIdForChannel(
              m.channelId,
              staffListRef.current
            ),
            senderId: m.senderRole,
            senderName: m.senderName,
            text: m.content,
            time: m.sentAt,
          })
        );

        setMessages(mapped);

        setStaffList((prev) =>
          prev.map((contact) => {
            const channelId = getChannelForContactId(
              contact.id,
              prev
            );

            const contactMessages = stored.filter(
              (message) => message.channelId === channelId
            );

            if (contactMessages.length === 0) {
              return contact;
            }

            const latest =
              contactMessages[contactMessages.length - 1];

            return {
              ...contact,
              lastMessage: latest.content,
              lastMessageTime: latest.sentAt,
            };
          })
        );
      } catch (error) {
        console.warn(
          "Failed to load initial messages:",
          error
        );
      }
    }

    loadChatHistory();
  }, [loadingContacts]);

  const handleSelectContact = useCallback((id: string) => {
    if (!id) return;

    setSelectedStaffId(id);

    setStaffList((prev) =>
      prev.map((contact) =>
        contact.id === id
          ? {
            ...contact,
            unreadCount: 0,
          }
          : contact
      )
    );

    const channelId = getChannelForContactId(
      id,
      staffListRef.current
    );

    if (channelId) {
      markInternalMessagesAsRead(channelId, "doctor");
    }
  }, []);

  /*
   * Real-time listener for incoming messages.
   */
  useEffect(() => {
    const unsub = realtimeBus.subscribe(
      (event: RealtimeEvent) => {
        if (event.type !== "CHAT_MESSAGE") {
          return;
        }

        const incoming = event.payload;

        /*
         * Ignore messages sent by the current doctor
         * from this browser window.
         */
        if (
          incoming.senderRole === "doctor" &&
          doctor?.name &&
          incoming.senderName === doctor.name
        ) {
          return;
        }

        const channelId =
          incoming.channelId || "doctor_secretary_direct";

        const targetContactId = getContactIdForChannel(
          channelId,
          staffListRef.current
        );

        if (!targetContactId) {
          return;
        }

        const newMsg: ChatMessage = {
          id: incoming.id,
          conversationId: targetContactId,
          senderId: incoming.senderRole,
          senderName: incoming.senderName,
          text: incoming.text,
          time: incoming.time,
        };

        setMessages((prev) => {
          if (prev.some((message) => message.id === incoming.id)) {
            return prev;
          }

          return [...prev, newMsg];
        });

        const activeId = selectedStaffIdRef.current;
        const isCurrentThread =
          targetContactId === activeId;

        setStaffList((prev) =>
          prev.map((contact) => {
            if (contact.id !== targetContactId) {
              return contact;
            }

            return {
              ...contact,
              lastMessage: incoming.text,
              lastMessageTime: incoming.time,
              unreadCount: isCurrentThread
                ? 0
                : (contact.unreadCount || 0) + 1,
            };
          })
        );

        realtimeBus.playMessageChime();

        if (!isCurrentThread) {
          toast.info(
            `💬 ${incoming.senderName}: "${incoming.text.slice(
              0,
              40
            )}${incoming.text.length > 40 ? "..." : ""}"`,
            {
              action: {
                label: "Open",
                onClick: () =>
                  handleSelectContact(targetContactId),
              },
            }
          );
        }
      }
    );

    return () => unsub();
  }, [doctor, handleSelectContact]);

  const handleSendMessage = async (
    textToSend?: string
  ) => {
    const content = (textToSend || inputText).trim();

    if (!content || !doctor || !selectedContact) {
      return;
    }

    const channelId = getChannelForContactId(
      selectedContact.id,
      staffListRef.current
    );

    if (!channelId) {
      toast.error("Unable to determine message channel.");
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const senderName = doctor.name || "Doctor";

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      conversationId: selectedContact.id,
      senderId: "doctor",
      senderName,
      text: content,
      time: timeStr,
    };

    /*
     * Immediately update local UI.
     */
    setMessages((prev) => [...prev, newMsg]);

    /*
     * Update sidebar last message.
     */
    setStaffList((prev) =>
      prev.map((contact) =>
        contact.id === selectedContact.id
          ? {
            ...contact,
            lastMessage: content,
            lastMessageTime: "Just now",
          }
          : contact
      )
    );

    if (!textToSend) {
      setInputText("");
    }

    /*
     * Save to database.
     */
    try {
      await saveInternalMessage({
        id: newMsg.id,
        channelId,
        senderRole: "doctor",
        senderName,
        content,
        sentAt: timeStr,
        isRead: false,
        clinicId: doctor.clinic_id,
      });
    } catch (error) {
      console.warn(
        "Failed saving internal message:",
        error
      );

      toast.error(
        "Message was displayed locally but could not be saved."
      );
    }

    /*
     * Publish to Realtime Bus.
     */
    realtimeBus.publish(
      {
        type: "CHAT_MESSAGE",
        payload: {
          id: newMsg.id,
          channelId,
          senderRole: "doctor",
          sender: "doctor",
          senderName,
          receiverRole:
            selectedContact.id === "broadcast"
              ? "all"
              : "secretary",
          text: content,
          time: timeStr,
          clinicId: doctor.clinic_id,
        },
      },
      false
    );
  };

  /*
   * Summon the selected contact.
   */
  const handleSummonContact = () => {
    if (!doctor || !selectedContact) {
      return;
    }

    realtimeBus.publish(
      {
        type: "SUMMON_SECRETARY",
        payload: {
          doctorName: doctor.name,
          room: "Examination Room #1",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          urgent: true,
        },
      },
      true
    );

    toast.info(
      `🚨 Summon alert sent directly to ${selectedContact.name}!`
    );
  };

  const currentThreadMessages = messages.filter(
    (message) =>
      message.conversationId === selectedStaffId
  );

  const filteredStaff = staffList.filter(
    (contact) =>
      contact.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      contact.role
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
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
              1-on-1 direct channels with secretaries, nursing
              staff & team broadcast
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
        {/* Left Column */}
        <div className="md:col-span-1 border-r border-slate-200/80 dark:border-slate-800 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/40">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search className="doctech-input-icon" size={15} />

              <input
                type="text"
                placeholder="Search staff or role..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="doctech-input !h-9 text-xs"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {loadingContacts ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading clinic contacts...
              </div>
            ) : contactsError && staffList.length <= 1 ? (
              <div className="h-full flex items-center justify-center text-center px-4 text-xs text-slate-400">
                {contactsError}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-4 text-xs text-slate-400">
                No clinic contacts found.
              </div>
            ) : (
              filteredStaff.map((contact) => {
                const isSelected =
                  contact.id === selectedStaffId;

                return (
                  <div
                    key={contact.id}
                    onClick={() =>
                      handleSelectContact(contact.id)
                    }
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isSelected
                        ? "bg-[#3368A0] text-white shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className={`w-9 h-9 rounded-xl ${contact.avatarBg} text-white font-extrabold text-xs flex items-center justify-center`}
                        >
                          {contact.id === "broadcast"
                            ? "📢"
                            : contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                        </div>

                        {contact.isOnline &&
                          contact.id !== "broadcast" && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#131E2E]"></span>
                          )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold truncate">
                            {contact.name}
                          </h4>
                        </div>

                        <p
                          className={`text-[10px] truncate ${isSelected
                              ? "text-blue-100"
                              : "text-slate-400"
                            }`}
                        >
                          {contact.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-medium ${isSelected
                            ? "text-blue-200"
                            : "text-slate-500"
                          }`}
                      >
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
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col min-h-0 bg-white dark:bg-[#131E2E]">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400 px-6">
              {loadingContacts
                ? "Loading clinic contacts..."
                : "No clinic contact selected."}
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl ${selectedContact.avatarBg} text-white font-extrabold text-sm flex items-center justify-center shrink-0`}
                  >
                    {selectedContact.id === "broadcast"
                      ? "📢"
                      : selectedContact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
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

                    <p className="text-xs text-slate-400 truncate">
                      {selectedContact.role}
                    </p>
                  </div>
                </div>

                {/* Quick Action */}
                {selectedContact.id !== "broadcast" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSummonContact}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      title="Summon directly to Exam Room 1"
                    >
                      <BellRing
                        size={13}
                        className="animate-pulse"
                      />

                      <span className="hidden sm:inline">
                        Summon to Room 1
                      </span>

                      <span className="sm:hidden">
                        Summon
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 sm:p-6 space-y-3.5 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
                {currentThreadMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                    <MessageSquare
                      size={28}
                      className="text-slate-500"
                    />

                    <p>
                      No messages yet with{" "}
                      {selectedContact.name}.
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Type a message below or use quick
                      clinical instructions.
                    </p>
                  </div>
                ) : (
                  currentThreadMessages.map((msg) => {
                    const isDoctor =
                      msg.senderId === "doctor";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isDoctor
                            ? "items-end"
                            : "items-start"
                          }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold uppercase">
                          <span>
                            {isDoctor
                              ? `You (${doctor?.name || "Doctor"})`
                              : msg.senderName}
                          </span>

                          <span>•</span>

                          <span>{msg.time}</span>
                        </div>

                        <div
                          className={`max-w-lg p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${isDoctor
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
                  <Sparkles
                    size={11}
                    className="text-blue-400"
                  />{" "}
                  Quick:
                </span>

                {QUICK_CLINICAL_TEMPLATES.map(
                  (template, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleSendMessage(template)
                      }
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200/80 dark:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {template}
                    </button>
                  )
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 sm:p-4 bg-white dark:bg-[#131E2E] border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder={`Message ${selectedContact.name}... (Press Enter to send)`}
                  value={inputText}
                  onChange={(event) =>
                    setInputText(event.target.value)
                  }
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}