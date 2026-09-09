"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bell, CalendarCheck, MessageCircle, FileText, Check, MessageSquare, Bot
} from "lucide-react";
import { fetchNotifications, markAllNotificationsRead, SystemNotification } from "@/lib/notificationService";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";

export default function SecretaryNotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [items, setItems] = useState<SystemNotification[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const notifs = await fetchNotifications("secretary");
        setItems(notifs);
      } catch (e) {
        console.warn("Failed loading secretary notifications:", e);
      }
    }
    load();
  }, []);

  // Realtime updates
  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "NOTIFICATION_RECEIVED") {
        const p = event.payload;
        const newNotif: SystemNotification = {
          id: p.id,
          clinicId: "cln-001",
          role: "secretary",
          type: (p.type as SystemNotification["type"]) || "SYSTEM",
          title: p.title,
          titleAr: p.title,
          body: p.body,
          bodyAr: p.body,
          time: "Just now",
          isRead: false,
          link: "communications",
          createdAt: p.createdAt,
        };
        setItems((prev) => [newNotif, ...prev]);
      } else if (event.type === "CHAT_MESSAGE") {
        const msg = event.payload;
        if (msg.senderRole === "doctor") {
          const newNotif: SystemNotification = {
            id: `notif-chat-${msg.id}`,
            clinicId: "cln-001",
            role: "secretary",
            type: "INTERNAL_MESSAGE",
            title: `Doctor Clinical Note: ${msg.senderName}`,
            titleAr: `توجيه سريري من: ${msg.senderName}`,
            body: msg.text,
            bodyAr: msg.text,
            time: "Just now",
            isRead: false,
            link: "communications",
            createdAt: new Date().toISOString(),
          };
          setItems((prev) => [newNotif, ...prev]);
        }
      }
    });

    return () => unsub();
  }, []);

  const markAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    await markAllNotificationsRead("secretary");
  };

  const getIconData = (type: SystemNotification["type"]) => {
    switch (type) {
      case "INTERNAL_MESSAGE":
        return { icon: MessageSquare, color: "text-[#36ADA3] bg-teal-50 dark:bg-teal-950/40" };
      case "AI_BOOKING_REQUEST":
        return { icon: Bot, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" };
      case "NEW_APPOINTMENT":
        return { icon: CalendarCheck, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" };
      case "NEW_REPORT":
        return { icon: FileText, color: "text-red-600 bg-red-50 dark:bg-red-950/40" };
      case "WHATSAPP_MESSAGE":
        return { icon: MessageCircle, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40" };
      default:
        return { icon: Bell, color: "text-slate-600 bg-slate-100 dark:bg-slate-800" };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 mb-1.5">
            <Bell size={13} />
            {isRTL ? "مركز تنبيهات الاستقبال" : "Reception Operational Feed"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "متابعة قرارات الطبيب ورسائل الواتساب الواردة والمحادثات المباشرة"
              : "Live activity regarding doctor instructions, incoming WhatsApp queries, and team messaging"}
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0891B2] dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Check size={14} />
          <span>{isRTL ? "تحديد الكل كمقروء" : "Mark all as read"}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {isRTL ? "لا توجد إشعارات حاليًا" : "No notifications right now"}
          </div>
        ) : (
          items.map((item) => {
            const { icon: Icon, color } = getIconData(item.type);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.link) {
                    router.push(`/${locale}/secretary/${item.link}`);
                  }
                }}
                className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                  !item.isRead ? "bg-cyan-50/30 dark:bg-cyan-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {isRTL ? item.titleAr : item.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                    {isRTL ? item.bodyAr : item.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}