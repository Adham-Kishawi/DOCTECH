import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\(auth)";

// 1. SIGN UP
const signUp = `"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, Stethoscope, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialty: "General Medicine / طب عام",
    password: "",
    clinicName: "",
  });
  const [loading, setLoading] = useState(false);

  const specialties = [
    "General Medicine / طب عام",
    "Dentistry / طب الأسنان",
    "Dermatology / الجلدية",
    "Cardiology / أمراض القلب",
    "Pediatrics / طب الأطفال",
    "Orthopedics / العظام",
    "Ophthalmology / العيون",
    "Psychiatry / الطب النفسي",
    "Obstetrics & Gynecology / النساء والتوليد",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.success(isRTL ? "تم إنشاء الحساب بنجاح! انتقل لإعداد العيادة." : "Account created! Proceed to Clinic Setup.");
    router.push(\`/\${locale}/clinic-setup\`);
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-2">
          <Stethoscope size={13} />
          {isRTL ? "تسجيل ممارس طبي جديد" : "Medical Practitioner Registration"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isRTL ? "إنشاء حساب طبيب" : "Doctor Sign Up"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {isRTL
            ? "انضم إلى DOCTECH لإدارة عيادتك وفريقك ومواعيدك بذكاء"
            : "Set up your medical practice with DOCTECH"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "الاسم الكامل (دكتور/ة)" : "Full Doctor Name"}
          </label>
          <div className="relative">
            <User className="doctech-input-icon" size={17} />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={isRTL ? "د. أحمد حسام" : "Dr. Sarah Mitchell"}
              className="doctech-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "اسم العيادة المقترح" : "Clinic / Practice Name"}
          </label>
          <div className="relative">
            <Building2 className="doctech-input-icon" size={17} />
            <input
              type="text"
              required
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              placeholder={isRTL ? "عيادات النور التخصصية" : "Al-Noor Medical Center"}
              className="doctech-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "التخصص الطبي" : "Medical Specialty"}
          </label>
          <select
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="doctech-input-icon" size={17} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@clinic.com"
                className="doctech-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "رقم الهاتف" : "Phone Number"}
            </label>
            <div className="relative">
              <Phone className="doctech-input-icon" size={17} />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 100 000 0000"
                className="doctech-input"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {isRTL ? "كلمة المرور" : "Password"}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>{isRTL ? "متابعة لإعداد العيادة" : "Continue to Clinic Setup"}</span>
          <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
        <span>{isRTL ? "لديك حساب بالفعل؟" : "Already have an account?"} </span>
        <Link href={\`/\${locale}/sign-in\`} className="font-bold text-[#1A4B8C] hover:underline">
          {isRTL ? "تسجيل الدخول" : "Sign In"}
        </Link>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(base, "sign-up", "page.tsx"), signUp, "utf8");
console.log("sign-up updated");
