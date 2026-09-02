"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarCheck, ArrowLeft, User, Phone, MessageCircle, Send, DollarSign, Clock, Stethoscope, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DoctorOption {
  id: string;
  name: string;
  nameAr: string;
  specialty: string;
  specialtyAr: string;
}

const doctorsList: DoctorOption[] = [
  { id: "doc-1", name: "Dr. Ahmed Hossam", nameAr: "د. أحمد حسام", specialty: "Cardiology", specialtyAr: "أمراض القلب والأوعية الدموية" },
  { id: "doc-2", name: "Dr. Tarek Omar", nameAr: "د. طارق عمر", specialty: "Internal Medicine", specialtyAr: "الباطنة العامة" },
];

const appointmentTypes = [
  { id: "new", en: "New Consultation", ar: "كشف أول مرة", fee: 400 },
  { id: "followup", en: "Follow-up Check", ar: "إعادة واستشارة", fee: 200 },
  { id: "postop", en: "Post-Op Wound Review", ar: "مراجعة جراحية", fee: 300 },
  { id: "urgent", en: "Urgent Clinical Visit", ar: "كشف طارئ", fee: 500 },
];

const allTimeSlots = [
  { time: "09:00 AM", isBooked: true },
  { time: "09:30 AM", isBooked: true },
  { time: "10:00 AM", isBooked: false },
  { time: "10:30 AM", isBooked: true },
  { time: "11:00 AM", isBooked: false },
  { time: "11:30 AM", isBooked: false },
  { time: "12:00 PM", isBooked: false },
  { time: "01:00 PM", isBooked: true },
  { time: "01:30 PM", isBooked: false },
  { time: "02:00 PM", isBooked: false },
  { time: "02:30 PM", isBooked: false },
  { time: "03:00 PM", isBooked: false },
];

export default function NewAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    doctorId: doctorsList[0].id,
    date: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM",
    typeId: "new",
    fee: 400,
    paymentMethod: "CASH",
    isPaid: false,
    notes: "",
    sendWhatsApp: true,
  });
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (typeId: string) => {
    const selected = appointmentTypes.find((t) => t.id === typeId);
    setFormData((prev) => ({
      ...prev,
      typeId,
      fee: selected ? selected.fee : prev.fee,
    }));
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if slot is already booked (Double-Booking Prevention)
    const slot = allTimeSlots.find((s) => s.time === formData.timeSlot);
    if (slot?.isBooked) {
      toast.error(
        isRTL
          ? "⚠️ هذا الموعد محجوز مسبقًا! يرجى اختيار فترة زمنية أخرى لتجنب الازدواجية."
          : "⚠️ This slot is already booked! Please select another time to prevent double-booking."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      toast.success(
        isRTL
          ? `✅ تم حجز الموعد بنجاح للمريض ${formData.patientName} وتم إرسال رسالة التأكيد عبر الواتساب!`
          : `✅ Appointment booked for ${formData.patientName} & WhatsApp confirmation sent!`
      );
      router.push(`/${locale}/secretary/appointments`);
    }, 400);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <Link
        href={`/${locale}/secretary/appointments`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى جدول المواعيد" : "Back to Appointments Registry"}</span>
      </Link>

      <div className="doctech-card p-5 sm:p-8 bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CalendarCheck size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isRTL ? "حجز موعد كشف جديد" : "Book New Patient Appointment"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isRTL
              ? "تسجيل بيانات المريض وتحديد وقت الكشف ومنع الازدواجية وإرسال التنبيه التلقائي"
              : "Pick doctor, check slot availability, prevent double-booking, and trigger WhatsApp reminder"}
          </p>
        </div>

        <form onSubmit={handleBook} className="space-y-4">
          {/* Patient Info */}
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
              >
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {isRTL ? `${doc.nameAr} (${doc.specialtyAr})` : `${doc.name} (${doc.specialty})`}
                  </option>
                ))}
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
                {isRTL ? "فترة الموعد (الفترات المتاحة)" : "Time Slot (Availability Checked)"}
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
              >
                {allTimeSlots.map((s) => (
                  <option key={s.time} value={s.time} disabled={s.isBooked}>
                    {s.time} {s.isBooked ? (isRTL ? "⛔ (محجوز)" : "⛔ (Booked)") : (isRTL ? "✅ (متاح)" : "✅ (Available)")}
                  </option>
                ))}
              </select>
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
            disabled={loading}
            className="w-full mt-2 h-11 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-bold shadow-md shadow-cyan-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{loading ? (isRTL ? "جاري التأكيد..." : "Confirming Booking...") : (isRTL ? "تأكيد وحفظ الموعد" : "Confirm & Save Appointment")}</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
