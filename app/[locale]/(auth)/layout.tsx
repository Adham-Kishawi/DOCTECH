import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Activity, ShieldCheck, HeartPulse } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF4FF] via-[#F7F5F0] to-[#E2EEFF] flex flex-col justify-between p-4 sm:p-6 relative">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#1A4B8C] text-white flex items-center justify-center shadow-md shadow-blue-900/10 group-hover:scale-105 transition-transform">
            <HeartPulse size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[#1A1A2E] block leading-none">
              DOCTECH
            </span>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mt-0.5">
              Clinic OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center py-3 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-200/60 mt-auto">
        <div className="flex items-center gap-1 text-gray-600">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>HIPAA & GDPR Compliant Medical Encryption</span>
        </div>
        <div>
          © {new Date().getFullYear()} DOCTECH Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}