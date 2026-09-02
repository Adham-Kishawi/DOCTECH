"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, MessageCircle, Plus, User, FileText, Calendar,
  Paperclip, Activity, Pill, Edit2, Check, Download, Eye, X
} from "lucide-react";
import { toast } from "sonner";
import { PatientTimeline, TimelineVisit } from "@/components/patients/PatientTimeline";
import { FileUploader, AttachmentItem } from "@/components/patients/FileUploader";

const initialPatientData = {
  id: "PAT-001",
  name: "Ahmed Hassan",
  nameAr: "أحمد حسن",
  phone: "+20 100 123 4567",
  age: 42,
  gender: "Male",
  genderAr: "ذكر",
  bloodGroup: "A+",
  address: "Nasr City, Cairo, Egypt",
  addressAr: "مدينة نصر، القاهرة، مصر",
  occupation: "Civil Engineer",
  occupationAr: "مهندس مدني",
  chronicConditions: "Hypertension (Diagnosed 2021), Mild Asthma",
  chronicConditionsAr: "ارتفاع ضغط الدم (تم التشخيص ٢٠٢١)، ربو خفيف",
  allergies: "Penicillin (Causes mild skin rash)",
  allergiesAr: "بنسلين (يسبب طفح جلدي خفيف)",
  currentMedications: "Amlodipine 5mg OD, Concor 2.5mg OD",
  notes: "Patient is compliant with medication. Regular follow-up every 3 months.",
  notesAr: "المريض ملتزم بالعلاج. متابعة دورية كل ٣ أشهر.",
};

const initialVisits: TimelineVisit[] = [
  {
    id: "VST-101",
    date: "Today, Sep 2, 2026",
    doctorName: "Dr. Ahmed Hossam",
    doctorNameAr: "د. أحمد حسام",
    visitType: "Follow-up Check",
    visitTypeAr: "كشف متابعة",
    chiefComplaint: "Routine blood pressure checkup and prescription refill.",
    chiefComplaintAr: "فحص دوري لضغط الدم وتجديد الروشتة.",
    diagnosis: "Stage 1 Essential Hypertension — Well Controlled.",
    diagnosisAr: "ارتفاع ضغط دم أولي مرحلة أولى — مسيطر عليه جيدًا.",
    vitals: { bp: "128/82", pulse: "74", temp: "36.8", sugar: "105" },
    prescriptions: ["Amlodipine 5mg — 1 tablet once daily in the morning", "Concor 2.5mg — 1 tablet once daily"],
    attachmentsCount: 1,
  },
  {
    id: "VST-102",
    date: "Jun 15, 2026",
    doctorName: "Dr. Ahmed Hossam",
    doctorNameAr: "د. أحمد حسام",
    visitType: "Consultation & ECG",
    visitTypeAr: "كشف ورسم قلب",
    chiefComplaint: "Occasional palpitation during physical exertion.",
    chiefComplaintAr: "خفقان متقطع عند بذل مجهود بدني.",
    diagnosis: "Sinus Rhythm with isolated benign PVCs. Reassurance given.",
    diagnosisAr: "نظم جيبي طبيعي مع نبضات مبكرة حميدة ومعزولة. تم طمأنة المريض.",
    vitals: { bp: "135/88", pulse: "82", temp: "37.0" },
    prescriptions: ["Concor 2.5mg — 1 tablet once daily", "Omega-3 1000mg — 1 capsule with meals"],
    attachmentsCount: 2,
  },
  {
    id: "VST-103",
    date: "Jan 10, 2026",
    doctorName: "Dr. Tarek Omar",
    doctorNameAr: "د. طارق عمر",
    visitType: "General Wellness Visit",
    visitTypeAr: "فحص سنوي شامل",
    chiefComplaint: "Annual corporate health checkup.",
    chiefComplaintAr: "فحص طبي دوري سنوي.",
    diagnosis: "General health satisfactory. Mild vitamin D deficiency.",
    diagnosisAr: "الحالة العامة ممتازة. نقص طفيف في فيتامين د.",
    vitals: { bp: "130/84", pulse: "76", temp: "36.7", sugar: "98" },
    prescriptions: ["Vitamin D3 50,000 IU — 1 ampoule weekly for 8 weeks"],
    attachmentsCount: 1,
  },
];

const initialAttachments: AttachmentItem[] = [
  {
    id: "att-101",
    fileName: "Chest_XRay_PA_View.jpg",
    fileUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
    fileType: "xray",
    uploadedAt: "Today",
    fileSize: "3.4 MB",
    description: "Bilateral lung fields clear. Normal cardiac silhouette.",
  },
  {
    id: "att-102",
    fileName: "Prescription_DrAhmed_Sep2026.pdf",
    fileUrl: "#",
    fileType: "prescription",
    uploadedAt: "Today",
    fileSize: "320 KB",
    description: "Refill: Amlodipine 5mg + Concor 2.5mg",
  },
  {
    id: "att-103",
    fileName: "HbA1c_Lipid_Profile_Results.jpg",
    fileUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
    fileType: "image",
    uploadedAt: "Jun 15, 2026",
    fileSize: "1.8 MB",
    description: "HbA1c: 6.1%, Fasting Blood Sugar: 105 mg/dL",
  },
];

export default function PatientDetailPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = (params?.id as string) || "PAT-001";

  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "attachments">("info");
  const [patient, setPatient] = useState(initialPatientData);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [visits, setVisits] = useState<TimelineVisit[]>(initialVisits);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleSaveInfo = () => {
    setIsEditingInfo(false);
    toast.success(isRTL ? "✅ تم حفظ وتحديث بيانات المريض بنجاح!" : "✅ Patient profile updated successfully!");
  };

  const handleNewAttachment = (newAtt: AttachmentItem) => {
    setAttachments((prev) => [newAtt, ...prev]);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Link
        href={`/${locale}/secretary/patients`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى دليل المرضى" : "Back to Patient Directory"}</span>
      </Link>

      {/* Patient Header Card */}
      <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] dark:text-cyan-400 text-lg sm:text-xl font-extrabold flex items-center justify-center shrink-0 border border-cyan-100 dark:border-cyan-900 shadow-xs">
            {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                {isRTL ? patient.nameAr : patient.name}
              </h1>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-lg">
                {id}
              </span>
              <span className="text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                {patient.bloodGroup}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2 flex-wrap">
              <span>{patient.phone}</span>
              <span>•</span>
              <span>{patient.age} {isRTL ? "سنة" : "Years"} ({isRTL ? patient.genderAr : patient.gender})</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{isRTL ? patient.addressAr : patient.address}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          <Link
            href={`/${locale}/secretary/whatsapp`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <MessageCircle size={14} />
            <span>{isRTL ? "محادثة واتساب" : "WhatsApp"}</span>
          </Link>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>{isRTL ? "حجز كشف جديد" : "Book Visit"}</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: "info", icon: User, en: "1. General Profile & Medical Info", ar: "١. الملف الطبي والمعلومات العامة" },
          { id: "timeline", icon: Calendar, en: `2. Visit History & Timeline (${visits.length})`, ar: `٢. السجل والزيارات السابقة (${visits.length})` },
          { id: "attachments", icon: Paperclip, en: `3. X-Rays, Prescriptions & Files (${attachments.length})`, ar: `٣. الأشعة والروشتات والمرفقات (${attachments.length})` },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#0891B2] text-white shadow-sm"
                  : "bg-white dark:bg-[#131E2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <Icon size={15} />
              <span>{isRTL ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: General Info */}
      {activeTab === "info" && (
        <div className="bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
              <User size={15} className="text-[#0891B2]" />
              <span>{isRTL ? "البيانات الديموغرافية والسريرية" : "Demographic & Clinical Profile"}</span>
            </h2>

            {isEditingInfo ? (
              <button
                onClick={handleSaveInfo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                <Check size={14} />
                <span>{isRTL ? "حفظ التعديلات" : "Save Changes"}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingInfo(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>{isRTL ? "تعديل البيانات" : "Edit Details"}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">{isRTL ? "الاسم الكامل" : "Full Name"}</span>
              {isEditingInfo ? (
                <input
                  type="text"
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                />
              ) : (
                <p className="font-bold text-slate-800 dark:text-slate-200">{isRTL ? patient.nameAr : patient.name}</p>
              )}
            </div>

            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">{isRTL ? "رقم الهاتف" : "Phone Number"}</span>
              {isEditingInfo ? (
                <input
                  type="text"
                  value={patient.phone}
                  onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                />
              ) : (
                <p className="font-bold text-slate-800 dark:text-slate-200">{patient.phone}</p>
              )}
            </div>

            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">{isRTL ? "العنوان" : "Address"}</span>
              {isEditingInfo ? (
                <input
                  type="text"
                  value={patient.address}
                  onChange={(e) => setPatient({ ...patient, address: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold"
                />
              ) : (
                <p className="font-bold text-slate-800 dark:text-slate-200">{isRTL ? patient.addressAr : patient.address}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/60">
              <span className="font-bold text-rose-600 dark:text-rose-400 text-[10px] uppercase block mb-1 flex items-center gap-1">
                <Activity size={12} />
                <span>{isRTL ? "الأمراض المزمنة" : "Chronic Conditions"}</span>
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{isRTL ? patient.chronicConditionsAr : patient.chronicConditions}</p>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/60">
              <span className="font-bold text-amber-600 dark:text-amber-400 text-[10px] uppercase block mb-1 flex items-center gap-1">
                <Activity size={12} />
                <span>{isRTL ? "الحساسية الدوائية" : "Drug Allergies"}</span>
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{isRTL ? patient.allergiesAr : patient.allergies}</p>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase block mb-1 flex items-center gap-1">
                <Pill size={12} />
                <span>{isRTL ? "الأدوية الحالية" : "Current Medications"}</span>
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">{patient.currentMedications}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Timeline */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#131E2E] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isRTL ? "التسلسل الزمني للزيارات والكشوفات السابقة" : "Clinical Consultation Timeline"}
            </h2>
            <Link
              href={`/${locale}/secretary/appointments/new`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold"
            >
              <Plus size={13} />
              <span>{isRTL ? "إضافة كشف" : "New Visit"}</span>
            </Link>
          </div>

          <PatientTimeline visits={visits} locale={locale} isRTL={isRTL} />
        </div>
      )}

      {/* TAB 3: Attachments Gallery & Uploader */}
      {activeTab === "attachments" && (
        <div className="space-y-6">
          {/* Uploader Component */}
          <div className="bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Paperclip size={16} className="text-[#0891B2]" />
              <span>{isRTL ? "رفع أشعة أو روشتة أو تقرير معملي جديد" : "Upload Medical Files, Scans & Prescriptions"}</span>
            </h2>
            <FileUploader patientId={id} onUploadComplete={handleNewAttachment} isRTL={isRTL} />
          </div>

          {/* Attachments List / Gallery */}
          <div className="bg-white dark:bg-[#131E2E] p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isRTL ? `الملفات والمرفقات المحفوظة (${attachments.length})` : `Stored Medical Files (${attachments.length})`}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-[#0891B2] transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] dark:text-cyan-400 flex items-center justify-center shrink-0">
                        {att.fileType === "xray" ? <Activity size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={att.fileName}>
                          {att.fileName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold block">{att.uploadedAt} • {att.fileSize}</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {att.fileType}
                    </span>
                  </div>

                  {att.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 bg-white dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      {att.description}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    {att.fileUrl && att.fileUrl !== "#" ? (
                      <button
                        onClick={() => setPreviewImage(att.fileUrl)}
                        className="flex-1 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] dark:text-cyan-400 text-xs font-bold flex items-center justify-center gap-1 hover:bg-cyan-100 transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>{isRTL ? "معاينة" : "Preview"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toast.info(isRTL ? "جاري تحميل المستند..." : "Downloading document...")}
                        className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <Download size={12} />
                        <span>{isRTL ? "تحميل PDF" : "Download PDF"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="Medical scan preview"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
