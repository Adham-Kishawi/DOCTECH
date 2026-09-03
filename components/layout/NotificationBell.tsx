"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Clock, Bot, Calendar, AlertCircle, X, MessageSquare } from "lucide-react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import { fetchNotifications, markAllNotificationsRead, SystemNotification } from "@/lib/notificationService";

export interface AppNotification {
  id: string;
  type: "NEW_APPOINTMENT" | "AI_BOOKING_REQUEST" | "APPOINTMENT_CANCELLED" | "NEW_REPORT" | "SYSTEM" | "INTERNAL_MESSAGE" | "WHATSAPP_MESSAGE";
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  time: string;
  isRead: boolean;
  link: string;
}

interface NotificationBellProps {
  role: "doctor" | "secretary";
  locale: string;
  isRTL: boolean;
}

export function NotificationBell({ role, locale, isRTL }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Initial load from persistent cache / backend
  useEffect(() => {
    async function loadNotifs() {
      try {
        const notifs = await fetchNotifications(role);
        setNotifications(
          notifs.map((n) => ({
            id: n.id,
            type: (n.type as AppNotification["type"]) || "SYSTEM",
            title: n.title,
            titleAr: n.titleAr || n.title,
            body: n.body,
            bodyAr: n.bodyAr || n.body,
            time: n.time,
            isRead: n.isRead,
            link: n.link || "notifications",
          }))
        );
      } catch (e) {
        console.warn("Failed to load notifications:", e);
      }
    }
    loadNotifs();
  }, [role]);

  // Realtime listeners for new notifications and incoming chat messages
  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "NOTIFICATION_RECEIVED") {
        const payload = event.payload;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === payload.id)) return prev;
          const newN: AppNotification = {
            id: payload.id,
            type: (payload.type as AppNotification["type"]) || "SYSTEM",
            title: payload.title,
            titleAr: payload.title,
            body: payload.body,
            bodyAr: payload.body,
            time: "Just now",
            isRead: false,
            link: "notifications",
          };
          return [newN, ...prev];
        });
      } else if (event.type === "CHAT_MESSAGE") {
        const msg = event.payload;
        // Verify message is directed to this role
        const isTarget =
          (role === "doctor" && msg.senderRole === "secretary") ||
          (role === "secretary" && msg.senderRole === "doctor") ||
          msg.receiverRole === "all";

        if (isTarget) {
          const notifId = `notif-chat-${msg.id}`;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notifId || n.id === msg.id)) return prev;
            const newN: AppNotification = {
              id: notifId,
              type: "INTERNAL_MESSAGE",
              title: isRTL
                ? `رسالة جديدة من ${msg.senderName}`
                : `New message from ${msg.senderName}`,
              titleAr: `رسالة جديدة من ${msg.senderName}`,
              body: msg.text,
              bodyAr: msg.text,
              time: "Just now",
              isRead: false,
              link: "communications",
            };
            return [newN, ...prev];
          });
        }
      }
    });

    return () => unsub();
  }, [role, isRTL]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsRead(role);
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "INTERNAL_MESSAGE":
        return <MessageSquare size={15} className="text-[#36ADA3] dark:text-[#4B85C5]" />;
      case "AI_BOOKING_REQUEST":
        return <Bot size={15} className="text-purple-600 dark:text-purple-400" />;
      case "NEW_APPOINTMENT":
        return <Calendar size={15} className="text-cyan-600 dark:text-cyan-400" />;
      case "NEW_REPORT":
        return <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell size={15} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer relative"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute z-50 top-12 ${
            isRTL ? "left-0" : "right-0"
          } w-80 sm:w-96 bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-up`}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {isRTL ? "الإشعارات والتنبيهات" : "Notifications"}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  {unreadCount} {isRTL ? "جديدة" : "new"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#3368A0] dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isRTL ? "تعيين الكل كمقروء" : "Mark all read"}
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {isRTL ? "لا توجد إشعارات حاليًا" : "No notifications"}
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={`/${locale}/${role}/${notif.link}`}
                  onClick={() => setIsOpen(false)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors block ${
                    !notif.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {isRTL ? notif.titleAr : notif.title}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {isRTL ? notif.bodyAr : notif.body}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href={`/${locale}/${role}/notifications`}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#3368A0] dark:text-blue-400 hover:underline"
            >
              {isRTL ? "عرض جميع الإشعارات السابقة ←" : "View all notifications history →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
