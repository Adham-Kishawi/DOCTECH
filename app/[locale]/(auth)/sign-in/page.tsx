"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Stethoscope, UserCheck, Eye, EyeOff, Sparkles } from "lucide-react";
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

    setTimeout(() => {
      if (email.toLowerCase().includes("sec") || email === "secretary@doctech.com") {
        toast.success(isRTL ? "تم تسجيل الدخول بنجاح كسكرتيرة" : "Signed in successfully as Secretary");
        router.push(`/${locale}/secretary/dashboard`);
      } else {
        toast.success(isRTL ? "تم تسجيل الدخول بنجاح كطبيب" : "Signed in successfully as Doctor");
        router.push(`/${locale}/doctor/dashboard`);
      }
    }, 400);
  };

  const handleQuickLogin = (role: "doctor" | "secretary") => {
    if (role === "doctor") {
      setEmail("doctor@doctech.com");
      setPassword("demo1234");
      toast.success(isRTL ? "دخول سريع كطبيب" : "Quick login as Doctor");
      router.push(`/${locale}/doctor/dashboard`);
    } else {
      setEmail("secretary@doctech.com");
      setPassword("demo1234");
      toast.success(isRTL ? "دخول سريع كسكرتيرة" : "Quick login as Secretary");
      router.push(`/${locale}/secretary/dashboard`);
    }
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isRTL ? "تسجيل الدخول" : "Welcome Back"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
          {isRTL
            ? "سجّل الدخول لإدارة عيادتك ومواعيدك ومرضاك"
            : "Sign in to manage your clinic appointments & patients"}
        </p>
      </div>

      {/* 1-Click Demo Sandbox */}
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-2.5">
          <Sparkles size={13} className="text-blue-600" />
          <span>{isRTL ? "تجربة فورية بنقرة واحدة (Prototype Demo)" : "1-Click Prototype Demo"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickLogin("doctor")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#1A4B8C] hover:bg-[#153E75] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Stethoscope size={15} />
            <span>{isRTL ? "طبيب (Doctor)" : "Doctor View"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("secretary")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <UserCheck size={15} />
            <span>{isRTL ? "سكرتيرة (Secretary)" : "Secretary View"}</span>
          </button>
        </div>
      </div>

      <div className="relative flex py-2 items-center mb-5">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-bold tracking-wider">
          {isRTL ? "أو بالحساب" : "or with credentials"}
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
            <label className="block text-xs font-bold text-slate-700">
              {isRTL ? "كلمة المرور" : "Password"}
            </label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs text-[#1A4B8C] hover:text-blue-800 font-semibold"
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
              className="doctech-input-action hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>{loading ? (isRTL ? "جاري الدخول..." : "Signing In...") : (isRTL ? "تسجيل الدخول" : "Sign In")}</span>
          <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>{isRTL ? "طبيب جديد؟" : "New doctor?"}</span>
        <Link
          href={`/${locale}/sign-up`}
          className="font-bold text-[#1A4B8C] hover:underline"
        >
          {isRTL ? "إنشاء حساب عيادة جديد" : "Create Clinic Account"}
        </Link>
      </div>
    </div>
  );
}