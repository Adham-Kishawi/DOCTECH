"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, CalendarCheck, BarChart2,
  MessageSquare, Bell, Users, User, BellRing, Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
// import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
// import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DiscreetAlert } from "@/components/shared/DiscreetAlert";
import { realtimeBus } from "@/lib/realtimeService";
import { toast } from "sonner";

const navItems = [
  { href: "dashboard", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "appointments", labelEn: "Appointments", labelAr: "المواعيد", icon: CalendarCheck },
  { href: "schedule", labelEn: "Schedule", labelAr: "الجدول", icon: Calendar },
  { href: "reports", labelEn: "Reports", labelAr: "التقارير", icon: BarChart2 },
  { href: "communications", labelEn: "Internal Comms", labelAr: "التواصل الداخلي", icon: MessageSquare },
  { href: "notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: Bell },
  { href: "team", labelEn: "My Team", labelAr: "الفريق", icon: Users },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isRTL = locale === "ar";

  const handleSummonSecretary = () => {
    realtimeBus.publish({
      type: "SUMMON_SECRETARY",
      payload: {
        doctorName: "Dr. Clinical Lead",
        room: "Examination Room #1",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        urgent: true,
      },
    });
    toast.info(isRTL ? "🚨 تم إرسال جرس وتنبيه استدعاء السكرتيرة فوراً!" : "🚨 Secretary summoned to Exam Room #1!");
  };

  return (
    <AuthGuard allowedRole="doctor">
      <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B131E]">
        {/* Discreet Reception Alert */}
        <DiscreetAlert />

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 flex flex-col z-30 bg-white dark:bg-[#131E2E] border-slate-200/80 dark:border-slate-800 shadow-xs",
            isRTL ? "right-0 border-l" : "left-0 border-r"
          )}
          style={{ width: "210px" }}
        >
          {/* Brand */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Logo size={32} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {navItems.map(({ href, labelEn, labelAr, icon: Icon }) => {
              const isActive = pathname.includes(`/doctor/${href}`);
              return (
                <Link
                  key={href}
                  href={`/${locale}/doctor/${href}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                    isActive
                      ? "bg-[#3368A0] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  <span>{isRTL ? labelAr : labelEn}</span>
                </Link>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/${locale}/doctor/profile`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                pathname.includes("/doctor/profile")
                  ? "bg-[#3368A0] text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <User size={16} />
              <span>{isRTL ? "الملف الشخصي" : "Profile"}</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ [isRTL ? "marginRight" : "marginLeft"]: "210px" }}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-15 bg-white/90 dark:bg-[#131E2E]/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRTL ? "د. أحمد حسام — عيادات النور التخصصية" : "Dr. Clinical Lead — Medical Practice"}
              </span>

              {/* URGENT SUMMON BUTTON */}
              <button
                onClick={handleSummonSecretary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm hover:shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
                title="Immediately summon secretary to examination room"
              >
                <BellRing size={14} className="animate-pulse" />
                <span>{isRTL ? "استدعاء السكرتيرة" : "Summon Secretary"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* <ThemeToggle /> */}
              {/* <LanguageSwitcher /> */}
              <UserMenu
                name={isRTL ? "د. أحمد حسام" : "Dr. Clinical Lead"}
                role="Doctor"
                email="doctor@doctech.com"
                color="#3368A0"
              />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
