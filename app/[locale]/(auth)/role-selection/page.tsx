"use client";

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
      router.push(`/${locale}/doctor/dashboard`);
    } else {
      router.push(`/${locale}/secretary/dashboard`);
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
          <ArrowRight size={18} className={`text-slate-300 group-hover:text-[#1A4B8C] mt-3 group-hover:translate-x-1 transition-all ${isRTL ? "rotate-180" : ""}`} />
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
          <ArrowRight size={18} className={`text-slate-300 group-hover:text-[#0891B2] mt-3 group-hover:translate-x-1 transition-all ${isRTL ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href={`/${locale}/sign-in`}
          className="text-xs text-slate-500 hover:text-slate-800 font-bold"
        >
          {isRTL ? "أو العودة إلى تسجيل الدخول العادي" : "Or go to regular credentials Sign In"}
        </Link>
      </div>
    </div>
  );
}