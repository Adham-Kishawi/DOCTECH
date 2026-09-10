"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  UserRound,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { value: 6, en: "Saturday", ar: "السبت" },
  { value: 0, en: "Sunday", ar: "الأحد" },
  { value: 1, en: "Monday", ar: "الاثنين" },
  { value: 2, en: "Tuesday", ar: "الثلاثاء" },
  { value: 3, en: "Wednesday", ar: "الأربعاء" },
  { value: 4, en: "Thursday", ar: "الخميس" },
  { value: 5, en: "Friday", ar: "الجمعة" },
];

export default function ClinicSetupPage() {
  const params = useParams();
  const router = useRouter();

  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    doctorName: "",
    specialty: "",
    clinicName: "",
    address: "",
    phone: "",
    consultationDuration: "30",
    workStartTime: "09:00",
    workEndTime: "17:00",
    workingDays: [] as number[],
  });

  const updateField = (
    field: keyof typeof formData,
    value: string | number[]
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleWorkingDay = (day: number) => {
    setFormData((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((value) => value !== day)
        : [...current.workingDays, day],
    }));
  };

  const handleNext = () => {
    if (
      !formData.doctorName.trim() ||
      !formData.clinicName.trim() ||
      !formData.address.trim()
    ) {
      toast.error(
        isRTL
          ? "يرجى إكمال بيانات الطبيب والعيادة"
          : "Please complete the doctor and clinic information"
      );
      return;
    }

    setStep(2);
  };

  const handleFinish = async () => {
    if (formData.workingDays.length === 0) {
      toast.error(
        isRTL
          ? "يرجى اختيار يوم عمل واحد على الأقل"
          : "Please select at least one working day"
      );
      return;
    }

    if (formData.workStartTime >= formData.workEndTime) {
      toast.error(
        isRTL
          ? "وقت بداية الدوام يجب أن يكون قبل وقت النهاية"
          : "Opening time must be before closing time"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (isRTL
              ? "تعذر إكمال إعداد العيادة"
              : "Failed to complete clinic setup")
        );
      }

      toast.success(
        isRTL
          ? "تم إعداد العيادة بنجاح! مرحباً بك في DOCTECH"
          : "Clinic setup complete! Welcome to DOCTECH."
      );

      router.push(`/${locale}/doctor/dashboard`);
    } catch (error) {
      console.error("Clinic setup error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : isRTL
            ? "حدث خطأ أثناء إعداد العيادة"
            : "Something went wrong while setting up your clinic"
      );
    } finally {
      setLoading(false);
    }
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
            <h2 className="text-sm font-bold text-white leading-tight">
              {step === 1
                ? isRTL
                  ? "بيانات العيادة والطبيب"
                  : "Clinic & Doctor Profile"
                : isRTL
                  ? "مواعيد العمل"
                  : "Working Hours"}
            </h2>

            <p className="text-[11px] font-medium text-slate-400">
              Step {step} of 2
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          {isRTL ? "إعداد أولي" : "Initial Setup"}
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          {/* Doctor Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "اسم الطبيب" : "Doctor Name"}
            </label>

            <div className="relative">
              <UserRound className="doctech-input-icon" size={17} />

              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) =>
                  updateField("doctorName", e.target.value)
                }
                placeholder={isRTL ? "د. أحمد محمد" : "Dr. Ahmed Mohamed"}
                className="doctech-input"
              />
            </div>
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "التخصص الطبي" : "Medical Specialty"}
            </label>

            <div className="relative">
              <Stethoscope className="doctech-input-icon" size={17} />

              <input
                type="text"
                value={formData.specialty}
                onChange={(e) =>
                  updateField("specialty", e.target.value)
                }
                placeholder={
                  isRTL ? "مثال: طب الأطفال" : "e.g. Pediatrics"
                }
                className="doctech-input"
              />
            </div>
          </div>

          {/* Clinic Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "اسم العيادة الرسمي" : "Official Clinic Name"}
            </label>

            <div className="relative">
              <Building2 className="doctech-input-icon" size={17} />

              <input
                type="text"
                value={formData.clinicName}
                onChange={(e) =>
                  updateField("clinicName", e.target.value)
                }
                placeholder={
                  isRTL ? "اسم العيادة" : "Your Clinic Name"
                }
                className="doctech-input"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "عنوان العيادة والموقع" : "Address & Location"}
            </label>

            <div className="relative">
              <MapPin className="doctech-input-icon" size={17} />

              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  updateField("address", e.target.value)
                }
                placeholder={
                  isRTL
                    ? "عنوان العيادة بالتفصيل"
                    : "Full clinic address"
                }
                className="doctech-input"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL
                ? "هاتف الاستقبال والتواصل"
                : "Clinic Reception Phone"}
            </label>

            <div className="relative">
              <Phone className="doctech-input-icon" size={17} />

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  updateField("phone", e.target.value)
                }
                placeholder="+20 100 000 0000"
                className="doctech-input"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full mt-4 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>
              {isRTL ? "التالي: مواعيد العمل" : "Next: Working Hours"}
            </span>

            <ArrowRight
              size={16}
              className={isRTL ? "rotate-180" : ""}
            />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Working Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRTL ? "أيام العمل" : "Working Days"}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS.map((day) => {
                const selected = formData.workingDays.includes(
                  day.value
                );

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWorkingDay(day.value)}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selected
                        ? "bg-[#1A4B8C] border-[#1A4B8C] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {isRTL ? day.ar : day.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRTL ? "بداية الدوام" : "Opening Time"}
              </label>

              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) =>
                  updateField("workStartTime", e.target.value)
                }
                className="w-full h-11 text-slate-900   px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium  focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ">
                {isRTL ? "نهاية الدوام" : "Closing Time"}
              </label>

              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) =>
                  updateField("workEndTime", e.target.value)
                }
                className="text-slate-900 w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>
          </div>

          {/* Consultation Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ">
              {isRTL
                ? "مدة الكشف / الاستشارة (دقيقة)"
                : "Consultation Slot Duration (mins)"}
            </label>

            <select
              value={formData.consultationDuration}
              onChange={(e) =>
                updateField(
                  "consultationDuration",
                  e.target.value
                )
              }
              className="text-slate-900 w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
            >
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes (Standard)</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          {/* Info */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl flex items-start gap-2.5">
            <CheckCircle2
              size={18}
              className="text-emerald-600 mt-0.5 shrink-0"
            />

            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              {isRTL
                ? "يمكنك لاحقاً تعديل مواعيد العمل، إضافة سكرتارية، وربط الواتساب من لوحة التحكم."
                : "You can customize working hours, invite secretaries, and connect WhatsApp later from settings."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRTL ? "السابق" : "Back"}
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {loading
                  ? isRTL
                    ? "جاري إعداد العيادة..."
                    : "Setting up clinic..."
                  : isRTL
                    ? "إتمام الإعداد والدخول للعيادة"
                    : "Finish Setup & Enter"}
              </span>

              {!loading && (
                <ArrowRight
                  size={16}
                  className={isRTL ? "rotate-180" : ""}
                />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}