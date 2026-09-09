import type { Metadata } from "next";
import { CalendarCheck, FileText, Users, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Secretary Dashboard" };

const stats = [
  { label: "Today's Appointments", labelAr: "مواعيد اليوم", value: "12", icon: CalendarCheck, color: "#0891B2", bg: "#ECFEFF", sub: "4 completed", subAr: "٤ مكتملة" },
  { label: "Pending Reports", labelAr: "تقارير معلقة", value: "5", icon: FileText, color: "#F59E0B", bg: "#FFFBEB", sub: "2 ready for reply", subAr: "٢ جاهزة للرد" },
  { label: "Total Patients", labelAr: "إجمالي المرضى", value: "284", icon: Users, color: "#10B981", bg: "#ECFDF5", sub: "Active directory", subAr: "السجل النشط" },
  { label: "WhatsApp Chats", labelAr: "محادثات واتساب", value: "7", icon: MessageCircle, color: "#6366F1", bg: "#EEF2FF", sub: "3 new inquiries", subAr: "٣ استفسارات جديدة" },
];

const appointments = [
  { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", patientAr: "أحمد حسن", doctor: "Dr. Clinical Lead", phone: "+20 100 123 4567", status: "confirmed" },
  { id: "2", time: "09:30 AM", patient: "Youssef Nabil", patientAr: "يوسف نبيل", doctor: "Dr. Clinical Lead", phone: "+20 101 234 5678", status: "completed" },
  { id: "3", time: "10:30 AM", patient: "Sara Ibrahim", patientAr: "سارة إبراهيم", doctor: "Dr. Clinical Lead", phone: "+20 102 345 6789", status: "scheduled" },
  { id: "4", time: "11:00 AM", patient: "Mohamed Ali", patientAr: "محمد علي", doctor: "Dr. Clinical Lead", phone: "+20 103 456 7890", status: "confirmed" },
];

export default async function SecretaryDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === "ar";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-[#0891B2] dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] animate-pulse"></span>
            {isRTL ? "مكتب الاستقبال نشط" : "Reception Desk Active"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            {isRTL ? "مركز عمليات السكرتارية" : "Secretary Operations Center"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {isRTL ? "سارة جنكينز • عيادة الأمل" : "Sarah Jenkins • Al-Amal Clinic"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0891B2] text-white hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-900/10"
          >
            <Plus size={16} />
            {isRTL ? "موعد جديد" : "New Appointment"}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, labelAr, value, icon: Icon, color, bg, sub, subAr }) => (
          <div key={label} className="bg-white dark:bg-[#131E2E] p-3 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {isRTL ? labelAr : label}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">{isRTL ? subAr : sub}</p>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon size={18} color={color} className="sm:!w-[22px] sm:!h-[22px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today Appointments */}
      <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {isRTL ? "جدول المواعيد" : "Appointments Schedule"}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
              {isRTL ? "حجز مباشر، تحديث الحالة، واستقبال المرضى" : "Live booking, status updating, and patient intake"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/secretary/appointments`} className="text-xs font-semibold text-[#0891B2] dark:text-cyan-400 hover:underline">
              {isRTL ? "إدارة كاملة" : "View full management"}
            </Link>
          </div>
        </div>

        {/* Mobile: card view. Desktop: list view */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {appointments.map((apt) => (
            <div key={apt.id} className="p-3 sm:p-4 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-16 sm:w-20 text-xs font-bold font-mono text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 py-1.5 px-2 rounded-lg border border-gray-100 dark:border-slate-700 text-center shrink-0">
                  {apt.time}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                    {isRTL ? apt.patientAr : apt.patient}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 truncate">
                    {apt.phone}
                    <span className="hidden sm:inline"> • {apt.doctor}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={`text-[9px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
                    apt.status === "completed"
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400"
                      : apt.status === "confirmed"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
                      : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                  }`}
                >
                  {isRTL
                    ? (apt.status === "confirmed" ? "مؤكد" : apt.status === "completed" ? "مكتمل" : "مجدول")
                    : apt.status.toUpperCase()}
                </span>
                <Link
                  href={`/${locale}/secretary/appointments/${apt.id}`}
                  className="text-xs font-semibold text-[#0891B2] dark:text-cyan-400 hover:underline px-1.5 sm:px-2 py-1 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hidden sm:block"
                >
                  {isRTL ? "تعديل ←" : "Edit →"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
