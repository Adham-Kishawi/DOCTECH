"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("DOCTECH Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B131E] flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-[#131E2E] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-black/60">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <AlertTriangle size={28} />
        </div>

        <div>
          <h1 className="text-xl font-black text-white tracking-tight">
            تعذر تحميل الصفحة / Unable to load page
          </h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 h-11 rounded-xl bg-[#3368A0] hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 active:scale-[0.98]"
          >
            <RefreshCw size={14} />
            <span>إعادة المحاولة / Try Again</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
            className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Home size={14} />
            <span>الرئيسية / Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
