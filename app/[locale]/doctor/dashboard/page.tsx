import type { Metadata } from "next";
import { CalendarCheck, FileText, Users, MessageSquare, Clock, ArrowUpRight, CheckCircle2, User } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Doctor Dashboard" };

const stats = [
  { label: "Today's Appointments", value: "8", icon: CalendarCheck, color: "#1A4B8C", bg: "#EFF6FF", sub: "2 remaining" },
  { label: "Pending Reports", value: "3", icon: FileText, color: "#0891B2", bg: "#ECFEFF", sub: "Requires review" },
  { label: "Total Patients", value: "142", icon: Users, color: "#10B981", bg: "#ECFDF5", sub: "+12 this month" },
  { label: "Unread Messages", value: "2", icon: MessageSquare, color: "#F59E0B", bg: "#FFFBEB", sub: "From Sarah (Sec)" },
];

const todayAppointments = [
  { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", type: "Follow-up Check", status: "confirmed", notes: "Blood pressure review" },
  { id: "2", time: "10:30 AM", patient: "Sara Ibrahim", type: "New Consultation", status: "scheduled", notes: "Initial diagnosis" },
  { id: "3", time: "11:00 AM", patient: "Mohamed Ali", type: "Lab Results Review", status: "confirmed", notes: "Post-op follow up" },
  { id: "4", time: "02:00 PM", patient: "Fatima Omar", type: "Follow-up", status: "scheduled", notes: "Prescription renewal" },
];

const pendingReports = [
  { id: "rep-101", patient: "Kareem Tarek", summary: "Persistent fever for 3 days post medication", urgency: "High", time: "10 mins ago" },
  { id: "rep-102", patient: "Nouran Mahmoud", summary: "CBC and Glucose test results attached", urgency: "Normal", time: "45 mins ago" },
  { id: "rep-103", patient: "Hany Youssef", summary: "Mild rash after taking antibiotics", urgency: "Medium", time: "2 hours ago" },
];

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Clinic Live & Active
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Welcome back, Dr. Clinical Lead
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Al-Amal Clinic • Medical Lead Portal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/en/doctor/reports/1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#1A4B8C] text-white hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/10"
          >
            <FileText size={16} />
            Review Pending (3)
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon size={22} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Today&apos;s Schedule (Read-Only)</h2>
              <p className="text-xs text-gray-500">Managed by clinic secretary</p>
            </div>
            <Link href="/en/doctor/appointments" className="text-xs font-semibold text-[#1A4B8C] hover:underline flex items-center gap-1">
              View full list <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-xs font-bold font-mono text-gray-600 bg-gray-50 py-1.5 px-2 rounded-lg border border-gray-100 text-center">
                    {apt.time}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{apt.patient}</h3>
                    <p className="text-xs text-gray-500">{apt.type} • {apt.notes}</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    apt.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}
                >
                  {apt.status === "confirmed" ? "Confirmed" : "Scheduled"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Triage & Urgent Reports */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Urgent Inquiries</h2>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              3 Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingReports.map((rep) => (
              <Link
                key={rep.id}
                href="/en/doctor/reports/1"
                className="block p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">{rep.patient}</span>
                  <span className="text-[10px] text-gray-400">{rep.time}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{rep.summary}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rep.urgency === "High"
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {rep.urgency}
                  </span>
                  <span className="text-xs font-semibold text-[#1A4B8C]">Review →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}