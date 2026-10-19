import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { isMissingSchema } from "@/lib/schedule/shiftService";

/**
 * Expiry of un-reviewed WhatsApp booking holds (plan §7.4 / E19).
 *
 * A `PENDING_REVIEW` appointment reserves its slot only until `expires_at`. The
 * database already treats an *expired* hold as absent when it checks for
 * overlap (migration 0001's trigger), so nothing is double-booked in the
 * meantime — but the row would linger and keep showing in the review queue. A
 * periodic sweep clears it.
 *
 * The sweep *rejects* rather than hard-deletes: the record is the only trace of
 * what a patient asked for, and a reject is exactly the state a secretary would
 * have set by hand.
 */

export interface HoldRow {
  id: string;
  booking_status: string;
  expires_at?: string | null;
}

/** True when a row is a pending hold whose deadline has already passed. */
export function isExpiredHold(row: HoldRow, nowMs: number = Date.now()): boolean {
  if (row.booking_status !== "PENDING_REVIEW") return false;
  if (!row.expires_at) return false;

  const expiresAt = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt <= nowMs;
}

export interface ExpireHoldsResult {
  expired: number;
  /** True when the whole feature is unavailable because 0001 is not applied. */
  unavailable: boolean;
}

/**
 * Rejects every `PENDING_REVIEW` hold whose `expires_at` has passed. Scoped to
 * one clinic when provided (cron) or left global (manual maintenance).
 */
export async function expireStaleHolds(
  now: Date = new Date(),
  clinicId?: string | null
): Promise<ExpireHoldsResult> {
  const nowIso = now.toISOString();

  let query = supabase
    .from("appointments")
    .update(
      {
        booking_status: "REJECTED",
        status: "CANCELLED",
        expires_at: null,
        updated_at: nowIso,
      },
      { count: "exact" }
    )
    .eq("booking_status", "PENDING_REVIEW")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso);

  if (clinicId) query = query.eq("clinic_id", clinicId);

  const { error, count } = await query;

  if (error) {
    if (isMissingSchema(error) || /expires_at/.test(error.message)) {
      return { expired: 0, unavailable: true };
    }
    throw new Error(error.message);
  }

  return { expired: count ?? 0, unavailable: false };
}
