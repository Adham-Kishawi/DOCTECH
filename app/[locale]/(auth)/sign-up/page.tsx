"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, ArrowLeft, Building2 } from "lucide-react";

export default function SignUpPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  return (
    <div className="doctech-card p-8 sm:p-10 bg-white dark:bg-[#131E2E] text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#3368A0] dark:text-[#4B85C5] flex items-center justify-center mx-auto border border-blue-100 dark:border-slate-800">
        <Building2 size={32} />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-[#36ADA3] border border-[#36ADA3]/30 uppercase tracking-wider">
          <ShieldCheck size={13} />
          {isRTL ? "نظام إدارة العيادات الخاص" : "Managed Clinic Platform"}
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {isRTL ? "تسليم حسابات الأطباء" : "Clinic Handover Only"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
          {isRTL
            ? "يتم تجهيز وتسليم حسابات الأطباء والعيادات مباشرة عبر إدارة DOCTECH. بعد استلام حسابك، يمكنك دعوة وإنشاء حسابات السكرتارية من داخل لوحة التحكم."
            : "DOCTECH accounts are pre-provisioned for medical practices. Once onboarded, doctors can invite & manage secretaries directly from the dashboard."}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href={`/${locale}/sign-in`}
          className="w-full h-11 rounded-xl bg-[#3368A0] hover:bg-[#285783] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
          <span>{isRTL ? "العودة إلى تسجيل الدخول" : "Return to Sign In"}</span>
        </Link>
      </div>
    </div>
  );
}
