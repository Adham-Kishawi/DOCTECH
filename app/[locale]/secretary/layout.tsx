"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, CalendarCheck, BarChart2,
  MessageSquare, Bell, Users, User, MessageCircle, HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

const navItems = [
  { href: "dashboard", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "appointments", labelEn: "Appointments", labelAr: "المواعيد", icon: CalendarCheck },
  { href: "schedule", labelEn: "Schedule", labelAr: "الجدول", icon: Calendar },
  { href: "patients", labelEn: "Patients", labelAr: "المرضى", icon: Users },
  { href: "reports", labelEn: "Reports", labelAr: "التقارير", icon: BarChart2 },
  { href: "whatsapp", labelEn: "WhatsApp", labelAr: "واتساب", icon: MessageCircle },
  { href: "communications", labelEn: "Internal Comms", labelAr: "التواصل الداخلي", icon: MessageSquare },
  { href: "notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: Bell },
];

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isRTL = locale === "ar";

  return (
    <div className="flex min-h-screen bg-[#F7F5F0]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 flex flex-col z-30 bg-white border-gray-200/80 shadow-sm",
          isRTL ? "right-0 border-l" : "left-0 border-r"
        )}
        style={{ width: "200px" }}
      >
        {/* Brand */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0891B2] text-white flex items-center justify-center shadow-sm">
            <HeartPulse size={18} />
          </div>
          <div>
            <span className="text-sm font-extrabold text-gray-900 block leading-tight">DOCTECH</span>
            <span className="text-[10px] font-semibold text-cyan-800 uppercase tracking-wider block">
              Secretary Desk
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, labelEn, labelAr, icon: Icon }) => {
            const isActive = pathname.includes(`/secretary/${href}`);
            return (
              <Link
                key={href}
                href={`/${locale}/secretary/${href}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-[#0891B2] text-white shadow-sm shadow-cyan-950/10"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-gray-400"} />
                <span>{isRTL ? labelAr : labelEn}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-gray-100">
          <Link
            href={`/${locale}/secretary/profile`}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
              pathname.includes("/secretary/profile")
                ? "bg-[#0891B2] text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
        style={{ [isRTL ? "marginRight" : "marginLeft"]: "200px" }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-15 bg-white/90 backdrop-blur border-b border-gray-200/70 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800">
              {isRTL ? "سارة جنكينز — مكتب الاستقبال وإدارة المواعيد" : "Sarah Jenkins — Reception & Operations"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <UserMenu
              name={isRTL ? "سارة جنكينز" : "Sarah Jenkins"}
              role="Secretary"
              email="sarah.j@doctech-clinic.com"
              color="#0891B2"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}