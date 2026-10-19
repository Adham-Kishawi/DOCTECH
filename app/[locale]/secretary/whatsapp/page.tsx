"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, Search, ArrowRight, ExternalLink } from "lucide-react";
import { CLINIC_WHATSAPP } from "@/lib/whatsapp/config";
import type { WhatsAppConversationItem } from "@/types/index";

export default function SecretaryWhatsAppPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [conversations, setConversations] = useState<WhatsAppConversationItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/whatsapp/conversations", { cache: "no-store" });
        const json = await res.json().catch(() => ({}) as Record<string, unknown>);
        if (cancelled) return;
        if (!res.ok || !json.success) {
          throw new Error(typeof json.error === "string" ? json.error : "Failed to load inbox");
        }
        setConversations((json.data as WhatsAppConversationItem[]) ?? []);
        setLoadError("");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load inbox");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(
      (chat) =>
        chat.patientName.toLowerCase().includes(query) ||
        chat.patientPhone.includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  const formatWhen = (iso: string | null): string => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const isToday = date.toDateString() === new Date().toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Designated WhatsApp Number */}
      <div className="bg-white dark:bg-[#131E2E] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 mb-1.5">
            <MessageCircle size={13} />
            {isRTL ? "محادثات الواتساب الرسمية للعيادة" : "WhatsApp Business Cloud Integration"}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isRTL ? "محادثات الواتساب" : "WhatsApp Inquiries"}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              {CLINIC_WHATSAPP.display}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "التواصل المباشر مع المرضى، تأكيد المواعيد، ومتابعة حجوزات المساعد الذكي"
              : "Live patient chat inbox powered by WhatsApp Business API"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={CLINIC_WHATSAPP.waMeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <MessageCircle size={14} />
            <span>{isRTL ? "فتح واتساب (01031445949)" : "Open WhatsApp"}</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          <a
            href={`https://web.whatsapp.com/send?phone=${CLINIC_WHATSAPP.international}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{isRTL ? "واتساب ويب" : "WhatsApp Web"}</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>
        </div>
      </div>

      <div className="bg-white dark:bg-[#131E2E] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث في المحادثات..." : "Search conversations..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400 font-medium">
            {isRTL ? "جارِ تحميل المحادثات..." : "Loading conversations..."}
          </div>
        ) : loadError ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-xs text-rose-600 font-bold">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
            >
              {isRTL ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 font-medium">
            {search.trim()
              ? isRTL
                ? "لا توجد محادثات تطابق بحثك."
                : "No conversations match your search."
              : isRTL
                ? "لا توجد محادثات واتساب بعد — تظهر هنا فور وصول أول رسالة من مريض."
                : "No WhatsApp conversations yet — the first inbound patient message shows up here."}
          </div>
        ) : (
          filtered.map((chat) => (
            <Link
              key={chat.id}
              href={`/${locale}/secretary/whatsapp/${chat.id}`}
              className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 border border-emerald-100">
                  <MessageCircle size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {chat.patientName || chat.patientPhone}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium" dir="ltr">
                      {chat.patientPhone}
                    </span>
                    {chat.status !== "OPEN" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                        {chat.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1">
                    {chat.lastMessage || (isRTL ? "لا توجد رسائل بعد" : "No messages yet")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatWhen(chat.lastMessageAt)}
                </span>
                <ArrowRight
                  size={15}
                  className={`text-slate-300 group-hover:text-emerald-600 ${isRTL ? "rotate-180" : ""}`}
                />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
