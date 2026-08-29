"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split("/")[1] || "en";
  const targetLocale = currentLocale === "en" ? "ar" : "en";

  const toggleLanguage = () => {
    const segments = pathname.split("/");
    segments[1] = targetLocale;
    const newPath = segments.join("/") || `/${targetLocale}`;
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/80 border border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 shadow-sm transition-all cursor-pointer backdrop-blur"
      title={currentLocale === "en" ? "تبديل إلى العربية" : "Switch to English"}
    >
      <Globe size={14} className="text-[#1A4B8C]" />
      <span>{currentLocale === "en" ? "العربية (AR)" : "English (EN)"}</span>
    </button>
  );
}