"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Stethoscope, UserCheck, ArrowRight, CheckCircle2, Shield } from "lucide-react";

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
    <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl shadow-blue-950/5">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1A4B8C] border border-blue-100 mb-3">
          <Shield size={13} />
          {isRTL ? "اختيار الدور للنموذج الأولي" : "Prototype Role Access"}
        </span>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? "اختر طريقة الدخول" : "Select Your Portal View"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRTL
            ? "استكشف تجربة النظام المخصصة لكل من الطبيب والسكرتيرة"
            : "Choose which role experience you want to preview in DOCTECH"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Doctor Card */}
        <button
          onClick={() => handleSelectRole("doctor")}
          className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#1A4B8C] bg-white hover:bg-blue-50/40 transition-all group flex items-start justify-between cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A4B8C] group-hover:bg-[#1A4B8C] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1A4B8C]">
                  {isRTL ? "طبيب (Medical Doctor)" : "Doctor Portal"}
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-[#1A4B8C] rounded">
                  Admin
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isRTL
                  ? "لوحة تحكم الطبيب، مراجعة التقارير الطبية، المواعيد، وإدارة الفريق"
                  : "Clinical review, reports triage, read-only schedule, team management"}
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-gray-400 group-hover:text-[#1A4B8C] mt-3 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Secretary Card */}
        <button
          onClick={() => handleSelectRole("secretary")}
          className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#0891B2] bg-white hover:bg-cyan-50/40 transition-all group flex items-start justify-between cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#0891B2] group-hover:bg-[#0891B2] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0891B2]">
                  {isRTL ? "سكرتيرة (Secretary / Reception)" : "Secretary Portal"}
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-100 text-[#0891B2] rounded">
                  Full CRUD
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isRTL
                  ? "حجز وإدارة المواعيد، ملفات المرضى، محادثات الواتساب، والفرز"
                  : "Appointment booking, patient directory, WhatsApp chats, report triage"}
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-gray-400 group-hover:text-[#0891B2] mt-3 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <Link
          href={`/${locale}/sign-in`}
          className="text-xs text-gray-500 hover:text-gray-800 font-medium"
        >
          {isRTL ? "أو العودة إلى تسجيل الدخول العادي" : "Or go to regular credentials Sign In"}
        </Link>
      </div>
    </div>
  );
}