import fs from "node:fs";
import path from "node:path";

const base = "D:\\FULL-PROJECTS\\DOCTECH\\app\\[locale]\\(auth)";

// 2. CLINIC SETUP
const clinicSetup = `"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Phone, Clock, CheckCircle2, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ClinicSetupPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clinicName: "Al-Amal Medical Clinic",
    address: "123 Medical Tower, 4th Floor, Cairo",
    phone: "+20 100 123 4567",
    consultationDuration: "30",
    workStartTime: "09:00",
    workEndTime: "17:00",
  });

  const handleFinish = () => {
    toast.success(isRTL ? "تم إعداد العيادة بنجاح! مرحباً بك في DOCTECH" : "Clinic setup complete! Welcome to DOCTECH.");
    router.push(\`/\${locale}/doctor/dashboard\`);
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A4B8C] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {step}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {step === 1 ? (isRTL ? "بيانات العيادة" : "Clinic Profile") : (isRTL ? "مواعيد العمل" : "Working Hours")}
            </h2>
            <p className="text-[11px] font-medium text-slate-400">Step {step} of 2</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          {isRTL ? "إعداد أولي" : "Initial Setup"}
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "اسم العيادة الرسمي" : "Official Clinic Name"}
            </label>
            <div className="relative">
              <Building2 className="doctech-input-icon" size={17} />
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="doctech-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "عنوان العيادة والموقع" : "Address & Location"}
            </label>
            <div className="relative">
              <MapPin className="doctech-input-icon" size={17} />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="doctech-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "هاتف الاستقبال والتواصل" : "Clinic Reception Phone"}
            </label>
            <div className="relative">
              <Phone className="doctech-input-icon" size={17} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="doctech-input"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full mt-4 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{isRTL ? "التالي: مواعيد العمل" : "Next: Working Hours"}</span>
            <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRTL ? "بداية الدوام" : "Opening Time"}
              </label>
              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRTL ? "نهاية الدوام" : "Closing Time"}
              </label>
              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "مدة الكشف / الاستشارة (دقيقة)" : "Consultation Slot Duration (mins)"}
            </label>
            <select
              value={formData.consultationDuration}
              onChange={(e) => setFormData({ ...formData, consultationDuration: e.target.value })}
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            >
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes (Standard)</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              {isRTL
                ? "يمكنك لاحقاً تعديل مواعيد العمل، إضافة سكرتارية، وربط الواتساب من لوحة التحكم."
                : "You can customize working shifts, invite secretaries, and connect WhatsApp later from settings."}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer"
            >
              {isRTL ? "السابق" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{isRTL ? "إتمام الإعداد والدخول للعيادة" : "Finish Setup & Enter"}</span>
              <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`;

// 3. FORGOT PASSWORD
const forgotPass = `"use client";

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
                ? \`تم الإرسال إلى \${email}. تحقق من صندوق الوارد.\`
                : \`We sent a reset link to \${email}. Check your inbox.\`}
            </span>
          </div>

          <Link
            href={\`/\${locale}/reset-password\`}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1A4B8C] hover:underline"
          >
            <span>{isRTL ? "انتقل لتعيين كلمة المرور الجديدة (تجربة)" : "Proceed to Set New Password (Demo)"}</span>
            <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
          </Link>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href={\`/\${locale}/sign-in\`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-bold"
        >
          <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
          <span>{isRTL ? "العودة لتسجيل الدخول" : "Back to Sign In"}</span>
        </Link>
      </div>
    </div>
  );
}`;

// 4. RESET PASSWORD
const resetPass = `"use client";

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
    router.push(\`/\${locale}/sign-in\`);
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
}`;

// 5. SECRETARY ACTIVATION
const secActivation = `"use client";

import { useState } from "react";
import Link from "next/link";
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
    router.push(\`/\${locale}/secretary/dashboard\`);
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
}`;

// 6. ROLE SELECTION
const roleSelection = `"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Stethoscope, UserCheck, ArrowRight, Shield } from "lucide-react";

export default function RoleSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const handleSelectRole = (role: "doctor" | "secretary") => {
    if (role === "doctor") {
      router.push(\`/\${locale}/doctor/dashboard\`);
    } else {
      router.push(\`/\${locale}/secretary/dashboard\`);
    }
  };

  return (
    <div className="doctech-card p-7 sm:p-9 bg-white">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-3">
          <Shield size={13} />
          {isRTL ? "اختيار الدور للنموذج الأولي" : "Prototype Role Access"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isRTL ? "اختر طريقة الدخول" : "Select Your Portal View"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {isRTL
            ? "استكشف تجربة النظام المخصصة لكل من الطبيب والسكرتيرة"
            : "Choose which role experience you want to preview in DOCTECH"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Doctor Card */}
        <button
          onClick={() => handleSelectRole("doctor")}
          className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-[#1A4B8C] bg-white hover:bg-blue-50/40 transition-all group flex items-start justify-between cursor-pointer shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A4B8C] group-hover:bg-[#1A4B8C] group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-xs">
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1A4B8C]">
                  {isRTL ? "طبيب (Medical Doctor)" : "Doctor Portal"}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-[#1A4B8C] rounded-md">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                {isRTL
                  ? "لوحة تحكم الطبيب، مراجعة التقارير الطبية، المواعيد، وإدارة الفريق"
                  : "Clinical review, reports triage, read-only schedule, team management"}
              </p>
            </div>
          </div>
          <ArrowRight size={18} className={\`text-slate-300 group-hover:text-[#1A4B8C] mt-3 group-hover:translate-x-1 transition-all \${isRTL ? "rotate-180" : ""}\`} />
        </button>

        {/* Secretary Card */}
        <button
          onClick={() => handleSelectRole("secretary")}
          className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-[#0891B2] bg-white hover:bg-cyan-50/40 transition-all group flex items-start justify-between cursor-pointer shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0891B2] group-hover:bg-[#0891B2] group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-xs">
              <UserCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0891B2]">
                  {isRTL ? "سكرتيرة (Secretary / Reception)" : "Secretary Portal"}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-100 text-[#0891B2] rounded-md">
                  Full CRUD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                {isRTL
                  ? "حجز وإدارة المواعيد، ملفات المرضى، محادثات الواتساب، والفرز"
                  : "Appointment booking, patient directory, WhatsApp chats, report triage"}
              </p>
            </div>
          </div>
          <ArrowRight size={18} className={\`text-slate-300 group-hover:text-[#0891B2] mt-3 group-hover:translate-x-1 transition-all \${isRTL ? "rotate-180" : ""}\`} />
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href={\`/\${locale}/sign-in\`}
          className="text-xs text-slate-500 hover:text-slate-800 font-bold"
        >
          {isRTL ? "أو العودة إلى تسجيل الدخول العادي" : "Or go to regular credentials Sign In"}
        </Link>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path.join(base, "clinic-setup", "page.tsx"), clinicSetup, "utf8");
fs.writeFileSync(path.join(base, "forgot-password", "page.tsx"), forgotPass, "utf8");
fs.writeFileSync(path.join(base, "reset-password", "page.tsx"), resetPass, "utf8");
fs.writeFileSync(path.join(base, "secretary-activation", "page.tsx"), secActivation, "utf8");
fs.writeFileSync(path.join(base, "role-selection", "page.tsx"), roleSelection, "utf8");

console.log("All auth pages successfully updated with pixel-perfect UI");
