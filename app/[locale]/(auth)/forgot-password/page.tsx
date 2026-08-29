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
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-blue-950/5">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <KeyRound size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? "نسيت كلمة المرور؟" : "Reset Password"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRTL
            ? "أدخل بريدك الإلكتروني وسنرسل لك تعليمات استعادة الحساب"
            : "Enter your registered email address to receive reset instructions"}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#1A4B8C] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10"
          >
            <span>{isRTL ? "إرسال رابط الاستعادة" : "Send Reset Link"}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center gap-2 justify-center">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>
              {isRTL
                ? `تم الإرسال إلى ${email}. تحقق من صندوق الوارد.`
                : `We sent a reset link to ${email}. Check your inbox.`}
            </span>
          </div>

          <Link
            href={`/${locale}/reset-password`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A4B8C] hover:underline"
          >
            <span>{isRTL ? "انتقل لتعيين كلمة المرور الجديدة (تجربة)" : "Proceed to Set New Password (Demo)"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <Link
          href={`/${locale}/sign-in`}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium"
        >
          <ArrowLeft size={14} />
          <span>{isRTL ? "العودة لتسجيل الدخول" : "Back to Sign In"}</span>
        </Link>
      </div>
    </div>
  );
}