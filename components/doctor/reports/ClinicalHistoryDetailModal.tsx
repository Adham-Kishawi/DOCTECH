"use client";

import { useEffect, useRef } from "react";
import {
  X,
  Printer,
  MessageCircle,
  Stethoscope,
  Pill,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Phone,
  Activity,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Share2,
} from "lucide-react";
import { ClinicalHistoryItem } from "@/lib/doctor/historyData";
import { toast } from "sonner";

interface ClinicalHistoryDetailModalProps {
  item: ClinicalHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  isRTL: boolean;
}

export function ClinicalHistoryDetailModal({
  item,
  isOpen,
  onClose,
  isRTL,
}: ClinicalHistoryDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = isRTL
      ? `مرحباً ${item.patientNameAr}، مرفق ملخص الزيارة والتقرير الطبي الخاص بحضرتك (${item.recordNumber}) لدى ${item.doctorNameAr}. نتمنى لك دوام الصحة والعافية.`
      : `Dear ${item.patientName}, here is your medical visit summary (${item.recordNumber}) with ${item.doctorName}. Wishing you good health!`;

    const cleanPhone = item.patientPhone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success(isRTL ? "تم فتح محادثة الواتساب لإرسال الملخص" : "Opened WhatsApp to send patient summary");
  };

  const getTypeBadge = () => {
    switch (item.type) {
      case "CONSULTATION":
        return {
          icon: <Stethoscope size={14} />,
          text: isRTL ? "كشف سريري وتشخيص" : "Clinical Consultation",
          color: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
        };
      case "PRESCRIPTION":
        return {
          icon: <Pill size={14} />,
          text: isRTL ? "روشتة وخطة علاجية" : "Medical Prescription",
          color: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900",
        };
      case "TRIAGE_REPORT":
        return {
          icon: <AlertTriangle size={14} />,
          text: isRTL ? "تقرير فرز واستفسار" : "Triage Inquiry",
          color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
        };
    }
  };

  const badge = getTypeBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#111C2B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header Strip */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500" />

        {/* Modal Top Bar */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 ${badge.color}`}>
              {badge.icon}
              <span>{badge.text}</span>
            </div>
            <span className="font-mono text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {item.recordNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isRTL ? "طباعة" : "Print"}
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{isRTL ? "طباعة" : "Print"}</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title={isRTL ? "مشاركة عبر واتساب" : "Share via WhatsApp"}
            >
              <MessageCircle size={14} />
              <span className="hidden sm:inline">{isRTL ? "واتساب" : "WhatsApp"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100">
          
          {/* 1. Patient & Doctor Overview Header Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1A4B8C] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                {item.patientName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRTL ? item.patientNameAr : item.patientName}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.patientAge} {isRTL ? "سنة" : "yrs"} • {item.patientGender === "male" ? (isRTL ? "ذكر" : "Male") : (isRTL ? "أنثى" : "Female")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    <span dir="ltr">{item.patientPhone}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{item.date} ({item.time})</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRTL ? "الطبيب المعالج" : "Attending Doctor"}
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {isRTL ? item.doctorNameAr : item.doctorName}
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                {isRTL ? item.specialtyAr : item.specialty}
              </p>
            </div>
          </div>

          {/* 2. Patient Vitals (if available) */}
          {item.vitals && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Activity size={13} className="text-emerald-500" />
                {isRTL ? "العلامات الحيوية عند الكشف (Vitals)" : "Recorded Vital Signs"}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {item.vitals.bp && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "ضغط الدم" : "Blood Pressure"}</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{item.vitals.bp}</span>
                  </div>
                )}
                {item.vitals.heartRate && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "النبض" : "Heart Rate"}</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{item.vitals.heartRate}</span>
                  </div>
                )}
                {item.vitals.temp && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "حرارة الجسم" : "Temperature"}</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{item.vitals.temp}</span>
                  </div>
                )}
                {item.vitals.bloodSugar && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "السكر" : "Blood Sugar"}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white font-mono">{item.vitals.bloodSugar}</span>
                  </div>
                )}
                {item.vitals.weight && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "الوزن" : "Weight"}</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{item.vitals.weight}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Clinical Subject & Diagnosis */}
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isRTL ? "موضوع التقرير أو الإجراء" : "Clinical Heading"}
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isRTL ? item.titleAr : item.title}
              </h4>
            </div>

            {item.diagnosis && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                  <Stethoscope size={14} />
                  {isRTL ? "التشخيص الطبي السريري (Clinical Diagnosis):" : "Medical Diagnosis:"}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                  {isRTL ? item.diagnosisAr || item.diagnosis : item.diagnosis}
                </p>
              </div>
            )}
          </div>

          {/* 4. Symptoms / Patient Complaint */}
          {item.symptoms && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                {isRTL ? "الأعراض والشكوى السريرية" : "Presenting Symptoms & Chief Complaint"}
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {isRTL ? item.symptomsAr || item.symptoms : item.symptoms}
              </div>
            </div>
          )}

          {/* 5. Prescription Medication Table (if available) */}
          {item.medicines && item.medicines.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Pill size={14} />
                {isRTL ? "الروشتة وقائمة الأدوية الموصوفة" : "Prescribed Medications Plan"}
              </span>
              <div className="rounded-2xl border border-purple-200/70 dark:border-purple-900/50 overflow-hidden divide-y divide-purple-100 dark:divide-purple-900/40">
                {item.medicines.map((med, idx) => (
                  <div key={idx} className="p-4 bg-purple-50/20 dark:bg-purple-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {med.name}
                        </h5>
                      </div>
                      {med.notes && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-7">
                          {med.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 font-bold text-purple-800 dark:text-purple-200">
                        {isRTL ? med.frequencyAr : med.frequency}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                        ⏳ {isRTL ? med.durationAr : med.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Doctor Instructions & Notes */}
          {item.doctorNotes && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                {isRTL ? "تعليمات وتوجيهات الطبيب للمريض" : "Physician Recommendations & Follow-up Notes"}
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {isRTL ? item.doctorNotesAr || item.doctorNotes : item.doctorNotes}
              </div>
            </div>
          )}

          {/* 7. Secretary Triage Notes (if triage item) */}
          {item.triageNotes && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                {isRTL ? `ملاحظات فرز الاستقبال (${item.triageSecretary || "السكرتيرة"}):` : `Secretary Triage Intake (${item.triageSecretary || "Reception"}):`}
              </span>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                &quot;{isRTL ? item.triageNotesAr || item.triageNotes : item.triageNotes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium">
            {isRTL ? "سجل طبي مشفر ومحمي ضمن ملفات العيادة" : "Confidential Medical Record • DocTech Clinic OS"}
          </span>
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            {isRTL ? "إغلاق السجل" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
