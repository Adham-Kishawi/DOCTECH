"use client";

import { useEffect, useState } from "react";
import { realtimeBus, RealtimeEvent } from "@/lib/realtimeService";
import { Info, X } from "lucide-react";

export function DiscreetAlert() {
  const [alert, setAlert] = useState<{
    message: string;
    patientName?: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    const unsub = realtimeBus.subscribe((event: RealtimeEvent) => {
      if (event.type === "SECRETARY_DISCREET_ALERT") {
        setAlert(event.payload);
        // Auto dismiss after 8 seconds
        setTimeout(() => setAlert(null), 8000);
      }
    });

    return () => unsub();
  }, []);

  if (!alert) return null;

  return (
    <div className="fixed top-3 right-6 z-50 max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-[#36ADA3] shadow-lg rounded-2xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#36ADA3] flex items-center justify-center shrink-0">
        <Info size={18} />
      </div>
      <div className="flex-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white">Note from Reception</span>
          <span className="text-[10px] text-slate-400 font-medium">{alert.time}</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium leading-relaxed">
          {alert.message}
        </p>
      </div>
      <button
        onClick={() => setAlert(null)}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}
