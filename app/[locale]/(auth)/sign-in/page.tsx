"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Stethoscope, UserCheck, Eye, EyeOff, KeyRound } from "lucide-react";
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
          ? `تم تسجيل الدخول بنجاح كـ ${isSecretary ? "سكرتيرة" : "طبيب"}`
          : `Signed in successfully as ${isSecretary ? "Secretary" : "Doctor"}`
      );
      router.push(`/${locale}/${role}/dashboard`);
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

    toast.success(isRTL ? `دخول فوري كـ ${role === "doctor" ? "طبيب" : "سكرتيرة"}` : `Quick login as ${role === "doctor" ? "Doctor" : "Secretary"}`);
    router.push(`/${locale}/${role}/dashboard`);
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
          <KeyRound size={13} className="text-[#3368A0] dark:text-[#4B85C5]" />
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
              href={`/${locale}/forgot-password`}
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
          href={`/${locale}/sign-up`}
          className="font-bold text-[#3368A0] dark:text-[#4B85C5] hover:underline"
        >
          {isRTL ? "إنشاء حساب عيادة جديد" : "Create Clinic Account"}
        </Link>
      </div>
    </div>
  );
}
