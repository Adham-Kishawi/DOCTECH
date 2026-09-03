import type { Metadata } from "next";
import { CalendarCheck, FileText, Users, MessageSquare, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Doctor Dashboard" };

const stats = [
  { label: "Today's Appointments", labelAr: "مواعيد اليوم", value: "8", icon: CalendarCheck, color: "#1A4B8C", bg: "#EFF6FF", darkBg: "#1A4B8C20", sub: "2 remaining", subAr: "٢ متبقية" },
  { label: "Pending Reports", labelAr: "تقارير معلقة", value: "3", icon: FileText, color: "#0891B2", bg: "#ECFEFF", darkBg: "#0891B220", sub: "Requires review", subAr: "تحتاج مراجعة" },
  { label: "Total Patients", labelAr: "إجمالي المرضى", value: "142", icon: Users, color: "#10B981", bg: "#ECFDF5", darkBg: "#10B98120", sub: "+12 this month", subAr: "+١٢ هذا الشهر" },
  { label: "Unread Messages", labelAr: "رسائل غير مقروءة", value: "2", icon: MessageSquare, color: "#F59E0B", bg: "#FFFBEB", darkBg: "#F59E0B20", sub: "From Sarah (Sec)", subAr: "من سارة (سكرتيرة)" },
];

const todayAppointments = [
  { id: "1", time: "09:00 AM", patient: "Ahmed Hassan", patientAr: "أحمد حسن", type: "Follow-up Check", typeAr: "متابعة", status: "confirmed", notes: "Blood pressure review", notesAr: "مراجعة ضغط الدم" },
  { id: "2", time: "10:30 AM", patient: "Sara Ibrahim", patientAr: "سارة إبراهيم", type: "New Consultation", typeAr: "كشف جديد", status: "scheduled", notes: "Initial diagnosis", notesAr: "تشخيص مبدئي" },
  { id: "3", time: "11:00 AM", patient: "Mohamed Ali", patientAr: "محمد علي", type: "Lab Results Review", typeAr: "مراجعة تحاليل", status: "confirmed", notes: "Post-op follow up", notesAr: "متابعة ما بعد العملية" },
  { id: "4", time: "02:00 PM", patient: "Fatima Omar", patientAr: "فاطمة عمر", type: "Follow-up", typeAr: "متابعة", status: "scheduled", notes: "Prescription renewal", notesAr: "تجديد روشتة" },
];

const pendingReports = [
  { id: "rep-101", patient: "Kareem Tarek", patientAr: "كريم طارق", summary: "Persistent fever for 3 days post medication", summaryAr: "حرارة مستمرة ٣ أيام بعد الدواء", urgency: "High", time: "10 mins ago", timeAr: "منذ ١٠ دقائق" },
  { id: "rep-102", patient: "Nouran Mahmoud", patientAr: "نوران محمود", summary: "CBC and Glucose test results attached", summaryAr: "نتائج تحاليل صورة الدم والسكر مرفقة", urgency: "Normal", time: "45 mins ago", timeAr: "منذ ٤٥ دقيقة" },
  { id: "rep-103", patient: "Hany Youssef", patientAr: "هاني يوسف", summary: "Mild rash after taking antibiotics", summaryAr: "طفح جلدي خفيف بعد المضاد الحيوي", urgency: "Medium", time: "2 hours ago", timeAr: "منذ ساعتين" },
];

export default async function DoctorDashboardPage({
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {isRTL ? "العيادة نشطة" : "Clinic Live & Active"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            {isRTL ? "مرحبًا، د. أحمد حسام" : "Welcome back, Dr. Clinical Lead"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {isRTL ? "عيادة الأمل • بوابة الطبيب الرئيسي" : "Al-Amal Clinic • Medical Lead Portal"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/doctor/reports`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1A4B8C] text-white hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/10"
          >
            <FileText size={16} />
            {isRTL ? "مراجعة معلقة (3)" : "Review Pending (3)"}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, labelAr, value, icon: Icon, color, bg, darkBg, sub, subAr }) => (
          <div key={label} className="bg-white dark:bg-[#131E2E] p-3 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">{isRTL ? labelAr : label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">{isRTL ? subAr : sub}</p>
              </div>
              <div
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon size={18} color={color} className="sm:!w-[22px] sm:!h-[22px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131E2E] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {isRTL ? "جدول اليوم (للاطلاع فقط)" : "Today\u0027s Schedule (Read-Only)"}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                {isRTL ? "يُدار بواسطة السكرتيرة" : "Managed by clinic secretary"}
              </p>
            </div>
            <Link href={`/${locale}/doctor/appointments`} className="text-xs font-semibold text-[#1A4B8C] dark:text-blue-400 hover:underline flex items-center gap-1">
              {isRTL ? "عرض الكل" : "View full list"} <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="p-3 sm:p-4 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-16 sm:w-20 text-xs font-bold font-mono text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 py-1.5 px-2 rounded-lg border border-gray-100 dark:border-slate-700 text-center shrink-0">
                    {apt.time}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{isRTL ? apt.patientAr : apt.patient}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 truncate">
                      {isRTL ? apt.typeAr : apt.type} • {isRTL ? apt.notesAr : apt.notes}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full shrink-0 ${
                    apt.status === "confirmed"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
                      : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                  }`}
                >
                  {apt.status === "confirmed"
                    ? (isRTL ? "مؤكد" : "Confirmed")
                    : (isRTL ? "مجدول" : "Scheduled")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Triage & Urgent Reports */}
        <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {isRTL ? "استفسارات عاجلة" : "Urgent Inquiries"}
            </h2>
            <span className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900">
              {isRTL ? "٣ معلقة" : "3 Pending"}
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {pendingReports.map((rep) => (
              <Link
                key={rep.id}
                href={`/${locale}/doctor/reports`}
                className="block p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{isRTL ? rep.patientAr : rep.patient}</span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{isRTL ? rep.timeAr : rep.time}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-slate-400 line-clamp-2">
                  {isRTL ? rep.summaryAr : rep.summary}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rep.urgency === "High"
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400"
                    }`}
                  >
                    {rep.urgency}
                  </span>
                  <span className="text-xs font-semibold text-[#1A4B8C] dark:text-blue-400">
                    {isRTL ? "مراجعة ←" : "Review →"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
