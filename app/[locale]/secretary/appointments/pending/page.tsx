"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bot, ArrowLeft, Check, X, Calendar, Clock, Phone, Sparkles, MessageCircle, Inbox } from "lucide-react";
import { toast } from "sonner";

import type { AppointmentListItem } from "@/types/index";

type PendingBooking = AppointmentListItem;

function formatReceivedAt(iso: string | undefined, isRTL: boolean): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const diffMs = Date.now() - at.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return isRTL ? "الآن" : "just now";
  if (mins < 60) return isRTL ? `منذ ${mins} دقيقة` : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return isRTL ? `منذ ${days} يوم` : `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function PendingAIBookingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [requests, setRequests] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPending() {
      try {
        const res = await fetch("/api/appointments");
        const json = await res.json().catch(() => ({} as Record<string, unknown>));
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) {
          const pending = (json.data as AppointmentListItem[]).filter(
            (a) => a.bookingStatus === "PENDING_REVIEW"
          );
          setRequests(pending);
        } else {
          toast.error(String(json.error || (isRTL ? "تعذّر تحميل الطلبات" : "Could not load requests")));
        }
      } catch (err) {
        console.error("Failed to load pending bookings:", err);
        if (!cancelled) {
          toast.error(isRTL ? "تعذّر تحميل الطلبات" : "Could not load requests");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPending();
    return () => {
      cancelled = true;
    };
  }, [isRTL]);

  const applyDecision = async (
    id: string,
    patch: { bookingStatus: "APPROVED" | "REJECTED"; status?: string },
    successMsg: string
  ) => {
    let previous: PendingBooking | undefined;
    setBusyId(id);
    setRequests((cur) => {
      previous = cur.find((r) => r.id === id);
      return cur.filter((r) => r.id !== id);
    });

    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || !json.success) {
        throw new Error(String(json.error || `HTTP ${res.status}`));
      }
      toast.success(successMsg);
    } catch (err) {
      console.error("Pending booking decision failed:", err);
      if (previous) {
        const snapshot = previous;
        setRequests((cur) => (cur.some((r) => r.id === id) ? cur : [snapshot, ...cur]));
      }
      toast.error(isRTL ? "تعذّر حفظ القرار" : "Could not save the decision");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (req: PendingBooking) => {
    void applyDecision(
      req.id,
      { bookingStatus: "APPROVED", status: "CONFIRMED" },
      isRTL
        ? `✅ تم تأكيد حجز المريض ${req.patientName}`
        : `✅ Booking confirmed for ${req.patientName}`
    );
  };

  const handleReject = (req: PendingBooking) => {
    void applyDecision(
      req.id,
      { bookingStatus: "REJECTED" },
      isRTL
        ? `تم رفض طلب ${req.patientName} وتحرير الموعد`
        : `Booking request from ${req.patientName} rejected and the slot released`
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href={`/${locale}/secretary/appointments`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى جدول المواعيد" : "Back to Appointments Registry"}</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-1.5">
            <Bot size={13} />
            <span>{isRTL ? "وكيل الحجز الذكي" : "Smart Booking Agent"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRTL ? "مراجعة طلبات الحجز القادمة من الواتساب" : "WhatsApp Booking Queue"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "مراجعة واعتماد طلبات الحجز الواردة قبل التثبيت النهائي في الجدول"
              : "Review incoming booking requests before they are confirmed in the schedule"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
            {loading
              ? isRTL
                ? "جارٍ التحميل…"
                : "Loading…"
              : isRTL
                ? `${requests.length} طلبات قيد الانتظار`
                : `${requests.length} Pending Review`}
          </span>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-[#131E2E] p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            {isRTL ? "جارٍ تحميل طلبات الحجز…" : "Loading booking requests…"}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-[#131E2E] p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Inbox size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isRTL ? "لا توجد طلبات بانتظار المراجعة" : "No Booking Requests Awaiting Review"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRTL
                ? "ستظهر هنا الطلبات الواردة عبر الواتساب التي لم تُعتمد بعد"
                : "WhatsApp booking requests that are not confirmed yet will appear here."}
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-extrabold text-sm flex items-center justify-center">
                    {req.patientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{req.patientName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Phone size={11} />
                      <span>{req.patientPhone}</span>
                      {formatReceivedAt(req.createdAt, isRTL) && (
                        <span>• {formatReceivedAt(req.createdAt, isRTL)}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>{req.source || "whatsapp"}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">({req.id.slice(0, 8)})</span>
                </div>
              </div>

              {/* Slot & Symptoms info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-400 text-[10px] uppercase">
                    {isRTL ? "الموعد المطلوب" : "Requested Slot"}
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <Calendar size={13} className="text-[#0891B2]" />
                    <span>{req.date}</span>
                    <span>•</span>
                    <Clock size={13} className="text-[#0891B2]" />
                    <span>{req.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isRTL ? `مع: ${req.doctorName}` : `With: ${req.doctorName}`}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-400 text-[10px] uppercase">
                    {isRTL ? "شكوى المريض" : "Patient's Reason"}
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {req.notes?.trim()
                      ? req.notes
                      : isRTL
                        ? "لم يُسجَّل نص للطلب"
                        : "No message captured for this request"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <Link
                  href={`/${locale}/secretary/whatsapp`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle size={14} />
                  <span>{isRTL ? "عرض المحادثة الكاملة على واتساب" : "View Full WhatsApp Transcript"}</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(req)}
                    disabled={busyId === req.id}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                    <span>{isRTL ? "رفض الطلب" : "Reject"}</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req)}
                    disabled={busyId === req.id}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Check size={14} />
                    <span>{isRTL ? "تأكيد واعتماد الموعد" : "Approve & Confirm"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
