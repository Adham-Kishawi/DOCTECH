"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarCheck, ArrowLeft, User, Phone, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function NewAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    doctorName: "Dr. Clinical Lead",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM",
    type: "New Consultation",
    notes: "",
    sendWhatsApp: true,
  });
  const [loading, setLoading] = useState(false);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      toast.success(isRTL ? "تم حجز الموعد وإرسال رسالة التأكيد عبر الواتساب للمريض!" : "Appointment booked & WhatsApp confirmation sent to patient!");
      router.push(`/${locale}/secretary/appointments`);
    }, 400);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/${locale}/secretary/appointments`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى جدول المواعيد" : "Back to Appointments Registry"}</span>
      </Link>

      <div className="doctech-card p-7 sm:p-9 bg-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0891B2] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CalendarCheck size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRTL ? "حجز موعد كشف جديد" : "Book New Patient Appointment"}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isRTL
              ? "تسجيل بيانات المريض وتحديد وقت الكشف وإرسال التنبيه التلقائي"
              : "Enter patient details, pick consultation slot, and trigger WhatsApp reminder"}
          </p>
        </div>

        <form onSubmit={handleBook} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Patient Name</label>
              <div className="relative">
                <User className="doctech-input-icon" size={17} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Tarek Mahmoud"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="doctech-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number (WhatsApp)</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Time Slot</label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
              >
                {["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Consultation Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            >
              <option value="New Consultation">New Consultation (كشف أول مرة)</option>
              <option value="Follow-up">Follow-up Check (إعادة واستشارة)</option>
              <option value="Post-Op Wound Review">Post-Op Review (مراجعة جراحية)</option>
              <option value="Urgent Clinical Visit">Urgent Clinical Visit (كشف طارئ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Chief Complaint / Intake Notes</label>
            <textarea
              rows={2}
              placeholder="Brief description of symptoms..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <MessageCircle size={16} className="text-emerald-600" />
              <span>Send WhatsApp booking confirmation message automatically</span>
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
            <span>{loading ? "Confirming Booking..." : "Confirm & Save Appointment"}</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
