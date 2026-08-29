"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Phone, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
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
    router.push(`/${locale}/doctor/dashboard`);
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
}
