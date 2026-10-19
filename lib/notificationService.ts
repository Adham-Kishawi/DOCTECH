"use client";

import type { SystemNotification } from "@/types/index";

export type { SystemNotification };

/**
 * Notifications for the signed-in clinic user.
 *
 * Reads and writes go through the session-protected /api/notifications route,
 * which scopes every row to the clinic taken from the session. Nothing is
 * cached in localStorage and no seeded notifications exist — an unreachable
 * backend yields an empty list instead of fabricated entries.
 */

interface NotificationsResponse {
  success: boolean;
  error?: string;
  notifications?: SystemNotification[];
}

const readJson = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    throw new Error(`notifications request failed with ${res.status}`);
  }
  return (await res.json()) as T;
};

export async function fetchNotifications(
  _role?: "doctor" | "secretary"
): Promise<SystemNotification[]> {
  try {
    const payload = await readJson<NotificationsResponse>(
      await fetch("/api/notifications", { cache: "no-store" })
    );
    if (!payload.success) throw new Error(payload.error || "notifications request failed");
    return payload.notifications ?? [];
  } catch (err) {
    console.warn("fetchNotifications failed:", err);
    return [];
  }
}

export async function markAllNotificationsRead(
  _role?: "doctor" | "secretary"
): Promise<void> {
  const payload = await readJson<NotificationsResponse>(
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
  );
  if (!payload.success) {
    throw new Error(payload.error || "Failed to mark notifications as read");
  }
}
