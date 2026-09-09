"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
// import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
// import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B131E] flex flex-col justify-between relative overflow-hidden selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/40 dark:bg-blue-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-200/40 dark:bg-teal-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <Logo size={36} />
        </Link>

        <div className="flex items-center gap-3">
          {/* <ThemeToggle /> */}
          {/* <LanguageSwitcher /> */}
        </div>
      </header>

      {/* Main Content Area - Perfectly Centered */}
      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-[460px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800 z-10">
        <div className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
          <ShieldCheck size={15} className="text-[#36ADA3]" />
          <span>HIPAA & GDPR Compliant Medical Encryption</span>
        </div>
        <div className="font-medium">
          © {new Date().getFullYear()} DOCTECH • Enterprise Clinic Software
        </div>
      </footer>
    </div>
  );
}
