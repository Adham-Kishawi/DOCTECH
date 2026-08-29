"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, MapPin, Phone, Clock, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ClinicSetupPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clinicName: "Al-Amal Clinic",
    address: "123 Medical Tower, 4th Floor",
    phone: "+20 100 123 4567",
    consultationDuration: "30",
    workStartTime: "09:00",
    workEndTime: "17:00",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
  });

  const handleFinish = () => {
    toast.success(isRTL ? "تم إعداد العيادة بنجاح! مرحباً بك في DOCTECH" : "Clinic setup complete! Welcome to DOCTECH.");
    router.push(`/${locale}/doctor/dashboard`);
  };

  return (
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-blue-950/5">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1A4B8C] text-white flex items-center justify-center text-xs font-bold">
            {step}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {step === 1 ? (isRTL ? "معلومات العيادة" : "Clinic Profile") : (isRTL ? "مواعيد العمل" : "Working Hours")}
            </h2>
            <p className="text-[11px] text-gray-400">Step {step} of 2</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
          <ShieldCheck size={13} />
          {isRTL ? "إعداد أولي" : "Initial Setup"}
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? "اسم العيادة الرسمي" : "Official Clinic Name"}
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? "عنوان العيادة والموقع" : "Address & Location"}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? "هاتف الاستقبال والتواصل" : "Clinic Reception Phone"}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full mt-4 py-2.5 px-4 rounded-lg bg-[#1A4B8C] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isRTL ? "التالي: مواعيد العمل" : "Next: Working Hours"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isRTL ? "بداية الدوام" : "Opening Time"}
              </label>
              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isRTL ? "نهاية الدوام" : "Closing Time"}
              </label>
              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? "مدة الكشف / الاستشارة (دقيقة)" : "Consultation Slot Duration (mins)"}
            </label>
            <select
              value={formData.consultationDuration}
              onChange={(e) => setFormData({ ...formData, consultationDuration: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            >
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes (Standard)</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800">
              {isRTL
                ? "يمكنك لاحقاً تعديل مواعيد العمل، إضافة مساعدين وسكرتارية، وربط الواتساب من لوحة التحكم."
                : "You can customize working shifts, invite secretaries, and connect WhatsApp later from settings."}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              {isRTL ? "السابق" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#1A4B8C] text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-900/10"
            >
              <span>{isRTL ? "إتمام الإعداد والدخول للعيادة" : "Finish Setup & Go to Dashboard"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}