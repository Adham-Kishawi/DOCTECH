"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Stethoscope,
  Pill,
  AlertTriangle,
  UploadCloud,
  FileText,
  User,
  Activity,
  Check,
  Loader2,
  Image as ImageIcon,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";

interface PatientOption {
  id: string;
  name: string;
  phone: string;
  gender?: string;
  age?: number;
}

interface NewClinicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  isRTL: boolean;
  preselectedPatientId?: string;
  defaultMode?: "record" | "new_patient";
}

export function NewClinicalRecordModal({
  isOpen,
  onClose,
  onRecordCreated,
  isRTL,
  preselectedPatientId,
  defaultMode = "record",
}: NewClinicalRecordModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form Mode: "existing" or "new"
  const [isNewPatient, setIsNewPatient] = useState(defaultMode === "new_patient");
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || "");

  // New Patient fields
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientGender, setNewPatientGender] = useState<"MALE" | "FEMALE" | "UNKNOWN">("MALE");
  const [newPatientAge, setNewPatientAge] = useState<number | "">("");
  const [newPatientNotes, setNewPatientNotes] = useState("");

  // Record fields
  const [recordType, setRecordType] = useState<"CONSULTATION" | "PRESCRIPTION" | "TRIAGE_REPORT">("CONSULTATION");
  const [title, setTitle] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorReview, setDoctorReview] = useState("");

  // Vitals
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [temp, setTemp] = useState("");
  const [sugar, setSugar] = useState("");
  const [weight, setWeight] = useState("");

  // Medicines
  const [medicines, setMedicines] = useState<
    Array<{ name: string; dosage: string; frequency: string; duration: string; notes?: string }>
  >([]);

  // Attachments
  const [attachments, setAttachments] = useState<
    Array<{ fileName: string; fileUrl: string; fileType: string; description?: string; previewUrl?: string }>
  >([]);

  // Selected attachment category for upcoming upload
  const [attachmentCategory, setAttachmentCategory] = useState<"xray" | "image" | "prescription" | "pdf">("xray");

  // Load clinic patients
  useEffect(() => {
    async function loadPatients() {
      if (!isOpen) return;
      try {
        setLoadingPatients(true);
        const res = await fetch("/api/patients");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPatients(
            json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              gender: p.gender,
              age: p.age,
            }))
          );
          if (!selectedPatientId && json.data.length > 0) {
            setSelectedPatientId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load patients for modal:", err);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, [isOpen, selectedPatientId]);

  // Set preselected patient
  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
      setIsNewPatient(false);
    }
  }, [preselectedPatientId]);

  // Set default mode
  useEffect(() => {
    if (defaultMode === "new_patient") {
      setIsNewPatient(true);
    }
  }, [defaultMode]);

  // Add medicine row
  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "1 tablet",
        frequency: isRTL ? "مرتين يومياً بعد الأكل" : "Twice daily after meals",
        duration: isRTL ? "لمدة ٧ أيام" : "For 7 days",
        notes: "",
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: string, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  // Handle file attachment
  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error(isRTL ? "حجم الملف يتجاوز 15 ميجابايت" : "File size exceeds 15MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileUrl: dataUrl,
          fileType: attachmentCategory,
          description: attachmentCategory === "xray" ? "صورة أشعة تشخيصية" : "مرفق طبي",
          previewUrl: dataUrl,
        },
      ]);
      toast.success(isRTL ? `تم إرفاق: ${file.name}` : `Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNewPatient && !selectedPatientId) {
      toast.error(isRTL ? "يرجى اختيار مريض" : "Please select a patient");
      return;
    }

    if (isNewPatient && (!newPatientName.trim() || !newPatientPhone.trim())) {
      toast.error(isRTL ? "يرجى إدخال اسم المريض ورقم الهاتف" : "Please enter patient name & phone");
      return;
    }

    if (!symptoms.trim() && !diagnosis.trim()) {
      toast.error(
        isRTL
          ? "يرجى إدخال الأعراض أو التشخيص الطبي"
          : "Please enter patient symptoms or diagnosis"
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, any> = {
        type: recordType,
        title: title.trim() || diagnosis.trim() || (isRTL ? "كشف ومتابعة سريرية" : "Clinical Consultation"),
        content: symptoms.trim() || (isRTL ? "مراجعة سريرية روتينية" : "Routine clinical encounter"),
        diagnosis: diagnosis.trim() || undefined,
        doctorReview: doctorReview.trim() || undefined,
        status: "REVIEWED",
      };

      if (isNewPatient) {
        payload.newPatient = {
          name: newPatientName.trim(),
          phone: newPatientPhone.trim(),
          gender: newPatientGender,
          age: typeof newPatientAge === "number" ? newPatientAge : undefined,
          notes: newPatientNotes.trim() || undefined,
        };
      } else {
        payload.patientId = selectedPatientId;
      }

      // Vitals
      const vitalsObj: Record<string, string> = {};
      if (bp.trim()) vitalsObj.bp = bp.trim();
      if (pulse.trim()) vitalsObj.pulse = pulse.trim();
      if (temp.trim()) vitalsObj.temp = temp.trim();
      if (sugar.trim()) vitalsObj.sugar = sugar.trim();
      if (weight.trim()) vitalsObj.weight = weight.trim();
      if (Object.keys(vitalsObj).length > 0) {
        payload.vitals = vitalsObj;
      }

      // Medicines
      const validMeds = medicines.filter((m) => m.name.trim().length > 0);
      if (validMeds.length > 0) {
        payload.medicines = validMeds;
      }

      // Attachments
      if (attachments.length > 0) {
        payload.attachments = attachments.map((a) => ({
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileType: a.fileType,
          description: a.description,
        }));
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create clinical record");
      }

      toast.success(
        isRTL
          ? "✅ تم حفظ السجل السريري والمرفقات بنجاح في قاعدة البيانات!"
          : "✅ Clinical history record and attachments saved successfully!"
      );

      onRecordCreated();
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err?.message || (isRTL ? "حدث خطأ أثناء الحفظ" : "Failed to save record"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#111C2B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-[#1A4B8C] via-teal-500 to-emerald-500" />

        {/* Modal Top Bar */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900">
              <Stethoscope size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isRTL ? "إضافة كشف سريري وسجل حالة جديد" : "New Clinical Encounter & Medical Record"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isRTL
                  ? "تسجيل كشف، تشخيص، روشتة، علامات حيوية، ورفع صور الأشعة للمريض"
                  : "Record diagnosis, prescription, vitals, and attach X-rays/scans to patient history"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* ━━━ 1. PATIENT SELECTION / REGISTRATION ━━━ */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <User size={15} className="text-[#1A4B8C]" />
                {isRTL ? "تحديد المريض المعني:" : "Patient Information:"}
              </span>

              {/* Toggle Existing / New */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsNewPatient(false)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    !isNewPatient
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {isRTL ? "مريض مسجل بالعيادة" : "Existing Patient"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewPatient(true)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    isNewPatient
                      ? "bg-[#1A4B8C] text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {isRTL ? "+ تسجيل مريض جديد" : "+ Register New Patient"}
                </button>
              </div>
            </div>

            {!isNewPatient ? (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  {isRTL ? "اختر المريض من القائمة:" : "Select Patient:"}
                </label>
                {loadingPatients ? (
                  <div className="h-10 flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 size={15} className="animate-spin" />
                    <span>{isRTL ? "جاري تحميل المرضى..." : "Loading patients..."}</span>
                  </div>
                ) : (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {isRTL ? "اسم المريض الكامل *" : "Patient Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRTL ? "مثال: حسام عادل الشريف" : "e.g. Hossam Adel"}
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {isRTL ? "رقم الهاتف *" : "Phone Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01012345678"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {isRTL ? "النوع" : "Gender"}
                  </label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="MALE">{isRTL ? "ذكر" : "Male"}</option>
                    <option value="FEMALE">{isRTL ? "أنثى" : "Female"}</option>
                    <option value="UNKNOWN">{isRTL ? "غير محدد" : "Unknown"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    {isRTL ? "العمر" : "Age"}
                  </label>
                  <input
                    type="number"
                    placeholder="35"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value ? parseInt(e.target.value, 10) : "")}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ━━━ 2. RECORD TYPE & DIAGNOSIS ━━━ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
              <span className="text-slate-400">{isRTL ? "نوع الإجراء السريري:" : "Encounter Type:"}</span>
              {[
                { id: "CONSULTATION", en: "Consultation (كشف سريري)", ar: "كشف واستشارة سريرية" },
                { id: "PRESCRIPTION", en: "Prescription (روشتة وعلاج)", ar: "روشتة وبروتوكول علاجي" },
                { id: "TRIAGE_REPORT", en: "Triage / Follow-up (متابعة وفرز)", ar: "تقرير ومتابعة فرز طبي" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRecordType(t.id as any)}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    recordType === t.id
                      ? "bg-[#1A4B8C] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {isRTL ? t.ar : t.en}
                </button>
              ))}
            </div>

            {/* Diagnosis (Primary focus) */}
            <div>
              <label className="block text-xs font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-blue-600" />
                <span>{isRTL ? "التشخيص الطبي السريري (Medical Diagnosis) *" : "Clinical Diagnosis *"}</span>
              </label>
              <input
                type="text"
                required
                placeholder={isRTL ? "مثال: التهاب معوي حاد مع جفاف طفيف" : "e.g. Acute Gastroenteritis with mild dehydration"}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full h-11 px-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Symptoms & Chief Complaint */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                {isRTL ? "شكوى المريض والأعراض (Symptoms & Chief Complaint) *" : "Chief Complaint & Symptoms *"}
              </label>
              <textarea
                rows={2}
                required
                placeholder={isRTL ? "مثال: مغص متكرر وارتفاع حرارة منذ يومين..." : "Patient reported recurrent abdominal pain and fever for 2 days..."}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>

            {/* Doctor Review / Recommendations */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                {isRTL ? "توجيهات الطبيب وخطة العلاج (Physician Notes & Recommendations)" : "Doctor Plan & Recommendations"}
              </label>
              <textarea
                rows={2}
                placeholder={isRTL ? "مثال: الإكثار من السوائل، الراحة التامة، ومراجعة العيادة بعد أسبوع..." : "Bed rest, oral rehydration, follow up in 7 days..."}
                value={doctorReview}
                onChange={(e) => setDoctorReview(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          {/* ━━━ 3. VITALS (العلامات الحيوية) ━━━ */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity size={14} className="text-rose-500" />
              {isRTL ? "العلامات الحيوية عند الكشف (اختياري):" : "Patient Vitals (Optional):"}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{isRTL ? "ضغط الدم (BP)" : "Blood Pressure"}</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{isRTL ? "النبض (Pulse)" : "Heart Rate"}</label>
                <input
                  type="text"
                  placeholder="76 bpm"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{isRTL ? "الحرارة (Temp)" : "Temperature"}</label>
                <input
                  type="text"
                  placeholder="37.1 °C"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{isRTL ? "السكر (Sugar)" : "Glucose"}</label>
                <input
                  type="text"
                  placeholder="105 mg/dL"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{isRTL ? "الوزن (Weight)" : "Weight"}</label>
                <input
                  type="text"
                  placeholder="74 kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* ━━━ 4. MEDICINES / PRESCRIPTION (الأدوية والروشتة) ━━━ */}
          <div className="p-4 rounded-2xl bg-purple-50/30 dark:bg-purple-950/10 border border-purple-200/60 dark:border-purple-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Pill size={15} className="text-purple-600" />
                {isRTL ? "الروشتة وقائمة الأدوية الموصوفة:" : "Prescribed Medications:"}
              </span>

              <button
                type="button"
                onClick={handleAddMedicine}
                className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <Plus size={13} />
                <span>{isRTL ? "إضافة دواء" : "Add Medicine"}</span>
              </button>
            </div>

            {medicines.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-medium py-1">
                {isRTL
                  ? "لا توجد أدوية مضافة حالياً. اضغط على \"إضافة دواء\" لإدراج روشتة لهذا الكشف."
                  : "No medicines added. Click \"Add Medicine\" to prescribe medications."}
              </p>
            ) : (
              <div className="space-y-2.5">
                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      placeholder={isRTL ? "اسم الدواء (مثال: Augmentin 1g)" : "Medicine Name"}
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                      className="flex-1 h-8 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />

                    <input
                      type="text"
                      placeholder={isRTL ? "الجرعة (قرص واحد)" : "Dosage (1 tab)"}
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                      className="w-full sm:w-28 h-8 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />

                    <input
                      type="text"
                      placeholder={isRTL ? "التكرار (مرتين يومياً)" : "Frequency"}
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                      className="w-full sm:w-36 h-8 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />

                    <input
                      type="text"
                      placeholder={isRTL ? "المدة (٧ أيام)" : "Duration"}
                      value={med.duration}
                      onChange={(e) => handleUpdateMedicine(idx, "duration", e.target.value)}
                      className="w-full sm:w-24 h-8 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ━━━ 5. ATTACHMENTS & X-RAYS (الأشعة والمستندات الطبية) ━━━ */}
          <div className="p-4 rounded-2xl bg-cyan-50/30 dark:bg-cyan-950/10 border border-cyan-200/60 dark:border-cyan-900/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                <Paperclip size={15} className="text-[#0891B2]" />
                {isRTL ? "رفع صور الأشعة والتحاليل والمستندات الطبية:" : "Attach X-Rays, Scans & Lab Results:"}
              </span>

              <div className="flex items-center gap-1 text-[11px] font-bold">
                {[
                  { id: "xray", en: "X-Ray (أشعة)", ar: "أشعة ورنين" },
                  { id: "image", en: "Lab (تحاليل)", ar: "تحاليل معملية" },
                  { id: "prescription", en: "Rx (روشتة)", ar: "روشتة سابقة" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAttachmentCategory(c.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      attachmentCategory === c.id
                        ? "bg-[#0891B2] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {isRTL ? c.ar : c.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop / Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 sm:p-5 rounded-xl border-2 border-dashed border-cyan-300 dark:border-cyan-800 hover:border-[#0891B2] bg-white/70 dark:bg-slate-900/50 flex items-center justify-center gap-3 cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <UploadCloud size={22} className="text-[#0891B2]" />
              <div className="text-center sm:text-left rtl:sm:text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {isRTL ? "اضغط لاختيار صورة أشعة أو نتيجة تحليل أو تقرير PDF" : "Click to select X-Ray scan, Lab image, or PDF report"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isRTL ? "يدعم حتى 15 ميجابايت (PNG / JPEG / PDF)" : "Supports up to 15MB (PNG/JPG/PDF)"}
                </span>
              </div>
            </div>

            {/* Attached files chips */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-cyan-200 dark:border-cyan-900 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-[#0891B2] flex items-center justify-center shrink-0">
                        <ImageIcon size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {att.fileName}
                        </span>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold uppercase">
                          {att.fileType}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="w-7 h-7 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-xl bg-[#1A4B8C] hover:bg-[#153e75] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-900/15 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{isRTL ? "جاري الحفظ..." : "Saving Record..."}</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>{isRTL ? "حفظ السجل والمرفقات في ملف المريض" : "Save Record & Attachments"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
