import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ApiError, withSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPiastres, toPiastres } from "@/lib/money";

export const dynamic = "force-dynamic";

const missingTable = (message?: string): boolean =>
  /does not exist|PGRST205|42P01|schema cache/i.test(message || "");

/** Variance above this (piastres) must raise a shrinkage alert on close. */
const VARIANCE_ALERT_PIASTRES = 100_000; // 1,000 EGP

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("OPEN"),
    openingFloat: z.number().nonnegative().max(100_000_000).default(0),
    notes: z.string().trim().max(300).nullish(),
  }),
  z.object({
    action: z.literal("CLOSE"),
    actualCash: z.number().nonnegative().max(100_000_000),
    notes: z.string().trim().max(300).nullish(),
  }),
  z.object({
    action: z.literal("MOVEMENT"),
    direction: z.enum(["IN", "OUT"]),
    amount: z.number().positive().max(100_000_000),
    category: z.string().trim().min(1).max(40),
    referenceType: z.string().trim().max(40).nullish(),
    referenceId: z.string().trim().max(64).nullish(),
    notes: z.string().trim().max(300).nullish(),
  }),
]);

async function sessionTotals(sessionId: string): Promise<{ inAmount: number; outAmount: number }> {
  const { data, error } = await supabaseAdmin
    .from("cash_movements")
    .select("direction, amount")
    .eq("cash_session_id", sessionId);

  if (error) {
    if (missingTable(error.message)) return { inAmount: 0, outAmount: 0 };
    throw new ApiError(500, `Failed to read drawer movements: ${error.message}`);
  }

  let inAmount = 0;
  let outAmount = 0;
  for (const row of data || []) {
    const amount = Number(row.amount) || 0;
    if (row.direction === "IN") inAmount += amount;
    else outAmount += amount;
  }
  return { inAmount, outAmount };
}

const sessionDto = (
  row: Record<string, unknown>,
  totals: { inAmount: number; outAmount: number },
  expected: number | null
) => ({
  id: String(row.id),
  status: String(row.status ?? "OPEN"),
  openedAt: String(row.opened_at ?? ""),
  closedAt: (row.closed_at as string | null) ?? null,
  openingFloat: fromPiastres(Number(row.opening_float) || 0),
  cashIn: fromPiastres(totals.inAmount),
  cashOut: fromPiastres(totals.outAmount),
  expectedCash: expected === null ? null : fromPiastres(expected),
  actualCash: row.actual_cash === null || row.actual_cash === undefined ? null : fromPiastres(Number(row.actual_cash)),
  variance: row.variance === null || row.variance === undefined ? null : fromPiastres(Number(row.variance)),
  notes: (row.notes as string | null) ?? null,
});

/**
 * GET /api/finance/cash — the open drawer, its movements and expected cash.
 * `cashInDrawer` is now a reconciliation figure the secretary can match with
 * the physical drawer, not a number derived from a filter on expenses.
 */
export const GET = withSession(
  async (_request: Request, session) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("cash_sessions")
        .select("*")
        .eq("clinic_id", session.clinicId)
        .order("opened_at", { ascending: false })
        .limit(50);

      if (error) {
        if (missingTable(error.message)) {
          return NextResponse.json({ success: true, sessions: [], open: null, unavailable: true });
        }
        throw new ApiError(500, `Failed to load cash sessions: ${error.message}`);
      }

      const sessions = data || [];
      const openRow = sessions.find((row) => row.status === "OPEN") || null;

      let open: ReturnType<typeof sessionDto> | null = null;
      if (openRow) {
        const totals = await sessionTotals(String(openRow.id));
        const expected = (Number(openRow.opening_float) || 0) + totals.inAmount - totals.outAmount;
        open = sessionDto(openRow as unknown as Record<string, unknown>, totals, expected);
      }

      // Latest few closed sessions for history (no repeated total fetches).
      const history = [];
      for (const row of sessions.filter((r) => r.status !== "OPEN").slice(0, 10)) {
        const totals = await sessionTotals(String(row.id));
        history.push(sessionDto(row as unknown as Record<string, unknown>, totals, null));
      }

      return NextResponse.json({ success: true, open, history });
    } catch (error) {
      return toErrorResponse(error, "finance/cash GET error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_COLLECT }
);

/** POST /api/finance/cash — open, close or record a manual drawer movement. */
export const POST = withSession(
  async (request: Request, session) => {
    try {
      const raw = await request.json();
      const parsed = ActionSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid action");
      }

      const { data: openRow, error: openError } = await supabaseAdmin
        .from("cash_sessions")
        .select("*")
        .eq("clinic_id", session.clinicId)
        .eq("status", "OPEN")
        .maybeSingle();

      if (openError && !missingTable(openError.message)) {
        throw new ApiError(500, `Failed to read drawer: ${openError.message}`);
      }

      const action = parsed.data.action;

      if (action === "OPEN") {
        if (openRow) throw new ApiError(409, "A drawer is already open — close it first");

        const { data: created, error: insertError } = await supabaseAdmin
          .from("cash_sessions")
          .insert({
            id: `cs-${randomUUID().slice(0, 10)}`,
            clinic_id: session.clinicId,
            secretary_id: session.role === "secretary" ? session.user.id : null,
            opening_float: toPiastres(parsed.data.openingFloat),
            status: "OPEN",
            notes: parsed.data.notes ?? null,
          })
          .select()
          .single();

        if (insertError) {
          if (missingTable(insertError.message)) {
            throw new ApiError(503, "Cash sessions missing — apply migration 0005.");
          }
          throw new ApiError(500, `Failed to open drawer: ${insertError.message}`);
        }

        return NextResponse.json({
          success: true,
          open: sessionDto(created as unknown as Record<string, unknown>, { inAmount: 0, outAmount: 0 }, toPiastres(parsed.data.openingFloat)),
        });
      }

      if (!openRow) throw new ApiError(409, "No open drawer for this clinic");

      if (action === "MOVEMENT") {
        const { error: movementError } = await supabaseAdmin.from("cash_movements").insert({
          id: `cm-${randomUUID().slice(0, 10)}`,
          cash_session_id: String(openRow.id),
          clinic_id: session.clinicId,
          direction: parsed.data.direction,
          amount: toPiastres(parsed.data.amount),
          category: parsed.data.category,
          reference_type: parsed.data.referenceType ?? null,
          reference_id: parsed.data.referenceId ?? null,
          notes: parsed.data.notes ?? null,
          recorded_by: session.userId,
        });

        if (movementError) {
          if (missingTable(movementError.message)) {
            throw new ApiError(503, "Cash movements missing — apply migration 0005.");
          }
          throw new ApiError(500, `Failed to record movement: ${movementError.message}`);
        }

        const totals = await sessionTotals(String(openRow.id));
        const expected = (Number(openRow.opening_float) || 0) + totals.inAmount - totals.outAmount;
        return NextResponse.json({
          success: true,
          open: sessionDto(openRow as unknown as Record<string, unknown>, totals, expected),
        });
      }

      // --- CLOSE -------------------------------------------------------------
      const totals = await sessionTotals(String(openRow.id));
      const expected = (Number(openRow.opening_float) || 0) + totals.inAmount - totals.outAmount;
      const actual = toPiastres(parsed.data.actualCash);
      const variance = actual - expected;
      const closedAt = new Date().toISOString();

      const { data: closed, error: closeError } = await supabaseAdmin
        .from("cash_sessions")
        .update({
          status: "CLOSED",
          closed_at: closedAt,
          expected_cash: expected,
          actual_cash: actual,
          variance,
          notes: parsed.data.notes ?? openRow.notes,
          updated_at: closedAt,
        })
        .eq("id", String(openRow.id))
        .eq("clinic_id", session.clinicId)
        .select()
        .single();

      if (closeError) {
        throw new ApiError(500, `Failed to close drawer: ${closeError.message}`);
      }

      return NextResponse.json({
        success: true,
        open: null,
        closed: sessionDto(closed as unknown as Record<string, unknown>, totals, expected),
        /** Above 1,000 EGP the UI must demand a written explanation. */
        varianceAlert: Math.abs(variance) > VARIANCE_ALERT_PIASTRES,
        varianceThreshold: fromPiastres(VARIANCE_ALERT_PIASTRES),
      });
    } catch (error) {
      return toErrorResponse(error, "finance/cash POST error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_COLLECT }
);
