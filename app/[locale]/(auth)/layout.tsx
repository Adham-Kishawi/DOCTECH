import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { HeartPulse, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#1A4B8C] text-white flex items-center justify-center shadow-md shadow-blue-900/15 group-hover:scale-105 transition-transform">
            <HeartPulse size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">
              DOCTECH
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
              Clinic Management OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content Area - Perfectly Centered */}
      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-[460px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-200/60 z-10">
        <div className="flex items-center gap-1.5 font-medium text-slate-500">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>HIPAA & GDPR Compliant Medical Encryption</span>
        </div>
        <div className="font-medium">
          © {new Date().getFullYear()} DOCTECH • Enterprise Clinic Software
        </div>
      </footer>
    </div>
  );
}