"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bot, ArrowLeft, Check, X, Calendar, Clock, Phone, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface PendingBooking {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  requestedDate: string;
  requestedTime: string;
  symptoms: string;
  aiConfidence: number;
  waConversationId: string;
  receivedAt: string;
}

const mockPendingBookings: PendingBooking[] = [
  {
    id: "REQ-901",
    patientName: "Sara Ibrahim",
    patientPhone: "+20 102 345 6789",
    doctorName: "Dr. Clinical Lead",
    requestedDate: "Today, Sep 2",
    requestedTime: "10:30 AM",
    symptoms: "Severe pulsating headache on the right side with nausea for 3 days.",
    aiConfidence: 96,
    waConversationId: "conv-102",
    receivedAt: "10 minutes ago",
  },
  {
    id: "REQ-902",
    patientName: "Mahmoud Reda",
    patientPhone: "+20 109 876 5432",
    doctorName: "Dr. Clinical Lead",
    requestedDate: "Tomorrow, Sep 3",
    requestedTime: "11:00 AM",
    symptoms: "Routine diabetes check-up and HbA1c review.",
    aiConfidence: 92,
    waConversationId: "conv-103",
    receivedAt: "25 minutes ago",
  },
  {
    id: "REQ-903",
    patientName: "Hoda Mansour",
    patientPhone: "+20 111 222 3344",
    doctorName: "Dr. Clinical Lead",
    requestedDate: "Thursday, Sep 4",
    requestedTime: "01:30 PM",
    symptoms: "Knee pain after light jogging, requested consultation.",
    aiConfidence: 88,
    waConversationId: "conv-104",
    receivedAt: "1 hour ago",
  },
];

export default function PendingAIBookingsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [requests, setRequests] = useState<PendingBooking[]>(mockPendingBookings);

  const handleApprove = (id: string, name: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success(
      isRTL
        ? `✅ تم تأكيد حجز المريض ${name} وإرسال رسالة واتساب بالتأكيد والموعد!`
        : `✅ Booking confirmed for ${name}! WhatsApp confirmation sent.`
    );
  };

  const handleReject = (id: string, name: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.info(
      isRTL
        ? `تم رفض الطلب وإبلاغ المريض ${name} بالمواعيد البديلة عبر الواتساب.`
        : `Booking request declined for ${name}. Alternative slots sent via WhatsApp.`
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
            {isRTL ? "مراجعة طلبات الحجز القادمة من الواتساب" : "WhatsApp AI Booking Queue"}
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {isRTL
              ? "مراجعة بشرية للطلبات المجمعة تلقائياً قبل التثبيت النهائي (Human-in-the-Loop)"
              : "Human-in-the-loop review queue for AI-assisted bookings before final confirmation"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
            {isRTL ? `${requests.length} طلبات قيد الانتظار` : `${requests.length} Pending Review`}
          </span>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-[#131E2E] p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isRTL ? "تمت مراجعة جميع الطلبات بنجاح!" : "All AI Booking Requests Reviewed!"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRTL ? "لا توجد طلبات معلقة في الوقت الحالي" : "No pending booking requests at the moment."}
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
                    {req.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{req.patientName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Phone size={11} />
                      <span>{req.patientPhone}</span>
                      <span>•</span>
                      <span>{req.receivedAt}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>AI Confidence: {req.aiConfidence}%</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">({req.id})</span>
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
                    <span>{req.requestedDate}</span>
                    <span>•</span>
                    <Clock size={13} className="text-[#0891B2]" />
                    <span>{req.requestedTime}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isRTL ? `مع: ${req.doctorName}` : `With: ${req.doctorName}`}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-400 text-[10px] uppercase">
                    {isRTL ? "شكوى المريض المستخلصة بالـ AI" : "Extracted Symptoms & Reason"}
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {req.symptoms}
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
                    onClick={() => handleReject(req.id, req.patientName)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X size={14} />
                    <span>{isRTL ? "رفض / اقتراح بديل" : "Reject / Suggest Other"}</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req.id, req.patientName)}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
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
