"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserCheck, Lock, User, CheckCircle2, ArrowRight, Building2 } from "lucide-react";
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
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-cyan-950/5">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#0891B2] flex items-center justify-center mx-auto mb-3">
          <UserCheck size={24} />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-[#0891B2] border border-cyan-100 mb-2">
          <Building2 size={13} />
          Al-Amal Clinic Invitation
        </span>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? "تفعيل حساب السكرتيرة" : "Activate Secretary Account"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRTL
            ? "لقد دعاك د. أحمد للانضمام إلى فريق العيادة. قم بإنشاء كلمة المرور."
            : "Dr. Ahmed invited you to join the clinic team. Complete your setup."}
        </p>
      </div>

      <form onSubmit={handleActivate} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "الاسم الكامل" : "Full Name"}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "البريد الإلكتروني المعتمد" : "Assigned Clinic Email"}
          </label>
          <input
            type="email"
            disabled
            value={formData.email}
            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "تعيين كلمة المرور" : "Create Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#0891B2] text-white text-sm font-semibold hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-900/10"
        >
          <span>{isRTL ? "تفعيل الحساب والدخول للوحة التحكم" : "Activate & Enter Dashboard"}</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}