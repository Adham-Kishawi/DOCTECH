import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\secretary";

// ============================================
// 1. SECRETARY APPOINTMENTS CRUD
// ============================================
const secAppointments = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  CalendarCheck, Plus, Search, Filter, Clock, User, Phone, 
  CheckCircle2, AlertCircle, XCircle, ChevronRight, Edit3, Trash2
} from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  type: string;
  status: "confirmed" | "scheduled" | "completed" | "cancelled";
  notes: string;
}

export default function SecretaryAppointmentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "APT-201", time: "09:00 AM", patientName: "Ahmed Hassan", patientPhone: "+20 100 123 4567", doctorName: "Dr. Clinical Lead", type: "Follow-up", status: "confirmed", notes: "Blood pressure evaluation" },
    { id: "APT-202", time: "09:30 AM", patientName: "Youssef Nabil", patientPhone: "+20 101 234 5678", doctorName: "Dr. Clinical Lead", type: "General Check-up", status: "completed", notes: "Annual wellness visit" },
    { id: "APT-203", time: "10:30 AM", patientName: "Sara Ibrahim", patientPhone: "+20 102 345 6789", doctorName: "Dr. Clinical Lead", type: "New Consultation", status: "scheduled", notes: "Migraine complaints" },
    { id: "APT-204", time: "11:00 AM", patientName: "Mohamed Ali", patientPhone: "+20 103 456 7890", doctorName: "Dr. Clinical Lead", type: "Post-Op Review", status: "confirmed", notes: "Wound assessment" },
    { id: "APT-205", time: "01:00 PM", patientName: "Fatima Omar", patientPhone: "+20 104 567 8901", doctorName: "Dr. Clinical Lead", type: "Follow-up", status: "scheduled", notes: "Thyroid follow-up" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleUpdateStatus = (id: string, newStatus: Appointment["status"]) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(isRTL ? \`تم تحديث حالة الموعد إلى \${newStatus}\` : \`Appointment status updated to \${newStatus}\`);
  };

  const filtered = appointments.filter((apt) => {
    const matchesFilter = filterStatus === "all" || apt.status === filterStatus;
    const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || apt.patientPhone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-[#0891B2] border border-cyan-200 mb-1.5">
            <CalendarCheck size={13} />
            {isRTL ? "إدارة وتنظيم المواعيد (CRUD)" : "Reception Appointments Management"}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isRTL ? "جدول الحجوزات والمواعيد" : "Appointments Registry"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isRTL
              ? "حجز مواعيد جديدة، تحديث الحالات، وتأكيد الحضور عبر الواتساب"
              : "Book, reschedule, cancel, and manage patient appointments"}
          </p>
        </div>

        <Link
          href={\`/\${locale}/secretary/appointments/new\`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-md shadow-cyan-900/15 transition-all"
        >
          <Plus size={16} />
          <span>{isRTL ? "حجز موعد جديد" : "New Appointment"}</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="doctech-input-icon" size={16} />
          <input
            type="text"
            placeholder={isRTL ? "بحث بالاسم أو الهاتف..." : "Search patient name or phone..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="doctech-input !h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "confirmed", "scheduled", "completed", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize \${
                filterStatus === st
                  ? "bg-[#0891B2] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }\`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments CRUD Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map((apt) => (
          <div key={apt.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-16 h-12 rounded-xl bg-cyan-50 text-[#0891B2] font-mono text-xs font-extrabold flex flex-col items-center justify-center shrink-0 border border-cyan-100">
                <span>{apt.time.split(" ")[0]}</span>
                <span className="text-[9px] uppercase">{apt.time.split(" ")[1]}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                  <span className="text-xs font-mono text-slate-400 font-bold">({apt.id})</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {apt.patientPhone} • {apt.type} • {apt.doctorName}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Notes: {apt.notes}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <select
                value={apt.status}
                onChange={(e) => handleUpdateStatus(apt.id, e.target.value as Appointment["status"])}
                className="h-8 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:bg-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Link
                href={\`/\${locale}/secretary/appointments/\${apt.id}\`}
                className="p-2 text-slate-500 hover:text-[#0891B2] hover:bg-cyan-50 rounded-lg transition-colors"
                title="Edit / Reschedule"
              >
                <Edit3 size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`;

// ============================================
// 2. NEW APPOINTMENT BOOKING WIZARD
// ============================================
const newAppointment = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarCheck, ArrowLeft, User, Phone, Calendar, Clock, Stethoscope, MessageCircle, Send } from "lucide-react";
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
      router.push(\`/\${locale}/secretary/appointments\`);
    }, 400);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={\`/\${locale}/secretary/appointments\`}
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
}`;

fs.writeFileSync(path.join(base, "appointments", "page.tsx"), secAppointments, "utf8");
fs.writeFileSync(path.join(base, "appointments", "new", "page.tsx"), newAppointment, "utf8");
console.log("secretary/appointments & new written");
