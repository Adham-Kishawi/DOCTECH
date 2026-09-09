"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, CalendarCheck, BarChart2,
  MessageSquare, Bell, Users, User, MessageCircle, Send, Menu, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SummonModal } from "@/components/shared/SummonModal";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { realtimeBus } from "@/lib/realtimeService";
import { toast } from "sonner";

const navItems = [
  { href: "dashboard", labelEn: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "appointments", labelEn: "Appointments", labelAr: "المواعيد", icon: CalendarCheck },
  { href: "finance", labelEn: "Billing / Cashier", labelAr: "الخزينة والمدفوعات", icon: DollarSign },
  { href: "schedule", labelEn: "Schedule", labelAr: "الجدول", icon: Calendar },
  { href: "patients", labelEn: "Patients", labelAr: "المرضى", icon: Users },
  { href: "reports", labelEn: "Reports", labelAr: "التقارير", icon: BarChart2 },
  { href: "whatsapp", labelEn: "WhatsApp", labelAr: "واتساب", icon: MessageCircle },
  { href: "communications", labelEn: "Staff Chat & Comms", labelAr: "المحادثات والتواصل الداخلي", icon: MessageSquare },
  { href: "notifications", labelEn: "Notifications", labelAr: "الإشعارات", icon: Bell },
];

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isRTL = locale === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSendQuickNote = () => {
    const note = prompt("Enter quiet note for Dr. Clinical Lead (will appear discreetly):", "Patient Ahmed Hassan is waiting outside.");
    if (note) {
      realtimeBus.publish({
        type: "SECRETARY_DISCREET_ALERT",
        payload: {
          message: note,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      });
      toast.success(isRTL ? "تم إرسال التنبيه الهادئ للطبيب" : "Quiet note sent to Doctor screen");
    }
  };

  return (
    <AuthGuard allowedRole="secretary">
      <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B131E]">
        {/* Full Screen Summon Popup Listener with Chime */}
        <SummonModal />

        {/* Mobile Sidebar Drawer */}
        <MobileSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navItems={navItems}
          role="secretary"
          locale={locale}
          isRTL={isRTL}
          pathname={pathname}
          activeColor="#36ADA3"
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
              const isActive = pathname.includes(`/secretary/${href}`);
              return (
                <Link
                  key={href}
                  href={`/${locale}/secretary/${href}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                    isActive
                      ? "bg-[#36ADA3] text-white shadow-xs"
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
              href={`/${locale}/secretary/profile`}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                pathname.includes("/secretary/profile")
                  ? "bg-[#36ADA3] text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <User size={16} />
              <span>{isRTL ? "الملف الشخصي" : "Profile"}</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <style>{`
            @media (min-width: 768px) {
              .doctech-sec-offset {
                ${isRTL ? "margin-right" : "margin-left"}: 210px;
              }
            }
          `}</style>

          <div className="flex-1 flex flex-col min-w-0 doctech-sec-offset">
            {/* Top Bar */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 h-14 sm:h-15 bg-white/90 dark:bg-[#131E2E]/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Hamburger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} className="text-slate-600 dark:text-slate-400" />
                </button>

                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate hidden sm:block">
                  {isRTL ? "سارة جنكينز — مكتب الاستقبال" : "Sarah Jenkins — Reception Desk"}
                </span>

                {/* Send Discreet Note Button */}
                <button
                  onClick={handleSendQuickNote}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#36ADA3] border border-[#36ADA3]/40 text-[11px] sm:text-xs font-bold hover:bg-teal-100 transition-all cursor-pointer shrink-0"
                  title="Send a quiet note that appears discreetly on doctor screen without alarming the patient"
                >
                  <Send size={13} />
                  <span className="hidden sm:inline">{isRTL ? "تنبيه هادئ للطبيب" : "Quiet Note to Doctor"}</span>
                  <span className="sm:hidden">{isRTL ? "تنبيه" : "Note"}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <NotificationBell role="secretary" locale={locale} isRTL={false} />
                {/* <ThemeToggle /> — Temporarily disabled: Enforcing Dark Mode */}
                {/* <span className="hidden sm:block"><LanguageSwitcher /></span> — Temporarily disabled: Enforcing English */}
                <UserMenu
                  name="Sarah Jenkins"
                  role="Secretary"
                  email="sarah.j@doctech-clinic.com"
                  color="#36ADA3"
                />
              </div>
            </header>

            {/* Page Content — add bottom padding on mobile for BottomNav */}
            <main className="flex-1 p-3 sm:p-6 overflow-auto pb-20 md:pb-6">{children}</main>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav
          items={navItems}
          role="secretary"
          locale={locale}
          isRTL={isRTL}
          pathname={pathname}
          activeColor="#36ADA3"
        />
      </div>
    </AuthGuard>
  );
}
