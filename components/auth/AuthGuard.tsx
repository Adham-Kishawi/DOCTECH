"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { UserRole } from "@/types/index";
import { Logo } from "@/components/shared/Logo";

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
  const pathname = usePathname();

  const { isLoaded, isSignedIn } = useAuth();

  const locale = (params?.locale as string) || "en";

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const verifySession = async () => {
      if (!isSignedIn) {
        router.replace(
          `/${locale}/sign-in?redirect=${encodeURIComponent(pathname)}`
        );
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 403) {
          router.replace(`/${locale}/clinic-setup`);
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to verify DOCTECH account"
          );
        }

        if (allowedRole && data.role !== allowedRole) {
          router.replace(
            `/${locale}/${data.role}/dashboard`
          );
          return;
        }

        setAuthorized(true);
        setChecking(false);
      } catch (error) {
        console.error("AuthGuard error:", error);

        router.replace(
          `/${locale}/sign-in?redirect=${encodeURIComponent(pathname)}`
        );
      }
    };

    verifySession();
  }, [
    isLoaded,
    isSignedIn,
    locale,
    pathname,
    router,
    allowedRole,
  ]);

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