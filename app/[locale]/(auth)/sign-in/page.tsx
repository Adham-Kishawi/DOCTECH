"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Stethoscope, UserCheck, Eye, EyeOff } from "lucide-react";
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

    // If test doctor
    if (email.toLowerCase().includes("doctor") || email === "doctor@doctech.com") {
      toast.success(isRTL ? "تم تسجيل الدخول بنجاح كطبيب" : "Signed in successfully as Doctor");
      router.push(`/${locale}/doctor/dashboard`);
      return;
    }

    // If test secretary
    if (email.toLowerCase().includes("sec") || email === "secretary@doctech.com") {
      toast.success(isRTL ? "تم تسجيل الدخول بنجاح كسكرتيرة" : "Signed in successfully as Secretary");
      router.push(`/${locale}/secretary/dashboard`);
      return;
    }

    // Default to doctor dashboard
    toast.success(isRTL ? "تم تسجيل الدخول بنجاح" : "Signed in successfully");
    router.push(`/${locale}/doctor/dashboard`);
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
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-blue-950/5">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? "تسجيل الدخول" : "Welcome Back"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRTL
            ? "أدخل بيانات حسابك للوصول إلى لوحة العيادة"
            : "Sign in to manage your clinic appointments & patients"}
        </p>
      </div>

      {/* Quick Demo Login Bar */}
      <div className="mb-6 p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A4B8C] block mb-2 text-center">
          {isRTL ? "⚡ تجربة سريعة بنقرة واحدة (1-Click Demo)" : "⚡ 1-Click Prototype Demo Access"}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("doctor")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#1A4B8C] text-white hover:bg-blue-800 transition-colors cursor-pointer shadow-sm"
          >
            <Stethoscope size={14} />
            <span>{isRTL ? "دخول كطبيب" : "Doctor View"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("secretary")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#0891B2] text-white hover:bg-cyan-700 transition-colors cursor-pointer shadow-sm"
          >
            <UserCheck size={14} />
            <span>{isRTL ? "دخول كسكرتيرة" : "Secretary View"}</span>
          </button>
        </div>
      </div>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase font-medium">
          {isRTL ? "أو بالحساب" : "or credentials"}
        </span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            {isRTL ? "البريد الإلكتروني" : "Email Address"}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              {isRTL ? "كلمة المرور" : "Password"}
            </label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-xs text-[#1A4B8C] hover:underline font-medium"
            >
              {isRTL ? "نسيت كلمة المرور؟" : "Forgot Password?"}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#1A4B8C] text-white text-sm font-semibold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10"
        >
          <span>{loading ? (isRTL ? "جاري الدخول..." : "Signing in...") : (isRTL ? "تسجيل الدخول" : "Sign In")}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{isRTL ? "طبيب جديد؟" : "New doctor?"}</span>
        <Link
          href={`/${locale}/sign-up`}
          className="font-semibold text-[#1A4B8C] hover:underline"
        >
          {isRTL ? "إنشاء حساب عيادة جديد" : "Create Clinic Account"}
        </Link>
      </div>
    </div>
  );
}