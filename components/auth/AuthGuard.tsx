"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { UserRole } from "@/types/index";
import { Logo } from "@/components/shared/Logo";
import { RefreshCw, LogIn } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export function AuthGuard({
  children,
  allowedRole,
}: AuthGuardProps) {
  const router = useRouter();
  const params = useParams();
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  const { isLoaded, isSignedIn } = useAuth();

  const locale = (params?.locale as string) || (pathname ? pathname.split("/")[1] : "en") || "en";

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifySession = useCallback(async () => {
    if (!isSignedIn) {
      router.replace(
        `/${locale}/sign-in?redirect=${encodeURIComponent(pathname)}`
      );
      return;
    }

    setChecking(true);
    setErrorMessage(null);

    // Try up to 3 times to allow Clerk session tokens and cookies to synchronize
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401 && attempt < 2) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }

        if (response.status === 403) {
          router.replace(`/${locale}/clinic-setup`);
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to verify DOCTECH account"
          );
        }

        // Set doctech_role cookie to preserve user role in SSR
        if (data.role) {
          document.cookie = `doctech_role=${data.role}; path=/; max-age=86400; SameSite=Lax`;
        }

        if (allowedRole && data.role !== allowedRole) {
          router.replace(
            `/${locale}/${data.role}/dashboard`
          );
          return;
        }

        setAuthorized(true);
        setChecking(false);
        return;
      } catch (error: any) {
        if (attempt === 2) {
          console.error("AuthGuard error:", error);
          setErrorMessage(
            error?.message || "Failed to verify DOCTECH medical session."
          );
          setChecking(false);
        } else {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }, [isSignedIn, locale, pathname, allowedRole, router]);

  useEffect(() => {
    if (!isLoaded) return;
    verifySession();
  }, [isLoaded, verifySession]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#0B131E] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#131E2E] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <Logo size={32} />
          </div>

          <h2 className="text-lg font-bold text-white">
            {locale === "ar" ? "تعذر التحقق من الجلسة" : "Session Verification"}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            {errorMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => verifySession()}
              className="flex-1 h-10 rounded-xl bg-[#3368A0] hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>{locale === "ar" ? "إعادة المحاولة" : "Try Again"}</span>
            </button>

            <button
              onClick={() => router.replace(`/${locale}/sign-in`)}
              className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={14} />
              <span>{locale === "ar" ? "تسجيل الدخول" : "Sign In"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checking || !authorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B131E] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Logo size={48} />

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3368A0] animate-ping" />

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Verifying Medical Session Security...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}