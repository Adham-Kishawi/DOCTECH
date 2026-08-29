import type { Metadata } from "next";
import { CalendarCheck, FileText, Users, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Secretary Dashboard" };

const stats = [
  { label: "Today's Appointments", value: "12", icon: CalendarCheck, color: "#0891B2", bg: "#ECFEFF", sub: "4 completed" },
  { label: "Pending Reports", value: "5", icon: FileText, color: "#F59E0B", bg: "#FFFBEB", sub: "2 ready for reply" },
  { label: "Total Patients", value: "284", icon: Users, color: "#10B981", bg: "#ECFDF5", sub: "Active directory" },
  { label: "WhatsApp Chats", value: "7", icon: MessageCircle, color: "#6366F1", bg: "#EEF2FF", sub: "3 new inquiries" },
];

const appointments = [
  { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", doctor: "Dr. Clinical Lead", phone: "+20 100 123 4567", status: "confirmed" },
  { id: "2", time: "09:30 AM", patient: "Youssef Nabil", doctor: "Dr. Clinical Lead", phone: "+20 101 234 5678", status: "completed" },
  { id: "3", time: "10:30 AM", patient: "Sara Ibrahim", doctor: "Dr. Clinical Lead", phone: "+20 102 345 6789", status: "scheduled" },
  { id: "4", time: "11:00 AM", patient: "Mohamed Ali", doctor: "Dr. Clinical Lead", phone: "+20 103 456 7890", status: "confirmed" },
];

export default async function SecretaryDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-[#0891B2] border border-cyan-100 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] animate-pulse"></span>
            Reception Desk Active
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Secretary Operations Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sarah Jenkins • Al-Amal Clinic
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0891B2] text-white hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-900/10"
          >
            <Plus size={16} />
            New Appointment
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

      {/* Today Appointments CRUD Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Appointments Schedule</h2>
            <p className="text-xs text-gray-500">Live booking, status updating, and patient intake</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/secretary/appointments`} className="text-xs font-semibold text-[#0891B2] hover:underline">
              View full management
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {appointments.map((apt) => (
            <div key={apt.id} className="p-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 text-xs font-bold font-mono text-gray-600 bg-gray-50 py-1.5 px-2 rounded-lg border border-gray-100 text-center">
                  {apt.time}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{apt.patient}</h3>
                  <p className="text-xs text-gray-500">{apt.phone} • {apt.doctor}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    apt.status === "completed"
                      ? "bg-gray-100 text-gray-700"
                      : apt.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}
                >
                  {apt.status.toUpperCase()}
                </span>
                <Link
                  href={`/${locale}/secretary/appointments/${apt.id}`}
                  className="text-xs font-semibold text-[#0891B2] hover:underline px-2 py-1 rounded hover:bg-cyan-50"
                >
                  Edit →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
