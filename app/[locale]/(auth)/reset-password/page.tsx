"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match!");
      return;
    }
    toast.success(isRTL ? "تم تغيير كلمة المرور بنجاح!" : "Password reset successfully!");
    router.push(`/${locale}/sign-in`);
  };

  return (
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-blue-950/5">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? "تعيين كلمة مرور جديدة" : "Set New Password"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRTL
            ? "اختر كلمة مرور قوية لتأمين حساب عيادتك"
            : "Create a strong password to protect your clinic portal"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "كلمة المرور الجديدة" : "New Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-[#1A4B8C] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10"
        >
          <span>{isRTL ? "حفظ كلمة المرور وتسجيل الدخول" : "Save Password & Sign In"}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}