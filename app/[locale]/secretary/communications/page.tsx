
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Search,
  SendHorizontal,
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
  type: "doctor" | "secretary" | "broadcast";
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: "secretary" | string;
  senderName: string;
  text: string;
  time: string;
}

interface SecretaryUser {
  id: string;
  clerk_user_id: string;
  email: string;
  name: string;
  phone: string | null;
  permissions: string[];
  avatar_url: string | null;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  clinic_id: string;
}

interface ContactApiResponse {
  success: boolean;
  clinicId?: string;
  contacts?: Array<{
    id: string;
    clerk_user_id: string;
    name: string;
    email: string;
    role: string;
    type: "doctor" | "secretary";
    avatar_url: string | null;
    clinic_id: string;
    isOnline: boolean;
  }>;
  error?: string;
}

interface AuthMeResponse {
  success: boolean;
  role?: string;
  user?: SecretaryUser;
  error?: string;
}

const QUICK_SECRETARY_TEMPLATES = [
  "Patient has arrived and is waiting in reception.",
  "CBC & Lab test results are attached to patient sheet.",
  "Patient requested 5-minute consultation delay.",
  "Follow-up appointment booked for next week.",
  "Patient is asking about prescription renewal.",
];

const BROADCAST_CONTACT: StaffContact = {
  id: "broadcast",
  name: "📢 All Clinic Team Broadcast",
  role: "General Announcements",
  avatarBg: "bg-purple-600",
  isOnline: true,
  unreadCount: 0,
  lastMessage: "",
  lastMessageTime: "",
  channelId: "broadcast",
  type: "broadcast",
};

function getAvatarBackground(
  type: "doctor" | "secretary" | "broadcast"
): string {
  if (type === "doctor") {
    return "bg-blue-600";
  }

  if (type === "secretary") {
    return "bg-teal-600";
  }

  return "bg-purple-600";
}

function getContactIdForChannel(
  channelId: string,
  contacts: StaffContact[]
): string {
  if (channelId === "broadcast") {
    return "broadcast";
  }

  if (channelId === "doctor_secretary_direct") {
    const firstDoctor = contacts.find(
      (contact) => contact.type === "doctor"
    );

    return firstDoctor?.id || "doctor_secretary_direct";
  }

  if (channelId.startsWith("direct:")) {
    return channelId.replace("direct:", "");
  }

  return channelId;
}

function getChannelForContactId(
  contactId: string,
  contacts: StaffContact[]
): string {
  if (contactId === "broadcast") {
    return "broadcast";
  }

  const contact = contacts.find((item) => item.id === contactId);

  if (!contact) {
    return `direct:${contactId}`;
  }

  /*
   * Keep the existing doctor_secretary_direct channel for the
   * first doctor so existing internal messages remain compatible.
   */
  if (contact.type === "doctor") {
    const firstDoctor = contacts.find(
      (item) => item.type === "doctor"
    );

    if (firstDoctor?.id === contactId) {
      return "doctor_secretary_direct";
    }
  }

  return `direct:${contactId}`;
}

export default function SecretaryCommunicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [secretary, setSecretary] =
    useState<SecretaryUser | null>(null);

  const [clinicId, setClinicId] = useState<string | null>(null);

  const [contactList, setContactList] = useState<StaffContact[]>([]);

  const [selectedContactId, setSelectedContactId] =
    useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedContactIdRef = useRef(selectedContactId);

  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;
  }, [selectedContactId]);

  const selectedContact = contactList.find(
    (contact) => contact.id === selectedContactId
  );

  /*
   * Load the current secretary and real clinic contacts.
   */
  useEffect(() => {
    async function loadContacts() {
      try {
        setLoadingContacts(true);
        setContactsError("");

        const [authResponse, contactsResponse] =
          await Promise.all([
            fetch("/api/auth/me", {
              cache: "no-store",
            }),
            fetch("/api/secretary/contacts", {
              cache: "no-store",
            }),
          ]);

        const authData: AuthMeResponse =
          await authResponse.json();

        const contactsData: ContactApiResponse =
          await contactsResponse.json();

        if (
          !authResponse.ok ||
          !authData.success ||
          authData.role !== "secretary" ||
          !authData.user
        ) {
          throw new Error(
            authData.error || "Failed to load secretary account"
          );
        }

        if (
          !contactsResponse.ok ||
          !contactsData.success
        ) {
          throw new Error(
            contactsData.error ||
              "Failed to load clinic contacts"
          );
        }

        const currentSecretary = authData.user;

        setSecretary(currentSecretary);
        setClinicId(
          contactsData.clinicId ||
            currentSecretary.clinic_id ||
            null
        );

        const dynamicContacts: StaffContact[] = (
          contactsData.contacts || []
        ).map((contact) => ({
          id: contact.id,
          name: contact.name,
          role: contact.role,
          avatarBg: getAvatarBackground(contact.type),
          isOnline: Boolean(contact.isOnline),
          unreadCount: 0,
          lastMessage: "",
          lastMessageTime: "",
          channelId:
            contact.type === "doctor"
              ? "direct:" + contact.id
              : "direct:" + contact.id,
          type: contact.type,
        }));

        const finalContacts = [
          BROADCAST_CONTACT,
          ...dynamicContacts,
        ];

        setContactList(finalContacts);

        /*
         * Select the first real doctor by default.
         * If there are no doctors, select the first available contact.
         */
        const firstDoctor = dynamicContacts.find(
          (contact) => contact.type === "doctor"
        );

        const defaultContact =
          firstDoctor || dynamicContacts[0] || BROADCAST_CONTACT;

        setSelectedContactId(defaultContact.id);
      } catch (error) {
        console.error(
          "Load secretary communications contacts error:",
          error
        );

        setContactsError(
          error instanceof Error
            ? error.message
            : "Failed to load clinic contacts"
        );
      } finally {
        setLoadingContacts(false);
      }
    }

    loadContacts();
  }, []);

  /*
   * Load existing chat messages after contacts are available.
   */
  useEffect(() => {
    if (
      loadingContacts ||
      contactList.length === 0
    ) {
      return;
    }

    async function loadChatHistory() {
      try {
        const stored = await fetchInternalMessages();

        if (!stored || stored.length === 0) {
          return;
        }

        const mapped: ChatMessage[] = stored.map(
          (message: InternalChatMessage) => ({
            id: message.id,
            conversationId: getContactIdForChannel(
              message.channelId,
              contactList
            ),
            senderId: message.senderRole,
            senderName: message.senderName,
            text: message.content,
            time: message.sentAt,
          })
        );

        setMessages(mapped);

        /*
         * Update sidebar snippets from real stored messages.
         */
        setContactList((prev) =>
          prev.map((contact) => {
            const channelId = getChannelForContactId(
              contact.id,
              prev
            );

            const contactMessages = stored.filter(
              (message) =>
                message.channelId === channelId
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
  }, [loadingContacts, contactList.length]);

  /*
   * Auto scroll to bottom.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, selectedContactId]);

  const handleSelectContact = useCallback(
    (id: string) => {
      setSelectedContactId(id);

      setContactList((prev) =>
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
        contactList
      );

      markInternalMessagesAsRead(
        channelId,
        "secretary"
      );
    },
    [contactList]
  );

  /*
   * Real-time listener for incoming messages.
   */
  useEffect(() => {
    if (!secretary) {
      return;
    }

    const unsub = realtimeBus.subscribe(
      (event: RealtimeEvent) => {
        if (event.type !== "CHAT_MESSAGE") {
          return;
        }

        const incoming = event.payload;

        /*
         * Ignore messages sent by the current secretary.
         * We use the real secretary name instead of hardcoded
         * Sarah Jenkins.
         */
        if (
          incoming.senderRole === "secretary" &&
          incoming.senderName === secretary.name
        ) {
          return;
        }

        const channelId =
          incoming.channelId || "doctor_secretary_direct";

        const targetContactId =
          getContactIdForChannel(
            channelId,
            contactList
          );

        const newMsg: ChatMessage = {
          id: incoming.id,
          conversationId: targetContactId,
          senderId: incoming.senderRole,
          senderName: incoming.senderName,
          text: incoming.text,
          time: incoming.time,
        };

        setMessages((prev) => {
          if (
            prev.some(
              (message) => message.id === incoming.id
            )
          ) {
            return prev;
          }

          return [...prev, newMsg];
        });

        const activeId =
          selectedContactIdRef.current;

        const isCurrentThread =
          targetContactId === activeId;

        setContactList((prev) =>
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
                  handleSelectContact(
                    targetContactId
                  ),
              },
            }
          );
        }
      }
    );

    return () => unsub();
  }, [
    secretary,
    contactList,
    handleSelectContact,
  ]);

  const handleSendMessage = async (
    textToSend?: string
  ) => {
    if (!secretary || !clinicId || !selectedContact) {
      return;
    }

    const content = (
      textToSend || inputText
    ).trim();

    if (!content) {
      return;
    }

    const channelId = getChannelForContactId(
      selectedContactId,
      contactList
    );

    const timeStr = new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      conversationId: selectedContactId,
      senderId: "secretary",
      senderName: `${secretary.name} (Reception)`,
      text: content,
      time: timeStr,
    };

    /*
     * 1. Immediately update local UI.
     */
    setMessages((prev) => [
      ...prev,
      newMsg,
    ]);

    /*
     * 2. Update sidebar.
     */
    setContactList((prev) =>
      prev.map((contact) =>
        contact.id === selectedContactId
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
     * 3. Save using the real secretary and clinic.
     */
    try {
      await saveInternalMessage({
        id: newMsg.id,
        channelId,
        senderRole: "secretary",
        senderName: newMsg.senderName,
        content,
        sentAt: timeStr,
        isRead: false,
        clinicId,
      });
    } catch (error) {
      console.warn(
        "Failed saving internal message:",
        error
      );
    }

    /*
     * 4. Publish to realtime bus.
     */
    realtimeBus.publish(
      {
        type: "CHAT_MESSAGE",
        payload: {
          id: newMsg.id,
          channelId,
          senderRole: "secretary",
          sender: "secretary",
          senderName: newMsg.senderName,
          receiverRole:
            selectedContact.type === "broadcast"
              ? "all"
              : "doctor",
          text: content,
          time: timeStr,
          clinicId,
        },
      },
      false
    );
  };

  /*
   * Send discreet note to doctor.
   */
  const handleSendQuietAlert = () => {
    const note = prompt(
      "Enter discreet note for Doctor (will appear quietly on doctor's screen):",
      "Next patient is waiting outside."
    );

    if (!note?.trim()) {
      return;
    }

    realtimeBus.publish(
      {
        type: "SECRETARY_DISCREET_ALERT",
        payload: {
          message: note.trim(),
          time: new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        },
      },
      true
    );

    toast.success(
      "Quiet alert delivered directly to Doctor's examination screen."
    );
  };

  const currentThreadMessages =
    messages.filter(
      (message) =>
        message.conversationId ===
        selectedContactId
    );

  const filteredContacts =
    contactList.filter(
      (contact) =>
        contact.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        contact.role
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );

  if (loadingContacts) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] flex items-center justify-center">
        <p className="text-sm text-slate-400">
          Loading clinic contacts...
        </p>
      </div>
    );
  }

  if (contactsError) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500">
            Failed to load clinic contacts.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            {contactsError}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedContact) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] flex items-center justify-center">
        <div className="text-center">
          <MessageSquare
            size={28}
            className="mx-auto text-slate-500 mb-2"
          />

          <p className="text-sm font-semibold text-slate-500">
            No clinic contacts available.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Add a doctor or secretary to this clinic
            to start communicating.
          </p>
        </div>
      </div>
    );
  }

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
        {/* Left Column */}
        <div className="md:col-span-1 border-r border-slate-200/80 dark:border-slate-800 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/40">
          {/* Search */}
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search
                className="doctech-input-icon"
                size={15}
              />

              <input
                type="text"
                placeholder="Search doctors or staff..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="doctech-input !h-9 text-xs"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {filteredContacts.map((contact) => {
              const isSelected =
                contact.id === selectedContactId;

              return (
                <div
                  key={contact.id}
                  onClick={() =>
                    handleSelectContact(contact.id)
                  }
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
                        {contact.type ===
                        "broadcast"
                          ? "📢"
                          : contact.name
                              .split(" ")
                              .map(
                                (name) =>
                                  name[0]
                              )
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                      </div>

                      {contact.isOnline &&
                        contact.type !==
                          "broadcast" && (
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
                        className={`text-[10px] truncate ${
                          isSelected
                            ? "text-teal-100"
                            : "text-slate-400"
                        }`}
                      >
                        {contact.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-medium ${
                        isSelected
                          ? "text-teal-200"
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
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col min-h-0 bg-white dark:bg-[#131E2E]">
          {/* Active Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-900/30 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl ${selectedContact.avatarBg} text-white font-extrabold text-sm flex items-center justify-center shrink-0`}
              >
                {selectedContact.type ===
                "broadcast"
                  ? "📢"
                  : selectedContact.name
                      .split(" ")
                      .map(
                        (name) => name[0]
                      )
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
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

            {/* Quiet Alert */}
            {selectedContact.type === "doctor" && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSendQuietAlert}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-950/60 text-[#36ADA3] border border-[#36ADA3]/40 hover:bg-teal-900/50 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  title="Send discreet note directly to doctor screen"
                >
                  <SendHorizontal size={13} />

                  <span className="hidden sm:inline">
                    Send Quiet Note
                  </span>

                  <span className="sm:hidden">
                    Note
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
                  Type a message below or use quick intake templates.
                </p>
              </div>
            ) : (
              currentThreadMessages.map(
                (message) => {
                  const isSecretary =
                    message.senderId ===
                    "secretary";

                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        isSecretary
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-bold uppercase">
                        <span>
                          {isSecretary
                            ? `You (${secretary?.name || "Secretary"})`
                            : message.senderName}
                        </span>

                        <span>•</span>

                        <span>
                          {message.time}
                        </span>
                      </div>

                      <div
                        className={`max-w-lg p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                          isSecretary
                            ? "bg-[#36ADA3] text-white rounded-br-none"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-bl-none"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  );
                }
              )
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Templates */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles
                size={11}
                className="text-teal-400"
              />

              Quick:
            </span>

            {QUICK_SECRETARY_TEMPLATES.map(
              (template, index) => (
                <button
                  key={index}
                  onClick={() =>
                    handleSendMessage(
                      template
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-950/50 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200/80 dark:border-slate-700 whitespace-nowrap transition-colors cursor-pointer"
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