"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, ArrowLeft, Send, Sparkles, CheckCircle2, 
  AlertTriangle, User, MessageCircle, Stethoscope, Clock, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function DoctorMedicalReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "REP-401";

  const [diagnosis, setDiagnosis] = useState("Suspected drug resistance / persistent bacterial infection. Discontinue current formulation.");
  const [prescription, setPrescription] = useState("1. Ceftriaxone 1g IM daily for 3 days.\n2. Paracetamol 500mg every 8 hours as needed for fever.\n3. Maintain high fluid intake.");
  const [instructions, setInstructions] = useState("Return to clinic immediately if temperature exceeds 39.5C or difficulty breathing occurs.");
  const [replyMethod, setReplyMethod] = useState<"whatsapp" | "ai" | "clinic">("whatsapp");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      toast.success(isRTL ? "تم حفظ القرار الطبي وإرسال التوجيه إلى السكرتيرة والواتساب" : "Medical review submitted & dispatched to WhatsApp/Secretary!");
      router.push(`/${locale}/doctor/reports`);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/doctor/reports`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
          <span>{isRTL ? "العودة إلى قائمة التقارير" : "Back to Reports Inbox"}</span>
        </Link>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
          Case #{id}
        </span>
      </div>

      {/* Main Grid: Patient Case Summary + Doctor Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient Symptoms & Secretary Triage */}
        <div className="space-y-5">
          {/* Patient Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A4B8C] text-base font-extrabold flex items-center justify-center shrink-0">
                KT
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Kareem Tarek</h2>
                <p className="text-xs text-slate-500 font-medium">+20 100 123 4567 • 46 yrs (Male)</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient Inquiry</span>
                <p className="font-medium text-slate-800 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  &quot;I have had high fever (39.2C) with chills for 3 consecutive days after finishing the prescribed antibiotic course.&quot;
                </p>
              </div>

              <div>
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-600" />
                  Secretary Triage Notes (Sarah J.)
                </span>
                <p className="font-medium text-amber-900 mt-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
                  &quot;Patient states fever is not breaking. Marked as HIGH urgency. Awaiting Dr. decision before WhatsApp response.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Medical Decision & Prescription Editor */}
        <div className="lg:col-span-2 bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Clinical Review & Treatment Plan</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Provide medical diagnosis, updated dosage, and patient instructions
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1A4B8C] text-xs font-bold border border-blue-100">
              <Stethoscope size={14} />
              <span>Medical Lead</span>
            </div>
          </div>

          <form onSubmit={handleSubmitDecision} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Clinical Diagnosis / Impression
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="doctech-input !pl-4 !pr-4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Prescription & Medication Plan
              </label>
              <textarea
                rows={4}
                required
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C] leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Special Patient Instructions / Red Flags
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4B8C]"
              />
            </div>

            {/* Reply Dispatch Method */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {isRTL ? "طريقة إرسال الرد للمريض:" : "Dispatch Method to Patient:"}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReplyMethod("whatsapp")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    replyMethod === "whatsapp"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Business API</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplyMethod("ai")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    replyMethod === "ai"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Sparkles size={15} />
                  <span>AI Patient Summary</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#1A4B8C] hover:bg-[#153E75] text-white text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{submitting ? "Submitting Decision..." : "Approve & Dispatch Treatment Plan"}</span>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}