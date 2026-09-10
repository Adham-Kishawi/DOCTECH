"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  BarChart2,
  MessageSquare,
  Bell,
  Users,
  User,
  BellRing,
  MessageCircle,
  Menu,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DiscreetAlert } from "@/components/shared/DiscreetAlert";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { realtimeBus } from "@/lib/realtimeService";
import { toast } from "sonner";

const navItems = [
  {
    href: "dashboard",
    labelEn: "Dashboard",
    labelAr: "لوحة التحكم",
    icon: LayoutDashboard,
  },
  {
    href: "appointments",
    labelEn: "Appointments",
    labelAr: "المواعيد",
    icon: CalendarCheck,
  },
  {
    href: "schedule",
    labelEn: "Schedule",
    labelAr: "الجدول",
    icon: Calendar,
  },
  {
    href: "finance",
    labelEn: "Earnings & Finance",
    labelAr: "المالية والأرباح",
    icon: DollarSign,
  },
  {
    href: "reports",
    labelEn: "Reports",
    labelAr: "التقارير",
    icon: BarChart2,
  },
  {
    href: "communications",
    labelEn: "Staff Chat & Comms",
    labelAr: "المحادثات والتواصل الداخلي",
    icon: MessageSquare,
  },
  {
    href: "notifications",
    labelEn: "Notifications",
    labelAr: "الإشعارات",
    icon: Bell,
  },
  {
    href: "team",
    labelEn: "My Team",
    labelAr: "الفريق",
    icon: Users,
  },
  {
    href: "whatsapp",
    labelEn: "WhatsApp",
    labelAr: "واتساب",
    icon: MessageCircle,
  },
];

type DoctorProfile = {
  name: string;
  email: string;
  specialty: string | null;
};

type Clinic = {
  name: string;
};

type ProfileResponse = {
  success: boolean;
  user: DoctorProfile;
  clinic: Clinic | null;
  error?: string;
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);

  useEffect(() => {
    async function loadDoctorProfile() {
      try {
        const response = await fetch("/api/doctor/profile");

        if (!response.ok) {
          return;
        }

        const data: ProfileResponse = await response.json();

        if (data.success) {
          setDoctor(data.user);
          setClinic(data.clinic);
        }
      } catch (error) {
        console.error("Failed to load doctor profile:", error);
      }
    }

    loadDoctorProfile();
  }, []);

  const handleSummonSecretary = () => {
    realtimeBus.publish({
      type: "SUMMON_SECRETARY",
      payload: {
        doctorName: doctor?.name || "Doctor",
        room: "Examination Room #1",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        urgent: true,
      },
    });

    toast.info(
      isRTL
        ? "🚨 تم إرسال جرس وتنبيه استدعاء السكرتيرة فوراً!"
        : "🚨 Secretary summoned to Exam Room #1!"
    );
  };

  const doctorName = doctor?.name || "Doctor";
  const doctorEmail = doctor?.email || "";
  const doctorSpecialty = doctor?.specialty || "Medical Practice";
  const clinicName = clinic?.name || "";

  const headerTitle = isRTL
    ? `د. ${doctorName.replace(/^Dr\.\s*/i, "")}${clinicName ? ` — ${clinicName}` : ""}`
    : `Dr. ${doctorName.replace(/^Dr\.\s*/i, "")}${
        clinicName ? ` — ${clinicName}` : ""
      }`;

  return (
    <AuthGuard allowedRole="doctor">
      <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B131E]">
        {/* Discreet Reception Alert */}
        <DiscreetAlert />

        {/* Mobile Sidebar Drawer */}
        <MobileSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navItems={navItems}
          role="doctor"
          locale={locale}
          isRTL={isRTL}
          pathname={pathname}
          activeColor="#3368A0"
        />

        {/* Desktop Sidebar — hidden on mobile */}
        <aside
          className={cn(
            "fixed inset-y-0 hidden md:flex flex-col z-30 bg-white dark:bg-[#131E2E] border-slate-200/80 dark:border-slate-800 shadow-xs",
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
                  <Icon
                    size={16}
                    className={isActive ? "text-white" : "text-slate-400"}
                  />

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
          className={cn(
            "flex-1 flex flex-col min-w-0",
            "md:transition-[margin]"
          )}
          style={{
            [`${isRTL ? "marginRight" : "marginLeft"}`]: undefined,
          }}
        >
          {/* Apply margin only on md+ via a wrapper with CSS */}
          <style>{`
            @media (min-width: 768px) {
              .doctech-main-offset {
                ${isRTL ? "margin-right" : "margin-left"}: 210px;
              }
            }
          `}</style>

          <div className="flex-1 flex flex-col min-w-0 doctech-main-offset">
            {/* Top Bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 h-14 sm:h-15 bg-white/90 dark:bg-[#131E2E]/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Hamburger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  aria-label="Open sidebar"
                >
                  <Menu
                    size={20}
                    className="text-slate-600 dark:text-slate-400"
                  />
                </button>

                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate hidden sm:block">
                  {headerTitle}
                </span>

                {/* URGENT SUMMON BUTTON */}
                <button
                  onClick={handleSummonSecretary}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold shadow-sm hover:shadow-red-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                  title="Immediately summon secretary to examination room"
                >
                  <BellRing size={14} className="animate-pulse" />

                  <span className="hidden xs:inline">
                    {isRTL ? "استدعاء السكرتيرة" : "Summon Secretary"}
                  </span>

                  <span className="xs:hidden">
                    {isRTL ? "استدعاء" : "Summon"}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <NotificationBell
                  role="doctor"
                  locale={locale}
                  isRTL={false}
                />

                <UserMenu
                  name={doctorName}
                  role="Doctor"
                  email={doctorEmail}
                  color="#3368A0"
                />
              </div>
            </header>

            {/* Page Content — add bottom padding on mobile for BottomNav */}
            <main className="flex-1 p-3 sm:p-6 overflow-auto pb-20 md:pb-6">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav
          items={navItems}
          role="doctor"
          locale={locale}
          isRTL={isRTL}
          pathname={pathname}
          activeColor="#3368A0"
        />
      </div>
    </AuthGuard>
  );
}