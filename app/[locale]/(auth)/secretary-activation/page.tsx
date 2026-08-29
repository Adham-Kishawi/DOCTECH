"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserCheck, Lock, User, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SecretaryActivationPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [formData, setFormData] = useState({
    fullName: "Sarah Jenkins",
    email: "sarah.j@doctech-clinic.com",
    password: "",
    confirmPassword: "",
  });

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match!");
      return;
    }
    toast.success(isRTL ? "تم تفعيل حساب السكرتيرة بنجاح! أهلاً بك." : "Secretary account activated! Welcome to DOCTECH.");
    router.push(`/${locale}/secretary/dashboard`);
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0891B2] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <UserCheck size={24} />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-[#0891B2] border border-cyan-100 mb-2">
          <Building2 size={13} />
          Al-Amal Clinic Invitation
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isRTL ? "تفعيل حساب السكرتيرة" : "Activate Account"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {isRTL
            ? "لقد دعاك د. أحمد للانضمام إلى فريق العيادة. قم بإنشاء كلمة المرور."
            : "Dr. Ahmed invited you to join the clinic team. Complete your setup."}
        </p>
      </div>

      <form onSubmit={handleActivate} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "الاسم الكامل" : "Full Name"}
          </label>
          <div className="relative">
            <User className="doctech-input-icon" size={17} />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="doctech-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "البريد الإلكتروني المعتمد" : "Assigned Clinic Email"}
          </label>
          <input
            type="email"
            disabled
            value={formData.email}
            className="w-full h-11 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "تعيين كلمة المرور" : "Create Password"}
          </label>
          <div className="relative">
            <Lock className="doctech-input-icon" size={17} />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="doctech-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
          </label>
          <div className="relative">
            <Lock className="doctech-input-icon" size={17} />
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="doctech-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 h-11 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-bold shadow-md shadow-cyan-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>{isRTL ? "تفعيل الحساب والدخول للوحة التحكم" : "Activate & Enter Dashboard"}</span>
          <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
        </button>
      </form>
    </div>
  );
}
