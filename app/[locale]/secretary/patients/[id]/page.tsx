"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "PAT-001";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href={`/${locale}/secretary/patients`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى دليل المرضى" : "Back to Patient Directory"}</span>
      </Link>

      {/* Patient Header Card */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-[#0891B2] text-xl font-extrabold flex items-center justify-center shrink-0 border border-cyan-100">
            AH
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">Ahmed Hassan</h1>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3">
              <span>+20 100 123 4567</span>
              <span>•</span>
              <span>42 Years (Male)</span>
              <span>•</span>
              <span>Blood Group: A+</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/${locale}/secretary/whatsapp/1`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <MessageCircle size={15} />
            <span>WhatsApp Chat</span>
          </Link>
          <Link
            href={`/${locale}/secretary/appointments/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={15} />
            <span>Book Visit</span>
          </Link>
        </div>
      </div>

      {/* Medical History & Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
            Medical Background
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Chronic Conditions</span>
              <p className="font-bold text-slate-800 mt-0.5">Hypertension (Diagnosed 2021)</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Known Allergies</span>
              <p className="font-bold text-slate-800 mt-0.5">Penicillin (Mild urticaria)</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px]">Current Prescriptions</span>
              <p className="font-bold text-slate-800 mt-0.5">Amlodipine 5mg OD, Concor 2.5mg</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Consultation History (Past Visits)</h2>
          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Follow-up Check • Dr. Clinical Lead</span>
                <p className="text-xs text-slate-500 mt-0.5">Blood pressure measured 135/85 mmHg. Prescription continued.</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Today</span>
            </div>
            <div className="py-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">Initial Cardiology Evaluation</span>
                <p className="text-xs text-slate-500 mt-0.5">ECG performed normal sinus rhythm. Advised lifestyle modifications.</p>
              </div>
              <span className="text-xs font-mono text-slate-400">2 months ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
