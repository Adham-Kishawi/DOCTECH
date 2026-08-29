"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success(isRTL ? "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني" : "Password reset instructions sent to your email!");
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <KeyRound size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isRTL ? "نسيت كلمة المرور؟" : "Reset Password"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {isRTL
            ? "أدخل بريدك الإلكتروني وسنرسل لك تعليمات استعادة الحساب"
            : "Enter your registered email address to receive reset instructions"}
        </p>
      </div>

      {!sent ? (
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
                placeholder="doctor@clinic.com"
                className="doctech-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{isRTL ? "إرسال رابط الاستعادة" : "Send Reset Link"}</span>
            <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2.5 justify-center">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>
              {isRTL
                ? `تم الإرسال إلى ${email}. تحقق من صندوق الوارد.`
                : `We sent a reset link to ${email}. Check your inbox.`}
            </span>
          </div>

          <Link
            href={`/${locale}/reset-password`}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1A4B8C] hover:underline"
          >
            <span>{isRTL ? "انتقل لتعيين كلمة المرور الجديدة (تجربة)" : "Proceed to Set New Password (Demo)"}</span>
            <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
          </Link>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href={`/${locale}/sign-in`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-bold"
        >
          <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
          <span>{isRTL ? "العودة لتسجيل الدخول" : "Back to Sign In"}</span>
        </Link>
      </div>
    </div>
  );
}