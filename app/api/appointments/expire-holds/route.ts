import { NextResponse } from "next/server";
import { expireStaleHolds } from "@/lib/schedule/holds";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * Sweeps expired WhatsApp booking holds (plan §7.4).
 *
 * Two callers are supported:
 *   * Vercel Cron — `Authorization: Bearer ${CRON_SECRET}`, sweeps every clinic.
 *   * An authenticated staff member — sweeps only their own clinic.
 *
 * When `CRON_SECRET` is unset the cron path is disabled, so an unauthenticated
 * caller cannot trigger a global sweep by sending an empty bearer token.
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization") || "";

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      const result = await expireStaleHolds(new Date());
      return NextResponse.json({ success: true, scope: "all", ...result });
    }

    const session = await requireSession({ permission: PERMISSIONS.APPOINTMENTS_MANAGE });
    const result = await expireStaleHolds(new Date(), session.clinicId);
    return NextResponse.json({ success: true, scope: "clinic", ...result });
  } catch (error) {
    return toErrorResponse(error, "Expire holds error");
  }
}
