"use client";

import { useState, useEffect, useRef } from "react";
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
  Send,
  Save,
  UserCheck,
} from "lucide-react";
import { ClinicalHistoryItem, CLINIC_DOCTORS } from "@/lib/doctor/historyData";
import { toast } from "sonner";

interface SecretaryHistoryDetailModalProps {
  item: ClinicalHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateItem?: (updated: ClinicalHistoryItem) => void;
  isRTL: boolean;
}

export function SecretaryHistoryDetailModal({
  item,
  isOpen,
  onClose,
  onUpdateItem,
  isRTL,
}: SecretaryHistoryDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Editable Secretary Fields
  const [triageStatus, setTriageStatus] = useState<"pending_action" | "reviewed" | "completed">("reviewed");
  const [urgency, setUrgency] = useState<"High" | "Medium" | "Normal">("Normal");
  const [assignedDoctorId, setAssignedDoctorId] = useState("doc-1");
  const [secretaryNotes, setSecretaryNotes] = useState("");
  const [vitals, setVitals] = useState({
    bp: "",
    temp: "",
    heartRate: "",
    bloodSugar: "",
    weight: "",
  });
  const [saving, setSaving] = useState(false);

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setTriageStatus(item.status);
      setUrgency(item.urgency);
      setAssignedDoctorId(item.doctorId);
      setSecretaryNotes(item.triageNotes || "");
      setVitals({
        bp: item.vitals?.bp || "",
        temp: item.vitals?.temp || "",
        heartRate: item.vitals?.heartRate || "",
        bloodSugar: item.vitals?.bloodSugar || "",
        weight: item.vitals?.weight || "",
      });
    }
  }, [item]);

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

  const handleWhatsAppDispatch = () => {
    const doc = CLINIC_DOCTORS.find((d) => d.id === assignedDoctorId) || CLINIC_DOCTORS[0];
    const text = isRTL
      ? `مرحباً أستاذ/ة ${item.patientNameAr}، معك مكتب الاستقبال بعيادة DOCTECH. بخصوص استفسارك/كشفك (${item.recordNumber}) لدى ${doc.nameAr}، تم اعتماد التقرير والروشتة ويمكنك مراجعة التعليمات المرفقة.`
      : `Hello ${item.patientName}, this is DocTech Clinic Reception regarding your record (${item.recordNumber}) with ${doc.name}. Your review and prescription are ready.`;

    const cleanPhone = item.patientPhone.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

    // Update status to completed / dispatched
    setTriageStatus("completed");
    if (onUpdateItem) {
      onUpdateItem({
        ...item,
        status: "completed",
        doctorId: assignedDoctorId,
        doctorName: doc.name,
        doctorNameAr: doc.nameAr,
        triageNotes: secretaryNotes,
        urgency,
        vitals,
      });
    }
    toast.success(isRTL ? "تم فتح واتساب وتحديث الحالة إلى: تم التسليم للمريض ✓" : "Opened WhatsApp & updated status to: Dispatched ✓");
  };

  const handleSaveSecretaryChanges = () => {
    setSaving(true);
    const doc = CLINIC_DOCTORS.find((d) => d.id === assignedDoctorId) || CLINIC_DOCTORS[0];
    const updated: ClinicalHistoryItem = {
      ...item,
      status: triageStatus,
      urgency,
      doctorId: assignedDoctorId,
      doctorName: doc.name,
      doctorNameAr: doc.nameAr,
      triageNotes: secretaryNotes,
      vitals,
    };

    if (onUpdateItem) {
      onUpdateItem(updated);
    }

    setTimeout(() => {
      setSaving(false);
      toast.success(isRTL ? "تم حفظ تحديثات الفرز وملاحظات السكرتارية ✓" : "Secretary triage updates saved successfully ✓");
      onClose();
    }, 300);
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
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#111C2B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

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
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{isRTL ? "طباعة" : "Print"}</span>
            </button>
            <button
              onClick={handleWhatsAppDispatch}
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle size={14} />
              <span>{isRTL ? "تسليم واتساب" : "WhatsApp Dispatch"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100">
          
          {/* 1. Patient & Assigned Doctor Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/30 dark:from-slate-900 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0891B2] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
                {item.patientName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRTL ? item.patientNameAr : item.patientName}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.patientAge} {isRTL ? "سنة" : "yrs"}
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

            {/* Secretary Doctor Assignment Selector */}
            <div className="space-y-1 sm:text-right">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isRTL ? "توجيه الحالة إلى الطبيب:" : "Route / Assign Doctor:"}
              </label>
              <select
                value={assignedDoctorId}
                onChange={(e) => setAssignedDoctorId(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#0891B2]"
              >
                {CLINIC_DOCTORS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {isRTL ? doc.nameAr : doc.name} ({isRTL ? doc.specialtyAr : doc.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Secretary Triage Controls Bar (Status & Urgency) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider block">
              {isRTL ? "صلاحيات فرز وتحكم السكرتارية (Triage Controls):" : "Secretary Triage Controls:"}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Triage Status */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "حالة المعاملة" : "Triage Status"}
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "pending_action", labelEn: "Pending", labelAr: "بانتظار الفرز" },
                    { id: "reviewed", labelEn: "Sent to Dr", labelAr: "أُرسلت للطبيب" },
                    { id: "completed", labelEn: "Dispatched", labelAr: "تم التسليم" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setTriageStatus(st.id as typeof triageStatus)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        triageStatus === st.id
                          ? "bg-[#0891B2] text-white border-[#0891B2] shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isRTL ? st.labelAr : st.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isRTL ? "درجة الاستعجال" : "Urgency"}
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "Normal", labelEn: "Normal", labelAr: "عادي", color: "text-slate-700 dark:text-slate-300" },
                    { id: "Medium", labelEn: "Medium", labelAr: "متوسط", color: "text-amber-600" },
                    { id: "High", labelEn: "High", labelAr: "عاجل", color: "text-red-600" },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUrgency(u.id as typeof urgency)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        urgency === u.id
                          ? u.id === "High"
                            ? "bg-red-600 text-white border-red-600"
                            : u.id === "Medium"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 " + u.color
                      }`}
                    >
                      {isRTL ? u.labelAr : u.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Secretary Intake Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                {isRTL ? "ملاحظات السكرتيرة للطبيب (Secretary Notes to Doctor):" : "Secretary Notes to Doctor:"}
              </label>
              <textarea
                rows={2}
                value={secretaryNotes}
                onChange={(e) => setSecretaryNotes(e.target.value)}
                placeholder={isRTL ? "اكتبي ملاحظات فرز الحالة أو شكوى المريض المبدئية..." : "Enter intake or triage notes..."}
                className="doctech-input !min-h-[56px] text-xs resize-none"
                dir="auto"
              />
            </div>
          </div>

          {/* 3. Vital Signs Recording (Desk Intake) */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Activity size={13} className="text-emerald-500" />
              {isRTL ? "تسجيل العلامات الحيوية في الاستقبال (Reception Vitals Intake):" : "Record Vital Signs at Reception:"}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{isRTL ? "ضغط الدم" : "BP"}</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={vitals.bp}
                  onChange={(e) => setVitals((prev) => ({ ...prev, bp: e.target.value }))}
                  className="doctech-input !h-8 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{isRTL ? "النبض" : "Heart Rate"}</label>
                <input
                  type="text"
                  placeholder="76 bpm"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals((prev) => ({ ...prev, heartRate: e.target.value }))}
                  className="doctech-input !h-8 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{isRTL ? "الحرارة" : "Temp"}</label>
                <input
                  type="text"
                  placeholder="37.0 °C"
                  value={vitals.temp}
                  onChange={(e) => setVitals((prev) => ({ ...prev, temp: e.target.value }))}
                  className="doctech-input !h-8 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{isRTL ? "السكر" : "Blood Sugar"}</label>
                <input
                  type="text"
                  placeholder="110 mg/dL"
                  value={vitals.bloodSugar}
                  onChange={(e) => setVitals((prev) => ({ ...prev, bloodSugar: e.target.value }))}
                  className="doctech-input !h-8 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">{isRTL ? "الوزن" : "Weight"}</label>
                <input
                  type="text"
                  placeholder="75 kg"
                  value={vitals.weight}
                  onChange={(e) => setVitals((prev) => ({ ...prev, weight: e.target.value }))}
                  className="doctech-input !h-8 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* 4. Doctor's Clinical Review & Diagnosis (Read-only for Secretary) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isRTL ? "موضوع التقرير أو الإجراء" : "Clinical Heading"}
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {isRTL ? item.titleAr : item.title}
              </h4>
            </div>

            {item.diagnosis && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                  <Stethoscope size={14} />
                  {isRTL ? "قرار وتشخيص الطبيب المعالج:" : "Doctor Diagnosis & Decision:"}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                  {isRTL ? item.diagnosisAr || item.diagnosis : item.diagnosis}
                </p>
              </div>
            )}
          </div>

          {/* 5. Prescription Medications (Read-only for Secretary) */}
          {item.medicines && item.medicines.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Pill size={14} />
                {isRTL ? "الروشتة المعتمدة من الطبيب (جاهزة للصرف والطباعة):" : "Approved Prescription (Ready to Dispense):"}
              </span>
              <div className="rounded-2xl border border-purple-200/70 dark:border-purple-900/50 overflow-hidden divide-y divide-purple-100 dark:divide-purple-900/40">
                {item.medicines.map((med, idx) => (
                  <div key={idx} className="p-3 sm:p-4 bg-purple-50/20 dark:bg-purple-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

          {/* 6. Doctor Instructions */}
          {item.doctorNotes && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
                {isRTL ? "تعليمات الطبيب للمريض" : "Physician Recommendations:"}
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {isRTL ? item.doctorNotesAr || item.doctorNotes : item.doctorNotes}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3">
          <button
            onClick={handleSaveSecretaryChanges}
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isRTL ? "حفظ التحديثات والفرز" : "Save Triage Changes"}</span>
          </button>

          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            {isRTL ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
