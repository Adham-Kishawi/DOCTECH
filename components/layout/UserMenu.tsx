

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { User, LogOut, RefreshCw, ChevronDown } from "lucide-react";
import { clearSession, setSession } from "@/stores/authStore";
import { toast } from "sonner";

interface UserMenuProps {
  name: string;
  role: "Doctor" | "Secretary";
  email: string;
  color?: string;
}

export function UserMenu({
  name,
  role,
  email,
  color = "#3368A0",
}: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { signOut } = useClerk();

  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const handleSignOut = async () => {
    try {
      clearSession();

      await signOut();

      toast.success(
        isRTL
          ? "تم تسجيل الخروج بنجاح"
          : "Signed out successfully"
      );

      router.replace(`/${locale}/sign-in`);
    } catch (error) {
      console.error("Sign out error:", error);

      toast.error(
        isRTL
          ? "تعذر تسجيل الخروج"
          : "Unable to sign out"
      );
    }
  };

  const handleSwitchRole = () => {
    const targetRole =
      role === "Doctor" ? "secretary" : "doctor";

    setSession({
      id:
        targetRole === "doctor"
          ? "doc-101"
          : "sec-202",
      name:
        targetRole === "doctor"
          ? "Dr. Clinical Lead"
          : "Sarah Jenkins",
      email:
        targetRole === "doctor"
          ? "doctor@doctech.com"
          : "secretary@doctech.com",
      role: targetRole,
      clinicName: "Al-Amal Clinic",
      avatarColor:
        targetRole === "doctor"
          ? "#3368A0"
          : "#36ADA3",
    });

    router.push(
      `/${locale}/${targetRole}/dashboard`
    );
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
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div
          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black shadow-xs"
          style={{ background: color }}
        >
          {initials}
        </div>

        <div className="hidden sm:block text-left rtl:text-right text-xs">
          <p className="font-bold text-slate-900 dark:text-white leading-tight">
            {name}
          </p>

          <p className="text-[10px] text-slate-400 font-medium">
            {role}
          </p>
        </div>

        <ChevronDown
          size={14}
          className="text-slate-400"
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-[#131E2E] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {name}
              </p>

              <p className="text-[11px] text-slate-400 truncate">
                {email}
              </p>
            </div>

            <div className="py-1">
              <Link
                href={`/${locale}/${role.toLowerCase()}/profile`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User size={15} />

                <span>
                  {isRTL
                    ? "الملف الشخصي"
                    : "My Profile"}
                </span>
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  handleSwitchRole();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#3368A0] dark:text-[#4B85C5] hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw size={14} />

                <span>
                  {isRTL
                    ? `تبديل إلى لوحة ${
                        role === "Doctor"
                          ? "السكرتيرة"
                          : "الطبيب"
                      }`
                    : `Switch to ${
                        role === "Doctor"
                          ? "Secretary"
                          : "Doctor"
                      } View`}
                </span>
              </button>
            </div>

            <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <LogOut size={14} />

                <span>
                  {isRTL
                    ? "تسجيل الخروج"
                    : "Sign Out"}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}