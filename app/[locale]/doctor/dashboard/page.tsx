import type { Metadata } from "next";
import {
  CalendarCheck,
  FileText,
  Users,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Inbox,
  UserPlus,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export const metadata: Metadata = { title: "Doctor Dashboard" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DoctorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams?.locale || "en";
  const isRTL = locale === "ar";

  let userId: string | null = null;
  try {
    const authData = await auth();
    userId = authData.userId;
  } catch (e) {
    console.error("Auth error in DoctorDashboardPage:", e);
  }

  // Load real doctor from DB
  let doctor: any = null;
  let clinic: any = null;
  let todayAppointments: any[] = [];
  let pendingReports: any[] = [];
  let totalPatientsCount = 0;
  let unreadMessagesCount = 0;

  if (userId) {
    try {
      const { data: doc, error: docError } = await supabase
        .from("doctors")
        .select("id, name, specialty, clinic_id")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (!docError && doc) {
        doctor = doc;

        // Load clinic
        try {
          const { data: cln } = await supabase
            .from("clinics")
            .select("id, name")
            .eq("id", doc.clinic_id)
            .maybeSingle();
          clinic = cln;
        } catch (e) {
          console.warn("Clinic fetch error:", e);
        }

        // Load today's real appointments
        try {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          const { data: apts } = await supabase
            .from("appointments")
            .select("*, patients(name, phone)")
            .eq("doctor_id", doc.id)
            .gte("date", todayStart.toISOString())
            .lte("date", todayEnd.toISOString())
            .order("date", { ascending: true });

          todayAppointments = apts || [];
        } catch (e) {
          console.warn("Appointments fetch error:", e);
        }

        // Load pending reports
        try {
          const { data: reps, error: repError } = await supabase
            .from("reports")
            .select("*, patients(name)")
            .eq("doctor_id", doc.id)
            .eq("status", "PENDING")
            .order("created_at", { ascending: false })
            .limit(5);

          if (!repError && reps) {
            pendingReports = reps;
          }
        } catch (e) {
          console.warn("Reports fetch error:", e);
        }

        // Count total patients for this clinic
        try {
          const { count: patCount } = await supabase
            .from("patients")
            .select("id", { count: "exact", head: true })
            .eq("clinic_id", doc.clinic_id);

          totalPatientsCount = patCount || 0;
        } catch (e) {
          console.warn("Patients count error:", e);
        }

        // Count unread internal messages
        try {
          const { count: msgCount } = await supabase
            .from("internal_messages")
            .select("id", { count: "exact", head: true })
            .eq("doctor_id", doc.id)
            .eq("is_read", false);

          unreadMessagesCount = msgCount || 0;
        } catch (e) {
          console.warn("Messages count error:", e);
        }
      }
    } catch (e) {
      console.error("Dashboard doctor data fetch error:", e);
    }
  }

  const doctorDisplayName = doctor?.name || "Doctor";
  const clinicDisplayName = clinic?.name || "DOCTECH Clinic";

  const stats = [
    {
      label: "Today's Appointments",
      labelAr: "مواعيد اليوم",
      value: todayAppointments.length.toString(),
      icon: CalendarCheck,
      color: "#1A4B8C",
      bg: "#EFF6FF",
      sub: todayAppointments.length === 0 ? "No visits scheduled" : `${todayAppointments.length} visits`,
      subAr: todayAppointments.length === 0 ? "لا توجد مواعيد اليوم" : `${todayAppointments.length} موعد`,
    },
    {
      label: "Pending Reports",
      labelAr: "تقارير معلقة",
      value: pendingReports.length.toString(),
      icon: FileText,
      color: "#0891B2",
      bg: "#ECFEFF",
      sub: pendingReports.length === 0 ? "All clear" : "Requires review",
      subAr: pendingReports.length === 0 ? "لا توجد تقارير" : "تحتاج مراجعة",
    },
    {
      label: "Total Patients",
      labelAr: "إجمالي المرضى",
      value: totalPatientsCount.toString(),
      icon: Users,
      color: "#10B981",
      bg: "#ECFDF5",
      sub: totalPatientsCount === 0 ? "Registered by secretary" : "Clinic directory",
      subAr: totalPatientsCount === 0 ? "يُسجلون عبر الاستقبال" : "سجل العيادة",
    },
    {
      label: "Unread Messages",
      labelAr: "رسائل غير مقروءة",
      value: unreadMessagesCount.toString(),
      icon: MessageSquare,
      color: "#F59E0B",
      bg: "#FFFBEB",
      sub: "Reception Comms",
      subAr: "محادثات الاستقبال",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Real Clinic & Doctor Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#131E2E] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {isRTL ? "العيادة نشطة" : "Clinic Live & Active"}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {isRTL ? `مرحبًا، د. ${doctorDisplayName.replace(/^Dr\.\s*/i, "")}` : `Welcome back, Dr. ${doctorDisplayName.replace(/^Dr\.\s*/i, "")}`}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {clinicDisplayName} • {doctor?.specialty || (isRTL ? "طبيب العيادة" : "Medical Lead")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/${locale}/doctor/schedule`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1A4B8C] hover:bg-blue-800 text-white shadow-sm shadow-blue-900/10 transition-colors"
          >
            <Calendar size={15} />
            <span>{isRTL ? "الجدول السريري" : "Clinic Timetable"}</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, labelAr, value, icon: Icon, color, bg, sub, subAr }) => (
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
                {isRTL ? "جدول كشوفات اليوم" : "Today's Schedule"}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                {isRTL ? "يُدار ويُحجز بواسطة السكرتيرة" : "Managed & booked by clinic secretary"}
              </p>
            </div>
            <Link href={`/${locale}/doctor/appointments`} className="text-xs font-semibold text-[#1A4B8C] dark:text-blue-400 hover:underline flex items-center gap-1">
              {isRTL ? "عرض الكل" : "View full list"} <ArrowUpRight size={14} />
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            /* Clean Real Empty State */
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#1A4B8C] dark:text-blue-400 flex items-center justify-center mb-3">
                <Inbox size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isRTL ? "لا توجد كشوفات محجوزة اليوم حتى الآن" : "No appointments booked for today yet"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {isRTL
                  ? "يتم حجز المواعيد والكشوفات بواسطة السكرتيرة في مكتب الاستقبال أو عبر شاشة الحجز."
                  : "Patient visits are scheduled through reception by the clinic secretary."}
              </p>
              <Link
                href={`/${locale}/secretary/appointments/new`}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1A4B8C] hover:bg-blue-800 transition-colors shadow-xs"
              >
                <UserPlus size={14} />
                <span>{isRTL ? "تسجيل وحجز مريض عبر السكرتير" : "Book Patient via Secretary"}</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {todayAppointments.map((apt) => {
                const aptTime = new Date(apt.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={apt.id} className="p-3 sm:p-4 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-16 sm:w-20 text-xs font-bold font-mono text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 py-1.5 px-2 rounded-lg border border-gray-100 dark:border-slate-700 text-center shrink-0">
                        {aptTime}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {apt.patients?.name || "Patient"}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 truncate">
                          {apt.type || "Consultation"} {apt.notes ? `• ${apt.notes}` : ""}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Reports / Patient Messages */}
        <div className="bg-white dark:bg-[#131E2E] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              {isRTL ? "تقارير معلقة للمراجعة" : "Pending Reviews"}
            </h2>
            <Link href={`/${locale}/doctor/reports`} className="text-xs font-semibold text-[#1A4B8C] dark:text-blue-400 hover:underline flex items-center gap-1">
              {isRTL ? "الكل" : "All"} <ArrowUpRight size={14} />
            </Link>
          </div>

          {pendingReports.length === 0 ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
                <FileText size={20} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isRTL ? "لا توجد تقارير بانتظار المراجعة" : "No pending reports to review"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRTL ? "جميع الحالات والتحاليل مستوفاة." : "All patient messages are up to date."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {pendingReports.map((rep) => (
                <div key={rep.id} className="p-3 sm:p-4 hover:bg-gray-50/70 transition-colors">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{rep.patients?.name}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{rep.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
