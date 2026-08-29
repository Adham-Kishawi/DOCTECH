import fs from "node:fs";
import path from "node:path";

const roots = ["D:\\FULL-PROJECTS\\DOCTECK", "D:\\FULL-PROJECTS\\DOCTECH"];

// ============================================
// 1. UPDATE USER MENU (Sign Out Session Handler)
// ============================================
const userMenu = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User, LogOut, RefreshCw, ChevronDown } from "lucide-react";
import { clearSession, setSession } from "@/stores/authStore";
import { toast } from "sonner";

interface UserMenuProps {
  name: string;
  role: "Doctor" | "Secretary";
  email: string;
  color?: string;
}

export function UserMenu({ name, role, email, color = "#3368A0" }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const handleSignOut = () => {
    clearSession();
    toast.success(isRTL ? "تم تسجيل الخروج بنجاح" : "Signed out successfully");
    router.replace(\`/\${locale}/sign-in\`);
  };

  const handleSwitchRole = () => {
    const targetRole = role === "Doctor" ? "secretary" : "doctor";
    setSession({
      id: targetRole === "doctor" ? "doc-101" : "sec-202",
      name: targetRole === "doctor" ? "Dr. Clinical Lead" : "Sarah Jenkins",
      email: targetRole === "doctor" ? "doctor@doctech.com" : "secretary@doctech.com",
      role: targetRole,
      clinicName: "Al-Amal Clinic",
      avatarColor: targetRole === "doctor" ? "#3368A0" : "#36ADA3",
    });
    router.push(\`/\${locale}/\${targetRole}/dashboard\`);
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div
          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black shadow-xs"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-left rtl:text-right text-xs">
          <p className="font-bold text-slate-900 dark:text-white leading-tight">{name}</p>
          <p className="text-[10px] text-slate-400 font-medium">{role}</p>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-[#131E2E] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{name}</p>
              <p className="text-[11px] text-slate-400 truncate">{email}</p>
            </div>

            <div className="py-1">
              <Link
                href={\`/\${locale}/\${role.toLowerCase()}/profile\`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User size={15} />
                <span>{isRTL ? "الملف الشخصي" : "My Profile"}</span>
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  handleSwitchRole();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#3368A0] dark:text-[#4B85C5] hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>
                  {isRTL
                    ? \`تبديل إلى لوحة \${role === "Doctor" ? "السكرتيرة" : "الطبيب"}\`
                    : \`Switch to \${role === "Doctor" ? "Secretary" : "Doctor"} View\`}
                </span>
              </button>
            </div>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <LogOut size={14} />
                <span>{isRTL ? "تسجيل الخروج" : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
`;

// ============================================
// 2. UPDATE SIGN-IN PAGE (Creates Real Session)
// ============================================
const signIn = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Stethoscope, UserCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { setSession } from "@/stores/authStore";
import { toast } from "sonner";

export default function SignInPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isSecretary = email.toLowerCase().includes("sec") || email === "secretary@doctech.com";
    const role = isSecretary ? "secretary" : "doctor";

    setSession({
      id: isSecretary ? "sec-202" : "doc-101",
      name: isSecretary ? "Sarah Jenkins" : "Dr. Clinical Lead",
      email: email,
      role: role,
      clinicName: "Al-Amal Medical Clinic",
      avatarColor: isSecretary ? "#36ADA3" : "#3368A0",
    });

    setTimeout(() => {
      toast.success(
        isRTL
          ? \`تم تسجيل الدخول بنجاح كـ \${isSecretary ? "سكرتيرة" : "طبيب"}\`
          : \`Signed in successfully as \${isSecretary ? "Secretary" : "Doctor"}\`
      );
      router.push(\`/\${locale}/\${role}/dashboard\`);
    }, 300);
  };

  const handleQuickLogin = (role: "doctor" | "secretary") => {
    setSession({
      id: role === "doctor" ? "doc-101" : "sec-202",
      name: role === "doctor" ? "Dr. Clinical Lead" : "Sarah Jenkins",
      email: role === "doctor" ? "doctor@doctech.com" : "secretary@doctech.com",
      role: role,
      clinicName: "Al-Amal Medical Clinic",
      avatarColor: role === "doctor" ? "#3368A0" : "#36ADA3",
    });

    toast.success(isRTL ? \`دخول فوري كـ \${role === "doctor" ? "طبيب" : "سكرتيرة"}\` : \`Quick login as \${role === "doctor" ? "Doctor" : "Secretary"}\`);
    router.push(\`/\${locale}/\${role}/dashboard\`);
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white dark:bg-[#131E2E]">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {isRTL ? "تسجيل الدخول" : "Welcome Back"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          {isRTL
            ? "سجّل الدخول لإدارة عيادتك ومواعيدك ومرضاك"
            : "Sign in to manage your clinic appointments & patients"}
        </p>
      </div>

      {/* 1-Click Demo Sandbox */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#3368A0] dark:text-[#4B85C5] mb-2.5">
          <Sparkles size={13} className="text-[#36ADA3]" />
          <span>{isRTL ? "تجربة فورية بنقرة واحدة (Prototype Demo)" : "1-Click Prototype Demo"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickLogin("doctor")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#3368A0] hover:bg-[#285783] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Stethoscope size={15} />
            <span>{isRTL ? "طبيب (Doctor)" : "Doctor View"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("secretary")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#36ADA3] hover:bg-[#298F86] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <UserCheck size={15} />
            <span>{isRTL ? "سكرتيرة (Secretary)" : "Secretary View"}</span>
          </button>
        </div>
      </div>

      <div className="relative flex py-2 items-center mb-5">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
          {isRTL ? "أو بالحساب" : "or with credentials"}
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {isRTL ? "البريد الإلكتروني" : "Email Address"}
          </label>
          <div className="relative">
            <Mail className="doctech-input-icon" size={17} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@doctech.com"
              className="doctech-input"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isRTL ? "كلمة المرور" : "Password"}
            </label>
            <Link
              href={\`/\${locale}/forgot-password\`}
              className="text-xs text-[#3368A0] dark:text-[#4B85C5] hover:underline font-semibold"
            >
              {isRTL ? "نسيت كلمة المرور؟" : "Forgot Password?"}
            </Link>
          </div>
          <div className="relative">
            <Lock className="doctech-input-icon" size={17} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="doctech-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="doctech-input-action hover:text-slate-700 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 h-11 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>{loading ? (isRTL ? "جاري الدخول..." : "Signing In...") : (isRTL ? "تسجيل الدخول" : "Sign In")}</span>
          <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>{isRTL ? "طبيب جديد؟" : "New doctor?"}</span>
        <Link
          href={\`/\${locale}/sign-up\`}
          className="font-bold text-[#3368A0] dark:text-[#4B85C5] hover:underline"
        >
          {isRTL ? "إنشاء حساب عيادة جديد" : "Create Clinic Account"}
        </Link>
      </div>
    </div>
  );
}
`;

// ============================================
// 3. UPDATE DOCTOR LAYOUT (AuthGuard + Summon Buzzer + Logo)
// ============================================
const doctorLayout = `"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, CalendarCheck, BarChart2,
  MessageSquare, Bell, Users, User, BellRing, Stethoscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
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
              const isActive = pathname.includes(\`/doctor/\${href}\`);
              return (
                <Link
                  key={href}
                  href={\`/\${locale}/doctor/\${href}\`}
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
              href={\`/\${locale}/doctor/profile\`}
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
              <ThemeToggle />
              <LanguageSwitcher />
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
`;

// ============================================
// 4. UPDATE SECRETARY LAYOUT (AuthGuard + Summon Modal + Logo)
// ============================================
const secretaryLayout = `"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, CalendarCheck, BarChart2,
  MessageSquare, Bell, Users, User, MessageCircle, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SummonModal } from "@/components/shared/SummonModal";
import { realtimeBus } from "@/lib/realtimeService";
import { toast } from "sonner";

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
              const isActive = pathname.includes(\`/secretary/\${href}\`);
              return (
                <Link
                  key={href}
                  href={\`/\${locale}/secretary/\${href}\`}
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
              href={\`/\${locale}/secretary/profile\`}
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
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ [isRTL ? "marginRight" : "marginLeft"]: "210px" }}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-15 bg-white/90 dark:bg-[#131E2E]/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRTL ? "سارة جنكينز — مكتب الاستقبال" : "Sarah Jenkins — Reception Desk"}
              </span>

              {/* Send Discreet Note Button */}
              <button
                onClick={handleSendQuickNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#36ADA3] border border-[#36ADA3]/40 text-xs font-bold hover:bg-teal-100 transition-all cursor-pointer"
                title="Send a quiet note that appears discreetly on doctor screen without alarming the patient"
              >
                <Send size={13} />
                <span>{isRTL ? "تنبيه هادئ للطبيب" : "Quiet Note to Doctor"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
              <UserMenu
                name={isRTL ? "سارة جنكينز" : "Sarah Jenkins"}
                role="Secretary"
                email="sarah.j@doctech-clinic.com"
                color="#36ADA3"
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
`;

for (const root of roots) {
  fs.writeFileSync(path.join(root, "components", "layout", "UserMenu.tsx"), userMenu, "utf8");
  fs.writeFileSync(path.join(root, "app", "[locale]", "(auth)", "sign-in", "page.tsx"), signIn, "utf8");
  fs.writeFileSync(path.join(root, "app", "[locale]", "doctor", "layout.tsx"), doctorLayout, "utf8");
  fs.writeFileSync(path.join(root, "app", "[locale]", "secretary", "layout.tsx"), secretaryLayout, "utf8");
}

console.log("UserMenu, sign-in, doctor/layout, secretary/layout updated with full AuthGuard & Summon Buzzer");
