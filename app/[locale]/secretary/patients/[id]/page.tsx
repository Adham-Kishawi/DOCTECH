"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  User,
  Calendar,
  Paperclip,
  Activity,
  Edit2,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PatientTimeline, TimelineVisit } from "@/components/patients/PatientTimeline";
import { FileUploader, AttachmentItem } from "@/components/patients/FileUploader";

export default function SecretaryPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const patientId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"general" | "timeline" | "attachments">("general");
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    async function loadPatient() {
      if (!patientId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/patients/${patientId}`);
        const json = await res.json();
        if (json.success && json.patient) {
          setPatient(json.patient);
          setEditForm({
            name: json.patient.name || "",
            phone: json.patient.phone || "",
            email: json.patient.email || "",
            address: json.patient.address || "",
            notes: json.patient.notes || "",
          });
        } else {
          setPatient(null);
        }
      } catch (err) {
        console.error("Failed to load patient:", err);
        setPatient(null);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [patientId]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }
      setPatient((prev: any) => ({ ...prev, ...editForm }));
      setIsEditing(false);
      toast.success(isRTL ? "تم حفظ التعديلات بنجاح في قاعدة البيانات ✅" : "Patient updated successfully in database ✅");
    } catch (err: any) {
      toast.error(err?.message || (isRTL ? "حدث خطأ أثناء الحفظ" : "Failed to update"));
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsApp = () => {
    if (!patient?.phone) return;
    const cleanPhone = patient.phone.replace(/[^0-9]/g, "");
    const intlPhone = cleanPhone.startsWith("0") ? `20${cleanPhone.slice(1)}` : cleanPhone;
    const msg = isRTL
      ? `مرحباً أستاذ/ة ${patient.name}، نتواصل معك من عيادة DOCTECH لمتابعة حالتك الصحية.`
      : `Hello ${patient.name}, this is DocTech Clinic reception following up on your health.`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Convert DB appointments to timeline visits format
  const visits: TimelineVisit[] = (patient?.appointments || []).map((apt: any) => {
    const aptDate = new Date(apt.date);
    const dateFormatted = !Number.isNaN(aptDate.getTime())
      ? aptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : apt.date;

    return {
      id: apt.id,
      date: dateFormatted,
      doctorName: apt.doctors?.name || "Dr. Medical Lead",
      doctorNameAr: apt.doctors?.name || "د. الطبيب المعالج",
      visitType: apt.type || "Consultation",
      visitTypeAr: apt.type || "كشف واستشارة",
      chiefComplaint: apt.notes || (isRTL ? "كشف دوري بالعيادة" : "Routine clinical consultation"),
      chiefComplaintAr: apt.notes || "كشف دوري بالعيادة",
      diagnosis: isRTL ? "مراجعة سريرية مكتملة" : "Clinical consultation completed",
      diagnosisAr: "مراجعة سريرية مكتملة",
      vitals: { bp: "120/80", pulse: "72", temp: "36.8" },
      prescriptions: [],
      attachmentsCount: 0,
    };
  });

  const attachments: AttachmentItem[] = (patient?.patient_attachments || []).map((att: any) => ({
    id: att.id,
    fileName: att.fileName || att.file_name || "Attachment.pdf",
    fileUrl: att.fileUrl || att.file_url || "#",
    fileType: (att.fileType || att.file_type || "pdf") as any,
    uploadedAt: att.uploadedAt || att.uploaded_at || "Recent",
    fileSize: "1.2 MB",
    description: att.description || "",
  }));

  if (loading) {
    return (
      <div className="p-20 text-center max-w-5xl mx-auto">
        <Loader2 size={36} className="animate-spin text-[#0891B2] mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {isRTL ? "جاري جلب ملف المريض من قاعدة البيانات..." : "Loading patient profile from database..."}
        </p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-16 text-center max-w-xl mx-auto bg-white dark:bg-[#131E2E] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          {isRTL ? "تعذر العثور على ملف المريض" : "Patient Profile Not Found"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
          {isRTL ? "قد يكون تم حذفه أو أن الرابط غير صحيح." : "This record may have been deleted or the link is incorrect."}
        </p>
        <Link
          href={`/${locale}/secretary/patients`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0891B2] text-white text-xs font-bold"
        >
          <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
          <span>{isRTL ? "العودة لدليل المرضى" : "Back to Directory"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <Link
        href={`/${locale}/secretary/patients`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى دليل المرضى" : "Back to Patient Directory"}</span>
      </Link>

      {/* Patient Header Card */}
      <div className="bg-white dark:bg-[#131E2E] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-[#0891B2] font-black text-xl flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {patient.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {patient.gender || "Patient"}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              {patient.phone} {patient.email ? `• ${patient.email}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleWhatsApp}
            className="h-9 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle size={14} />
            <span>{isRTL ? "محادثة واتساب" : "WhatsApp"}</span>
          </button>

          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="h-9 px-3.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>{isRTL ? "حجز كشف جديد" : "Book New Visit"}</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "general"
              ? "bg-[#0891B2] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User size={14} />
          <span>{isRTL ? "البيانات والمعلومات" : "General Info"}</span>
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "timeline"
              ? "bg-[#0891B2] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Calendar size={14} />
          <span>{isRTL ? `سجل الكشوفات (${visits.length})` : `Visits Timeline (${visits.length})`}</span>
        </button>
        <button
          onClick={() => setActiveTab("attachments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "attachments"
              ? "bg-[#0891B2] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Paperclip size={14} />
          <span>{isRTL ? `المرفقات والأشعة (${attachments.length})` : `Attachments (${attachments.length})`}</span>
        </button>
      </div>

      {/* Tab 1: General Info */}
      {activeTab === "general" && (
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isRTL ? "البيانات الشخصية والسريرية" : "Patient Clinical Information"}
            </h2>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProfile}
                  className="px-3 py-1.5 rounded-lg bg-[#0891B2] hover:bg-[#0e7490] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{isRTL ? "حفظ التعديلات" : "Save Changes"}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>{isRTL ? "تعديل البيانات" : "Edit Profile"}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "الاسم الكامل" : "Full Name"}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="doctech-input"
                />
              ) : (
                <p className="text-sm font-bold text-slate-900 dark:text-white">{patient.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "رقم الهاتف" : "Phone"}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="doctech-input"
                />
              ) : (
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{patient.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "البريد الإلكتروني" : "Email"}</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="doctech-input"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">{patient.email || (isRTL ? "غير محدد" : "Not specified")}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "العنوان" : "Address"}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="doctech-input"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">{patient.address || (isRTL ? "غير محدد" : "Not specified")}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "ملاحظات سريرية ومتابعة" : "Clinical & Intake Notes"}</label>
            {isEditing ? (
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              />
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {patient.notes || (isRTL ? "لا توجد ملاحظات مسجلة للمريض." : "No notes recorded yet.")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <PatientTimeline visits={visits} locale={locale} isRTL={isRTL} />
        </div>
      )}

      {/* Tab 3: Attachments */}
      {activeTab === "attachments" && (
        <div className="bg-white dark:bg-[#131E2E] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <FileUploader patientId={patientId} isRTL={isRTL} />
        </div>
      )}
    </div>
  );
}
