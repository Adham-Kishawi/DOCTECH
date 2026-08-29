"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileText, ArrowLeft, Send, Stethoscope, AlertTriangle, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SecretaryReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";
  const id = params?.id || "REP-401";

  const [triageNote, setTriageNote] = useState("Patient reports fever of 39.2C post antibiotic. Flagged for urgent doctor review.");
  const [urgency, setUrgency] = useState<"High" | "Medium" | "Normal">("High");
  const [sending, setSending] = useState(false);

  const handleSendToDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    setTimeout(() => {
      toast.success(isRTL ? "تم إرسال التقرير وتنبيه الطبيب فوراً!" : "Report triaged & routed to Dr. Clinical Lead!");
      router.push(`/${locale}/secretary/reports`);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/secretary/reports`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={15} className={isRTL ? "rotate-180" : ""} />
        <span>{isRTL ? "العودة إلى صندوق الفرز" : "Back to Reports Triage"}</span>
      </Link>

      <div className="doctech-card p-7 sm:p-9 bg-white space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Case Triage & Doctor Dispatch #{id}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Assign urgency and send clinical summary to Doctor</p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
            {id}
          </span>
        </div>

        {/* Patient Inquiry Review */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Patient: Kareem Tarek (+20 100 123 4567)</span>
            <span className="text-slate-400">15 mins ago</span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            &quot;I have had high fever (39.2C) with chills for 3 consecutive days after finishing the prescribed antibiotic course.&quot;
          </p>
        </div>

        <form onSubmit={handleSendToDoctor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Urgency Level</label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["High", "Medium", "Normal"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUrgency(lvl)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    urgency === lvl
                      ? lvl === "High"
                        ? "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-500/20"
                        : lvl === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {lvl} Urgency
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Secretary Intake & Triage Notes</label>
            <textarea
              rows={3}
              required
              value={triageNote}
              onChange={(e) => setTriageNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full h-11 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-sm font-bold shadow-md shadow-cyan-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{sending ? "Routing to Doctor..." : "Route Case to Dr. Clinical Lead"}</span>
            <Stethoscope size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}