import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, withSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { runExpenseTemplates } from "@/lib/finance/templates";
import { isValidMonthKey } from "@/lib/finance/period";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { wallDate } from "@/lib/schedule/clinicTime";

export const dynamic = "force-dynamic";

const RunSchema = z.object({
  /** "YYYY-MM"; defaults to the clinic's current month. */
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month must be YYYY-MM")
    .optional(),
});

/**
 * POST /api/finance/templates/run — post every recurring expense that is due.
 *
 * Idempotent: running it twice in the same month posts each template once
 * (guarded by `last_posted_period`). Safe to call from a cron or a button.
 */
export const POST = withSession(
  async (request: Request, session) => {
    try {
      const raw = await request.json().catch(() => ({}));
      const parsed = RunSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid month");
      }

      const timeZone = await getClinicTimezone(session.clinicId);
      const month = parsed.data.month || wallDate(new Date(), timeZone).slice(0, 7);
      if (!isValidMonthKey(month)) throw new ApiError(400, "month must be YYYY-MM");

      const result = await runExpenseTemplates({
        clinicId: session.clinicId,
        periodKey: month,
      });

      return NextResponse.json({ success: true, result });
    } catch (error) {
      return toErrorResponse(error, "finance/templates run error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES }
);
