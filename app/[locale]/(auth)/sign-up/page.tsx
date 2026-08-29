"use client";

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
    specialty: "General Medicine",
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
    router.push(`/${locale}/clinic-setup`);
  };

  return (
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-blue-950/5">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-2">
          <Stethoscope size={13} />
          {isRTL ? "تسجيل ممارس طبي جديد" : "Medical Practitioner Registration"}
        </span>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? "إنشاء حساب طبيب" : "Doctor Sign Up"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRTL
            ? "انضم إلى DOCTECH لإدارة عيادتك وفريقك ومواعيدك بذكاء"
            : "Set up your medical practice with DOCTECH"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "الاسم الكامل (دكتور/ة)" : "Full Doctor Name"}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={isRTL ? "د. أحمد حسام" : "Dr. Sarah Mitchell"}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "اسم العيادة المقترح" : "Clinic / Practice Name"}
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              required
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              placeholder={isRTL ? "عيادات النور التخصصية" : "Al-Noor Medical Center"}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "التخصص الطبي" : "Medical Specialty"}
          </label>
          <select
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? "البريد الإلكتروني" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@clinic.com"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? "رقم الهاتف" : "Phone Number"}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 100 000 0000"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isRTL ? "كلمة المرور" : "Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#1A4B8C] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10"
        >
          <span>{isRTL ? "متابعة لإعداد العيادة" : "Continue to Clinic Setup"}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
        <span>{isRTL ? "لديك حساب بالفعل؟" : "Already have an account?"} </span>
        <Link href={`/${locale}/sign-in`} className="font-semibold text-[#1A4B8C] hover:underline">
          {isRTL ? "تسجيل الدخول" : "Sign In"}
        </Link>
      </div>
    </div>
  );
}