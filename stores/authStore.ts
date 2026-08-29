"use client";

export type UserRole = "doctor" | "secretary";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicName: string;
  avatarColor: string;
}

const STORAGE_KEY = "doctech_session";

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  // Also set cookie for middleware compatibility
  document.cookie = `doctech_role=${session.role}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = "doctech_role=; path=/; max-age=0";
}
