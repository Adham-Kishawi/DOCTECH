"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { can } from "@/lib/permissions";

export interface ClientSession {
  role: "doctor" | "secretary" | null;
  roleId: string | null;
  permissions: string[];
  user: {
    id?: string;
    name?: string;
    email?: string;
    avatar_url?: string | null;
  } | null;
}

interface PermissionContextValue {
  loading: boolean;
  session: ClientSession;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_SESSION: ClientSession = { role: null, roleId: null, permissions: [], user: null };

const PermissionContext = createContext<PermissionContextValue>({
  loading: true,
  session: DEFAULT_SESSION,
  can: () => false,
  canAny: () => false,
  refresh: async () => {},
});

/**
 * Loads `/api/auth/me` once and exposes the current role + permissions to the
 * whole client tree, so the sidebar and `<PermissionGate>` share one source.
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ClientSession>(DEFAULT_SESSION);

  const load = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data?.success && data.role) {
        setSession({
          role: data.role,
          roleId: data.user?.role ?? null,
          permissions: Array.isArray(data.user?.permissions) ? data.user.permissions : [],
          user: data.user ?? null,
        });
      } else {
        setSession(DEFAULT_SESSION);
      }
    } catch {
      setSession(DEFAULT_SESSION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run();
  }, []);

  const value = useMemo<PermissionContextValue>(() => {
    const asSession = { role: session.role ?? "secretary", permissions: session.permissions } as never;
    return {
      loading,
      session,
      can: (permission: string) => can(asSession, permission),
      canAny: (permissions: string[]) => permissions.some((p) => can(asSession, p)),
      refresh: load,
    };
  }, [loading, session]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  return useContext(PermissionContext);
}

/**
 * Renders `children` only when the current session holds `permission`.
 * `fallback` (default null) is shown otherwise.
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, loading } = usePermissions();
  if (loading) return null;
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
