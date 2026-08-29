"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { User, LogOut, Settings, RefreshCw, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

interface UserMenuProps {
  name: string;
  role: "Doctor" | "Secretary";
  email: string;
  color?: string;
}

export function UserMenu({ name, role, email, color = "#1A4B8C" }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const handleSignOut = () => {
    toast.success(isRTL ? "تم تسجيل الخروج" : "Signed out successfully");
    router.push(`/${locale}/sign-in`);
  };

  const handleSwitchRole = () => {
    const target = role === "Doctor" ? "secretary" : "doctor";
    router.push(`/${locale}/${target}/dashboard`);
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100/80 transition-all cursor-pointer border border-transparent hover:border-gray-200"
      >
        <div
          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-left text-xs">
          <p className="font-bold text-gray-900 leading-tight">{name}</p>
          <p className="text-[10px] text-gray-500 font-medium">{role}</p>
        </div>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-900">{name}</p>
              <p className="text-[11px] text-gray-400 truncate">{email}</p>
            </div>

            <div className="py-1">
              <Link
                href={`/${locale}/${role.toLowerCase()}/profile`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <User size={15} />
                <span>{isRTL ? "الملف الشخصي" : "My Profile"}</span>
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  handleSwitchRole();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw size={14} />
                <span>
                  {isRTL
                    ? `تبديل إلى لوحة ${role === "Doctor" ? "السكرتيرة" : "الطبيب"}`
                    : `Switch to ${role === "Doctor" ? "Secretary" : "Doctor"} View`}
                </span>
              </button>
            </div>

            <div className="pt-1 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={14} />
                <span>{isRTL ? "تسجيل الخروج" : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}