"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
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
    <div className="doctech-card p-7 sm:p-9 bg-white">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A4B8C] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isRTL ? "تعيين كلمة مرور جديدة" : "Set New Password"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {isRTL
            ? "اختر كلمة مرور قوية لتأمين حساب عيادتك"
            : "Create a strong password to protect your clinic portal"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "كلمة المرور الجديدة" : "New Password"}
          </label>
          <div className="relative">
            <Lock className="doctech-input-icon" size={17} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="doctech-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
          </label>
          <div className="relative">
            <Lock className="doctech-input-icon" size={17} />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="doctech-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>{isRTL ? "حفظ كلمة المرور وتسجيل الدخول" : "Save Password & Sign In"}</span>
          <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
        </button>
      </form>
    </div>
  );
}