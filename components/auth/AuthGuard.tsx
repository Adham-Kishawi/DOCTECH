"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { getSession, UserRole } from "@/stores/authStore";
import { Logo } from "@/components/shared/Logo";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "en";
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      // Redirect to sign in if no active session
      router.replace(`/${locale}/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRole && session.role !== allowedRole) {
      // Role mismatch redirect to their respective portal
      router.replace(`/${locale}/${session.role}/dashboard`);
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [locale, router, pathname, allowedRole]);

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
