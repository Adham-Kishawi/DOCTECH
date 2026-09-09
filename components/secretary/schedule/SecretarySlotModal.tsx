"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  MessageCircle,
  FileText,
  Ban,
  CheckCircle2,
  Stethoscope,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { ScheduleSlot } from "@/lib/schedule/scheduleData";
import { CLINIC_DOCTORS } from "@/lib/doctor/historyData";
import { toast } from "sonner";

interface SecretarySlotModalProps {
  slot: ScheduleSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSlot: (updated: ScheduleSlot) => void;
  isRTL: boolean;
}

export function SecretarySlotModal({
  slot,
  isOpen,
  onClose,
  onUpdateSlot,
  isRTL,
}: SecretarySlotModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Booking form fields
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("35");
  const [appointmentType, setAppointmentType] = useState("New Consultation");
  const [appointmentTypeAr, setAppointmentTypeAr] = useState("كشف جديد");
  const [fee, setFee] = useState("400");
  const [notes, setNotes] = useState("");
  const [blockReason, setBlockReason] = useState("Doctor break / Clinical duties");

  useEffect(() => {
    if (slot) {
      setPatientName(slot.patientName || "");
      setPatientPhone(slot.patientPhone || "");
      setPatientAge(slot.patientAge ? String(slot.patientAge) : "35");
      setAppointmentType(slot.appointmentType || "New Consultation");
      setAppointmentTypeAr(slot.appointmentTypeAr || "كشف جديد");
      setFee(slot.fee ? String(slot.fee) : "400");
      setNotes(slot.notes || "");
      setBlockReason(slot.notes || (isRTL ? "استراحة الطبيب / مهام إكلينيكية" : "Doctor break / Clinical duties"));
    }
  }, [slot, isRTL]);

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

  const handleBookSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم المريض" : "Please enter patient name");
      return;
    }

    const updated: ScheduleSlot = {
      ...slot,
      status: "BOOKED",
      patientName: patientName.trim(),
      patientNameAr: patientName.trim(),
      patientPhone: patientPhone.trim() || "+20 100 000 0000",
      patientAge: parseInt(patientAge) || 30,
      appointmentType,
      appointmentTypeAr,
      fee: parseFloat(fee) || 400,
      notes,
    };

    onUpdateSlot(updated);
    toast.success(isRTL ? "تم حجز الفترة بنجاح ✓" : "Slot booked successfully ✓");
    onClose();
  };

  const handleBlockSlot = () => {
    const updated: ScheduleSlot = {
      ...slot,
      status: "BLOCKED",
      notes: blockReason,
    };
    onUpdateSlot(updated);
    toast.warning(isRTL ? "تم حجب الفترة الزمنية" : "Slot blocked");
    onClose();
  };

  const handleUnblockSlot = () => {
    const updated: ScheduleSlot = {
      ...slot,
      status: "AVAILABLE",
      notes: undefined,
    };
    onUpdateSlot(updated);
    toast.success(isRTL ? "تم فتح الفترة وإتاحتها للحجز" : "Slot is now open & available");
    onClose();
  };

  const handleCancelBooking = () => {
    const updated: ScheduleSlot = {
      ...slot,
      status: "AVAILABLE",
      patientName: undefined,
      patientNameAr: undefined,
      patientPhone: undefined,
      patientAge: undefined,
      appointmentType: undefined,
      appointmentTypeAr: undefined,
      fee: undefined,
      notes: undefined,
    };
    onUpdateSlot(updated);
    toast.info(isRTL ? "تم إلغاء الحجز وإعادة إتاحة الفترة" : "Booking cancelled. Slot is now available.");
    onClose();
  };

  const handleWhatsAppChat = () => {
    if (!slot.patientPhone) return;
    const cleanPhone = slot.patientPhone.replace(/[^0-9]/g, "");
    const msg = isRTL
      ? `مرحباً أستاذ/ة ${slot.patientNameAr}، نذكرك بموعدك مع ${slot.doctorNameAr} يوم ${slot.dayAr} الساعة ${slot.time}. نتمنى لك دوام الصحة والعافية.`
      : `Dear ${slot.patientName}, reminding you of your consultation with ${slot.doctorName} on ${slot.dayEn} at ${slot.time}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

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
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    slot.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : slot.status === "BLOCKED"
                      ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                  }`}
                >
                  {slot.status === "AVAILABLE"
                    ? isRTL ? "متاح للحجز" : "Open Slot"
                    : slot.status === "BLOCKED"
                    ? isRTL ? "محجوب / استراحة" : "Blocked"
                    : isRTL ? "محجوز" : "Booked"}
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
          {/* CASE 1: SLOT IS AVAILABLE -> BOOKING FORM */}
          {slot.status === "AVAILABLE" && (
            <form onSubmit={handleBookSlot} className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isRTL ? "تسجيل مريض في هذه الفترة:" : "Book Patient into this slot:"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isRTL ? "اسم المريض *" : "Patient Name *"}
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder={isRTL ? "اسم المريض ثلاثي..." : "Full patient name..."}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="doctech-input !h-10 text-xs !pl-10 !pr-10"
                    dir="auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isRTL ? "رقم الهاتف" : "Phone"}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+20 100 000 0000"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="doctech-input !h-10 text-xs !pl-10 !pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isRTL ? "العمر" : "Age"}
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="doctech-input !h-10 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isRTL ? "نوع الكشف" : "Consultation Type"}
                  </label>
                  <select
                    value={appointmentType}
                    onChange={(e) => {
                      setAppointmentType(e.target.value);
                      if (e.target.value === "New Consultation") {
                        setAppointmentTypeAr("كشف جديد");
                        setFee("400");
                      } else if (e.target.value === "Follow-up") {
                        setAppointmentTypeAr("كشف متابعة");
                        setFee("200");
                      } else {
                        setAppointmentTypeAr("استشارة مستعجلة");
                        setFee("300");
                      }
                    }}
                    className="h-10 w-full px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="New Consultation">{isRTL ? "كشف مريض جديد" : "New Consultation"}</option>
                    <option value="Follow-up">{isRTL ? "متابعة واستشارة" : "Follow-up Check"}</option>
                    <option value="Urgent Check">{isRTL ? "فحص طارئ" : "Urgent Check"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {isRTL ? "قيمة الكشف (ج.م)" : "Fee (EGP)"}
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 rtl:left-auto rtl:right-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="doctech-input !h-10 text-xs !pl-9 !pr-9 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isRTL ? "ملاحظات الحجز" : "Notes"}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isRTL ? "أي ملاحظات إضافية أو أعراض..." : "Add intake notes..."}
                  className="doctech-input !min-h-[50px] text-xs resize-none"
                  dir="auto"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 h-10 px-4 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <CheckCircle2 size={15} />
                  <span>{isRTL ? "تأكيد حجز الفترة" : "Confirm Slot Booking"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBlockSlot}
                  className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isRTL ? "حجب الفترة / استراحة للطبيب" : "Block Slot"}
                >
                  <Lock size={14} />
                  <span>{isRTL ? "حجب الفترة" : "Block"}</span>
                </button>
              </div>
            </form>
          )}

          {/* CASE 2: SLOT IS BOOKED -> DETAILS & ACTIONS */}
          {(slot.status === "BOOKED" || slot.status === "IN_PROGRESS" || slot.status === "COMPLETED") && (
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

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {slot.fee} EGP
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>📞 <span dir="ltr">{slot.patientPhone}</span></span>
                  <span>👤 {slot.patientAge} {isRTL ? "سنة" : "yrs"}</span>
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
                  onClick={handleCancelBooking}
                  className="h-10 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{isRTL ? "إلغاء الحجز" : "Cancel"}</span>
                </button>
              </div>
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
                  {slot.notes || (isRTL ? "فترة استراحة للطبيب أو غير متاحة للحجز" : "Doctor break or unavailable for booking")}
                </p>
              </div>

              <button
                type="button"
                onClick={handleUnblockSlot}
                className="h-10 px-5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Unlock size={14} />
                <span>{isRTL ? "فك الحجب وإتاحة الفترة للحجز" : "Unblock Slot"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
