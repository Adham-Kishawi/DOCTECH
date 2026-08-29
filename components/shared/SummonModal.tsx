"use client";

import { useEffect, useState } from "react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import { BellRing, Stethoscope, CheckCircle, Volume2, X } from "lucide-react";
import { toast } from "sonner";

export function SummonModal() {
  const [summon, setSummon] = useState<{
    doctorName: string;
    room: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "SUMMON_SECRETARY") {
        setSummon(event.payload);
        realtimeBus.playSummonChime();
        toast.error(`🚨 URGENT: ${event.payload.doctorName} is calling you to ${event.payload.room}!`, {
          duration: 10000,
        });
      } else if (event.type === "DISMISS_SUMMON") {
        setSummon(null);
      }
    });

    return () => unsub();
  }, []);

  if (!summon) return null;

  const handleAcknowledge = () => {
    realtimeBus.publish({ type: "DISMISS_SUMMON", payload: { by: "Secretary" } });
    setSummon(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#131E2E] rounded-3xl p-8 shadow-2xl border-4 border-red-500 animate-in zoom-in-95 duration-200 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-red-500/20">
          <BellRing size={40} />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 uppercase tracking-widest mb-2">
            🚨 Immediate Assistance Required
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Doctor Summon Alert
          </h2>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-2">
            {summon.doctorName} requested your immediate presence in:
          </p>
          <p className="text-xl font-extrabold text-[#3368A0] dark:text-[#4B85C5] mt-1 bg-blue-50 dark:bg-slate-800 p-3 rounded-2xl border border-blue-200 dark:border-slate-700">
            🏥 {summon.room}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Summoned at: {summon.time}
          </p>
        </div>

        <button
          onClick={handleAcknowledge}
          className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <CheckCircle size={18} />
          <span>I am on my way (Acknowledge)</span>
        </button>
      </div>
    </div>
  );
}
