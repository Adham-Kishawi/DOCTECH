"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  X,
  Calendar,
  Clock,
  MessageCircle,
  Trash2,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { ScheduleSlot } from "@/lib/schedule/scheduleData";

interface SecretarySlotModalProps {
  slot: ScheduleSlot | null;
  isOpen: boolean;
  onClose: () => void;
  /** Cancels the backing appointment through PATCH /api/appointments. */
  onCancelBooking?: (slot: ScheduleSlot) => void;
  isRTL: boolean;
}

export function SecretarySlotModal({
  slot,
  isOpen,
  onClose,
  onCancelBooking,
  isRTL,
}: SecretarySlotModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !slot) return null;

  const isBooked =
    slot.status === "BOOKED" || slot.status === "IN_PROGRESS" || slot.status === "COMPLETED";

  const handleWhatsAppChat = () => {
    if (!slot.patientPhone) return;
    const cleanPhone = slot.patientPhone.replace(/[^0-9]/g, "");
    const msg = isRTL
      ? `مرحباً أستاذ/ة ${slot.patientNameAr}، نذكرك بموعدك مع ${slot.doctorNameAr} يوم ${slot.dayAr} الساعة ${slot.time}. نتمنى لك دوام الصحة والعافية.`
      : `Dear ${slot.patientName}, reminding you of your consultation with ${slot.doctorName} on ${slot.dayEn} at ${slot.time}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const statusLabel =
    slot.status === "AVAILABLE"
      ? isRTL
        ? "متاح للحجز"
        : "Open Slot"
      : slot.status === "BLOCKED"
        ? isRTL
          ? "محجوب / استراحة"
          : "Blocked"
        : isRTL
          ? "محجوز"
          : "Booked";

  const statusClasses =
    slot.status === "AVAILABLE"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      : slot.status === "BLOCKED"
        ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111C2B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Top Strip */}
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] flex items-center justify-center font-bold text-xs shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {slot.time}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusClasses}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isRTL ? slot.dayAr : slot.dayEn} • {isRTL ? slot.doctorNameAr : slot.doctorName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* CASE 1: SLOT IS AVAILABLE -> route into the real booking flow */}
          {slot.status === "AVAILABLE" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {isRTL ? "هذه الفترة شاغرة" : "This slot is open"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isRTL
                    ? "يتم تسجيل الحجز من شاشة الحجز الجديدة لاختيار المريض والكشف المناسب."
                    : "Bookings are created from the New Booking screen, where you pick the patient and consultation type."}
                </p>
              </div>

              <Link
                href={`/${locale}/secretary/appointments/new`}
                className="h-10 px-4 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <Calendar size={15} />
                <span>{isRTL ? "حجز مريض في هذه الفترة" : "Book a patient into this slot"}</span>
                <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </div>
          )}

          {/* CASE 2: SLOT IS BOOKED -> details & actions */}
          {isBooked && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isRTL ? "بيانات المريض المحجوز" : "Booked Patient"}
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {isRTL ? slot.patientNameAr || slot.patientName : slot.patientName}
                    </h4>
                  </div>

                  {typeof slot.fee === "number" && (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {slot.fee} EGP
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>
                    📞 <span dir="ltr">{slot.patientPhone}</span>
                  </span>
                  <span className="col-span-2">🩺 {isRTL ? slot.appointmentTypeAr || slot.appointmentType : slot.appointmentType}</span>
                </div>

                {slot.notes && (
                  <p className="text-xs text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {slot.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppChat}
                  className="flex-1 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <MessageCircle size={15} />
                  <span>{isRTL ? "محادثة وتذكير بالواتساب" : "WhatsApp Reminder"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onCancelBooking?.(slot)}
                  className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{isRTL ? "إلغاء الحجز" : "Cancel"}</span>
                </button>
              </div>

              <Link
                href={`/${locale}/secretary/appointments`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0891B2] hover:underline"
              >
                <span>{isRTL ? "عرض الموعد في سجل المواعيد" : "Open in the appointments registry"}</span>
                <ArrowRight size={13} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </div>
          )}

          {/* CASE 3: SLOT IS BLOCKED */}
          {slot.status === "BLOCKED" && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Lock size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {isRTL ? "هذه الفترة محجوبة حالياً" : "This slot is currently blocked"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {slot.notes ||
                    (isRTL ? "فترة استراحة للطبيب أو غير متاحة للحجز" : "Doctor break or unavailable for booking")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
