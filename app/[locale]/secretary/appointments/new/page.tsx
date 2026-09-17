"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarCheck,
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  Send,
  DollarSign,
  Clock,
  Stethoscope,
  Search,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DoctorOption {
  id: string;
  name: string;
  specialty?: string;
}

interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  gender: string;
  totalVisits: number;
}

interface TimeSlot {
  time: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const appointmentTypes = [
  { id: "new", en: "New Consultation", ar: "كشف أول مرة", fee: 400 },
  { id: "followup", en: "Follow-up Check", ar: "إعادة واستشارة", fee: 200 },
  { id: "postop", en: "Post-Op Wound Review", ar: "مراجعة جراحية", fee: 300 },
  { id: "urgent", en: "Urgent Clinical Visit", ar: "كشف طارئ", fee: 500 },
];

export default function NewAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  // Data fetching states
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [patientsList, setPatientsList] = useState<PatientRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient mode: "existing" | "new"
  const [patientMode, setPatientMode] = useState<"existing" | "new">("new");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientGender: "UNKNOWN",
    doctorId: "",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM",
    typeId: "new",
    fee: 400,
    paymentMethod: "CASH",
    isPaid: false,
    notes: "",
    sendWhatsApp: true,
  });

  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Doctors
  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        const res = await fetch("/api/secretary/contacts");
        const json = await res.json();
        if (json.success && Array.isArray(json.contacts)) {
          const docList = json.contacts
            .filter((c: any) => c.type === "doctor")
            .map((d: any) => ({
              id: d.id,
              name: d.name,
              specialty: d.role || "General Practitioner",
            }));

          setDoctors(docList);
          if (docList.length > 0) {
            setFormData((prev) => ({ ...prev, doctorId: docList[0].id }));
          }
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, []);

  // 2. Fetch Patients for search
  useEffect(() => {
    async function loadPatients() {
      try {
        setLoadingPatients(true);
        const res = await fetch("/api/patients");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPatientsList(json.data);
          if (json.data.length > 0) {
            setPatientMode("existing");
          }
        }
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, []);

  // 3. Fetch Slots whenever doctor or date changes
  const loadSlots = useCallback(async (docId: string, bookingDate: string) => {
    if (!docId) return;
    try {
      setLoadingSlots(true);
      const res = await fetch(`/api/appointments/available-slots?doctorId=${docId}&date=${bookingDate}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.slots)) {
        setAvailableSlots(json.slots);
        const firstAvailable = json.slots.find((s: TimeSlot) => s.isAvailable);
        if (firstAvailable) {
          setFormData((prev) => ({ ...prev, timeSlot: firstAvailable.time }));
        } else if (json.slots.length > 0) {
          setFormData((prev) => ({ ...prev, timeSlot: json.slots[0].time }));
        }
      }
    } catch (err) {
      console.error("Failed to load available slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      loadSlots(formData.doctorId, formData.date);
    }
  }, [formData.doctorId, formData.date, loadSlots]);

  // Filter existing patients
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patientsList.slice(0, 5);
    const q = patientSearch.toLowerCase();
    return patientsList.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q)
    ).slice(0, 5);
  }, [patientsList, patientSearch]);

  const handleSelectPatient = (patient: PatientRecord) => {
    setSelectedPatientId(patient.id);
    setFormData((prev) => ({
      ...prev,
      patientName: patient.name,
      patientPhone: patient.phone,
    }));
    setPatientSearch(patient.name);
  };

  const handleTypeChange = (typeId: string) => {
    const selected = appointmentTypes.find((t) => t.id === typeId);
    setFormData((prev) => ({
      ...prev,
      typeId,
      fee: selected ? selected.fee : prev.fee,
    }));
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientName.trim() || !formData.patientPhone.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم ورقم هاتف المريض" : "Please enter patient name and phone");
      return;
    }

    if (!formData.doctorId) {
      toast.error(isRTL ? "يرجى اختيار الطبيب المعالج" : "Please select an attending doctor");
      return;
    }

    // Check slot availability
    const chosenSlot = availableSlots.find((s) => s.time === formData.timeSlot);
    if (chosenSlot && !chosenSlot.isAvailable) {
      toast.error(
        isRTL
          ? "⚠️ هذا الموعد محجوز مسبقًا! يرجى اختيار فترة زمنية أخرى لتجنب الازدواجية."
          : "⚠️ This slot is already booked! Please select another time to prevent double-booking."
      );
      return;
    }

    setSubmitting(true);

    try {
      let finalPatientId = selectedPatientId;

      // If new patient or no ID selected, create patient in DB first
      if (!finalPatientId || patientMode === "new") {
        const patientRes = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.patientName.trim(),
            phone: formData.patientPhone.trim(),
            gender: formData.patientGender,
            notes: formData.notes.trim() || undefined,
          }),
        });

        const patientJson = await patientRes.json();
        if (!patientRes.ok || !patientJson.success) {
          throw new Error(patientJson.error || "Failed to create patient record");
        }

        finalPatientId = patientJson.data.id;
      }

      // Format ISO Date for the appointment
      let hour = 10;
      let minute = 0;
      if (chosenSlot?.startTime) {
        const [h, m] = chosenSlot.startTime.split(":").map(Number);
        hour = h;
        minute = m;
      } else {
        const match = formData.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          hour = Number(match[1]);
          minute = Number(match[2]);
          if (match[3].toUpperCase() === "PM" && hour < 12) hour += 12;
          if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
        }
      }

      const appointmentDate = new Date(`${formData.date}T00:00:00`);
      appointmentDate.setHours(hour, minute, 0, 0);

      const selectedType = appointmentTypes.find((t) => t.id === formData.typeId);

      // Create appointment in DB
      const aptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: finalPatientId,
          doctorId: formData.doctorId,
          date: appointmentDate.toISOString(),
          duration: 30,
          status: "CONFIRMED",
          type: isRTL ? selectedType?.ar : selectedType?.en,
          notes: formData.notes.trim() || undefined,
          fee: formData.fee,
          amountPaid: formData.isPaid ? formData.fee : 0,
          paymentMethod: formData.paymentMethod,
          source: "MANUAL",
          bookingStatus: "APPROVED",
        }),
      });

      const aptJson = await aptRes.json();
      if (!aptRes.ok || !aptJson.success) {
        throw new Error(aptJson.error || "Failed to confirm appointment");
      }

      toast.success(
        isRTL
          ? `✅ تم حجز الموعد بنجاح وحفظ بيانات المريض ${formData.patientName} في قاعدة البيانات!`
          : `✅ Appointment booked & saved to database for ${formData.patientName}!`
      );

      // WhatsApp Trigger if opted
      if (formData.sendWhatsApp && formData.patientPhone) {
        const cleanPhone = formData.patientPhone.replace(/[^0-9]/g, "");
        const intlPhone = cleanPhone.startsWith("0") ? `20${cleanPhone.slice(1)}` : cleanPhone;
        const msg = isRTL
          ? `مرحباً أستاذ/ة ${formData.patientName}، تم تأكيد حجز موعدك بعيادة DOCTECH يوم ${formData.date} الساعة ${formData.timeSlot}. نتمنى لك دوام الصحة!`
          : `Hello ${formData.patientName}, your appointment at DocTech Clinic is confirmed for ${formData.date} at ${formData.timeSlot}. Wishing you good health!`;

        window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, "_blank");
      }

      router.push(`/${locale}/secretary/appointments`);
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err?.message || (isRTL ? "حدث خطأ أثناء حفظ الموعد" : "Failed to book appointment"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-16">
      <Link
        href={`/${locale}/secretary/appointments`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى جدول المواعيد" : "Back to Appointments Registry"}</span>
      </Link>

      <div className="doctech-card p-5 sm:p-8 bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CalendarCheck size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "حجز موعد كشف جديد" : "Book New Patient Appointment"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isRTL
              ? "تسجيل بيانات المريض الحقيقية في قاعدة البيانات وتحديد وقت الكشف ومنع التضارب"
              : "Save live patient data to database, verify time slots, and confirm appointments"}
          </p>
        </div>

        <form onSubmit={handleBook} className="space-y-5">
          {/* Patient Mode Selector */}
          <div className="p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setPatientMode("existing");
                setSelectedPatientId(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                patientMode === "existing"
                  ? "bg-white dark:bg-[#131E2E] text-[#0891B2] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Search size={14} />
              <span>{isRTL ? "مريض مسجل مسبقاً" : "Existing Patient"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPatientMode("new");
                setSelectedPatientId(null);
                setFormData((prev) => ({ ...prev, patientName: "", patientPhone: "" }));
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                patientMode === "new"
                  ? "bg-white dark:bg-[#131E2E] text-[#0891B2] shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserPlus size={14} />
              <span>{isRTL ? "تسجيل مريض جديد" : "New Patient"}</span>
            </button>
          </div>

          {/* Existing Patient Search Autocomplete */}
          {patientMode === "existing" && (
            <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isRTL ? "البحث عن مريض بالاسم أو رقم الهاتف" : "Search Patient by Name or Phone"}
              </label>
              <div className="relative">
                <Search className="doctech-input-icon" size={16} />
                <input
                  type="text"
                  placeholder={isRTL ? "اكتب اسم المريض أو رقم هاتفه..." : "Type patient name or phone number..."}
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (selectedPatientId) setSelectedPatientId(null);
                  }}
                  className="doctech-input"
                />
              </div>

              {loadingPatients ? (
                <div className="text-xs text-slate-400 py-2 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" />
                  <span>{isRTL ? "جاري تحميل سجل المرضى..." : "Loading patient directory..."}</span>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#131E2E] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs mt-2">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className={`w-full p-2.5 text-start text-xs flex items-center justify-between hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors cursor-pointer ${
                        selectedPatientId === p.id ? "bg-cyan-50 dark:bg-cyan-950/40 font-bold text-[#0891B2]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({p.phone})</span>
                      </div>
                      {selectedPatientId === p.id && <CheckCircle2 size={15} className="text-[#0891B2]" />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-1">
                  {isRTL ? "لم يتم العثور على مريض بهذا الاسم. يمكنك التبديل لـ 'تسجيل مريض جديد'." : "No matching patient found. You can switch to 'New Patient'."}
                </p>
              )}
            </div>
          )}

          {/* Patient Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "اسم المريض" : "Patient Name"}
              </label>
              <div className="relative">
                <User className="doctech-input-icon" size={17} />
                <input
                  type="text"
                  required
                  placeholder={isRTL ? "مثال: طارق محمود" : "e.g. Tarek Mahmoud"}
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="doctech-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "رقم الهاتف (واتساب)" : "Phone Number (WhatsApp)"}
              </label>
              <div className="relative">
                <Phone className="doctech-input-icon" size={17} />
                <input
                  type="tel"
                  required
                  placeholder="+20 100 000 0000"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                  className="doctech-input"
                />
              </div>
            </div>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? "الطبيب المعالج" : "Attending Doctor"}
            </label>
            <div className="relative">
              <Stethoscope className="doctech-input-icon" size={17} />
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="doctech-input"
                disabled={loadingDoctors || doctors.length === 0}
              >
                {doctors.length === 0 ? (
                  <option value="">{isRTL ? "لا يوجد أطباء مسجلون في العيادة" : "No doctors found in clinic"}</option>
                ) : (
                  doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Date & Time Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "تاريخ الكشف" : "Date"}
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "فترة الموعد (محدثة لحظياً)" : "Time Slot (Dynamic Availability)"}
              </label>
              <div className="relative">
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  disabled={loadingSlots}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
                >
                  {loadingSlots ? (
                    <option>{isRTL ? "جاري فحص المواعيد المتاحة..." : "Checking available slots..."}</option>
                  ) : availableSlots.length === 0 ? (
                    <option value="10:00 AM">10:00 AM</option>
                  ) : (
                    availableSlots.map((s) => (
                      <option key={s.time} value={s.time} disabled={!s.isAvailable}>
                        {s.time} {!s.isAvailable ? (isRTL ? "⛔ (محجوز)" : "⛔ (Booked)") : (isRTL ? "✅ (متاح)" : "✅ (Available)")}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Consultation Type & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "نوع الكشف" : "Consultation Type"}
              </label>
              <select
                value={formData.typeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
              >
                {appointmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isRTL ? `${t.ar} (${t.fee} ج.م)` : `${t.en} (${t.fee} EGP)`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "المبلغ المستحق (ج.م)" : "Fee Amount (EGP)"}
              </label>
              <div className="relative">
                <DollarSign className="doctech-input-icon" size={17} />
                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                  className="doctech-input font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRTL ? "طريقة الدفع" : "Payment Method"}
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800"
              >
                <option value="CASH">{isRTL ? "نقدي (Cash)" : "Cash"}</option>
                <option value="CARD">{isRTL ? "بطاقة بنكية (Card / POS)" : "Card / POS"}</option>
                <option value="BANK_TRANSFER">{isRTL ? "تحويل بنكي / فودافون كاش" : "Bank / Wallet Transfer"}</option>
                <option value="INSURANCE">{isRTL ? "تأمين طبي (Insurance)" : "Medical Insurance"}</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="w-4 h-4 text-[#0891B2] rounded cursor-pointer"
                />
                <span>{isRTL ? "تم تحصيل المبلغ كاملًا الآن" : "Mark as Paid Now (Immediate Receipt)"}</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRTL ? "الشكوى الرئيسية / ملاحظات الاستقبال" : "Chief Complaint / Intake Notes"}
            </label>
            <textarea
              rows={2}
              placeholder={isRTL ? "وصف مختصر للأعراض والشكوى..." : "Brief description of symptoms..."}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>

          {/* WhatsApp Toggle */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>
                {isRTL
                  ? "إرسال رسالة تأكيد الحجز للمريض عبر الواتساب تلقائيًا"
                  : "Send WhatsApp booking confirmation message automatically"}
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.sendWhatsApp}
              onChange={(e) => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
              className="w-4 h-4 text-[#0891B2] rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 h-11 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-bold shadow-md shadow-cyan-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isRTL ? "جاري حفظ المريض والحجز..." : "Saving to Database..."}</span>
              </>
            ) : (
              <>
                <span>{isRTL ? "تأكيد وحفظ الموعد" : "Confirm & Save Appointment"}</span>
                <Send size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
