import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ApiError, withSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPiastres, toPiastres } from "@/lib/money";
import { loadFixedCostBreakdown } from "@/lib/finance/templates";
import { zonedWallTimeToUtc } from "@/lib/finance/period";

export const dynamic = "force-dynamic";

const FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;
const POSTING_MODES = ["AUTO", "CONFIRM", "MANUAL"] as const;

const TemplateSchema = z.object({
  categoryId: z.string().min(1).nullish(),
  titleEn: z.string().trim().min(1).max(120),
  titleAr: z.string().trim().min(1).max(120),
  /** EGP — converted to piastres at the boundary. */
  amount: z.number().nonnegative().max(1_000_000_000),
  frequency: z.enum(FREQUENCIES).default("MONTHLY"),
  dueDayOfMonth: z.number().int().min(1).max(31).nullish(),
  weekday: z.number().int().min(0).max(6).nullish(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  paymentMethod: z.string().trim().max(40).default("BANK_TRANSFER"),
  payee: z.string().trim().max(120).nullish(),
  contractRef: z.string().trim().max(60).nullish(),
  postingMode: z.enum(POSTING_MODES).default("AUTO"),
  accountingBasis: z.enum(["CASH", "ACCRUAL"]).default("CASH"),
  isActive: z.boolean().default(true),
});

const toDto = (row: Record<string, unknown>) => ({
  id: String(row.id),
  categoryId: (row.category_id as string | null) ?? null,
  titleEn: String(row.title_en ?? ""),
  titleAr: String(row.title_ar ?? ""),
  amount: fromPiastres(Number(row.amount) || 0),
  frequency: String(row.frequency ?? "MONTHLY"),
  dueDayOfMonth: (row.due_day_of_month as number | null) ?? null,
  weekday: (row.weekday as number | null) ?? null,
  startDate: (row.start_date as string | null) ?? null,
  endDate: (row.end_date as string | null) ?? null,
  paymentMethod: String(row.payment_method ?? "CASH"),
  payee: (row.payee as string | null) ?? null,
  contractRef: (row.contract_ref as string | null) ?? null,
  postingMode: String(row.posting_mode ?? "AUTO"),
  accountingBasis: String(row.accounting_basis ?? "CASH"),
  lastPostedPeriod: (row.last_posted_period as string | null) ?? null,
  nextDueAt: (row.next_due_at as string | null) ?? null,
  isActive: Boolean(row.is_active),
});

/** Next due instant for a fresh/edited template, honouring its own cadence. */
function computeNextDue(input: {
  frequency: string;
  dueDayOfMonth?: number | null;
  startDate?: string | null;
}): string {
  const now = new Date();
  const start = input.startDate
    ? new Date(`${input.startDate}T00:00:00Z`)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const day = Math.min(input.dueDayOfMonth ?? start.getUTCDate(), 28);
  const candidate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), day));

  const stepMonths: Record<string, number> = { WEEKLY: 0, BIWEEKLY: 0, MONTHLY: 1, QUARTERLY: 3, ANNUAL: 12 };
  if (input.frequency === "WEEKLY" || input.frequency === "BIWEEKLY") {
    const step = input.frequency === "WEEKLY" ? 7 : 14;
    const weekly = candidate.getTime() < start.getTime() ? candidate.getTime() + step * 86_400_000 : candidate.getTime();
    return new Date(weekly).toISOString();
  }

  const add = stepMonths[input.frequency] ?? 1;
  const next = candidate.getTime() >= start.getTime()
    ? candidate
    : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + add, day));

  // Never schedule into the past.
  const floor = zonedWallTimeToUtc(
    `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}T00:00:00`,
    "UTC"
  );
  return (next.getTime() < floor.getTime() ? floor : next).toISOString();
}

/** GET /api/finance/templates — recurring templates + the monthly fixed-cost view. */
export const GET = withSession(
  async (_request: Request, session) => {
    try {
      const [{ data, error }, fixedCosts] = await Promise.all([
        supabaseAdmin
          .from("expense_templates")
          .select("*")
          .eq("clinic_id", session.clinicId)
          .order("created_at", { ascending: false }),
        loadFixedCostBreakdown(session.clinicId),
      ]);

      if (error && !/does not exist|PGRST205|42P01/i.test(error.message)) {
        throw new ApiError(500, `Failed to load templates: ${error.message}`);
      }

      const templates = error ? [] : (data || []).map((row) => toDto(row as Record<string, unknown>));

      return NextResponse.json({
        success: true,
        templates,
        fixedCosts: {
          rows: fixedCosts.rows.map((row) => ({
            templateId: row.templateId,
            titleEn: row.titleEn,
            titleAr: row.titleAr,
            categoryCode: row.categoryCode,
            behavior: row.behavior,
            amount: fromPiastres(row.amountPiastres),
            monthly: fromPiastres(row.monthlyPiastres),
            frequency: row.frequency,
            variabilityPct: row.variabilityPct,
          })),
          monthlyTotal: fromPiastres(fixedCosts.monthlyTotal),
          unavailable: Boolean(fixedCosts.unavailable),
        },
      });
    } catch (error) {
      return toErrorResponse(error, "finance/templates GET error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_VIEW }
);

/** POST /api/finance/templates — schedule a recurring expense. */
export const POST = withSession(
  async (request: Request, session) => {
    try {
      const body = await request.json();
      const parsed = TemplateSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid template");
      }
      const input = parsed.data;

      const amountPiastres = toPiastres(input.amount);
      if (amountPiastres <= 0) throw new ApiError(400, "Amount must be greater than zero");

      const id = `tpl-${randomUUID().slice(0, 8)}`;
      const nextDueAt = computeNextDue({
        frequency: input.frequency,
        dueDayOfMonth: input.dueDayOfMonth,
        startDate: input.startDate,
      });

      const { data, error } = await supabaseAdmin
        .from("expense_templates")
        .insert({
          id,
          clinic_id: session.clinicId,
          category_id: input.categoryId ?? null,
          title_en: input.titleEn,
          title_ar: input.titleAr,
          amount: amountPiastres,
          frequency: input.frequency,
          due_day_of_month: input.dueDayOfMonth ?? null,
          weekday: input.weekday ?? null,
          start_date: input.startDate ?? null,
          end_date: input.endDate ?? null,
          payment_method: input.paymentMethod,
          payee: input.payee ?? null,
          contract_ref: input.contractRef ?? null,
          posting_mode: input.postingMode,
          accounting_basis: input.accountingBasis,
          next_due_at: nextDueAt,
          is_active: input.isActive,
        })
        .select()
        .single();

      if (error) throw new ApiError(500, `Failed to save template: ${error.message}`);

      return NextResponse.json({ success: true, template: toDto(data) });
    } catch (error) {
      return toErrorResponse(error, "finance/templates POST error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES }
);

/** PATCH /api/finance/templates — edit amount, cadence or activation. */
export const PATCH = withSession(
  async (request: Request, session) => {
    try {
      const body = await request.json();
      const id = String(body?.id || "");
      if (!id) throw new ApiError(400, "id is required");

      const parsed = TemplateSchema.partial().safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid template update");
      }
      const input = parsed.data;

      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.categoryId !== undefined) payload.category_id = input.categoryId;
      if (input.titleEn !== undefined) payload.title_en = input.titleEn;
      if (input.titleAr !== undefined) payload.title_ar = input.titleAr;
      if (input.amount !== undefined) payload.amount = toPiastres(input.amount);
      if (input.frequency !== undefined) payload.frequency = input.frequency;
      if (input.dueDayOfMonth !== undefined) payload.due_day_of_month = input.dueDayOfMonth;
      if (input.weekday !== undefined) payload.weekday = input.weekday;
      if (input.startDate !== undefined) payload.start_date = input.startDate;
      if (input.endDate !== undefined) payload.end_date = input.endDate;
      if (input.paymentMethod !== undefined) payload.payment_method = input.paymentMethod;
      if (input.payee !== undefined) payload.payee = input.payee;
      if (input.contractRef !== undefined) payload.contract_ref = input.contractRef;
      if (input.postingMode !== undefined) payload.posting_mode = input.postingMode;
      if (input.accountingBasis !== undefined) payload.accounting_basis = input.accountingBasis;
      if (input.isActive !== undefined) payload.is_active = input.isActive;
      if (input.frequency !== undefined || input.dueDayOfMonth !== undefined) {
        payload.next_due_at = computeNextDue({
          frequency: input.frequency ?? "MONTHLY",
          dueDayOfMonth: input.dueDayOfMonth ?? null,
          startDate: input.startDate ?? null,
        });
      }

      const { data, error } = await supabaseAdmin
        .from("expense_templates")
        .update(payload)
        .eq("id", id)
        .eq("clinic_id", session.clinicId)
        .select()
        .maybeSingle();

      if (error) throw new ApiError(500, `Failed to update template: ${error.message}`);
      if (!data) throw new ApiError(404, "Template not found");

      return NextResponse.json({ success: true, template: toDto(data) });
    } catch (error) {
      return toErrorResponse(error, "finance/templates PATCH error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES }
);

/** DELETE /api/finance/templates — archive (rows already posted stay). */
export const DELETE = withSession(
  async (request: Request, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (!id) throw new ApiError(400, "id is required");

      const { data, error } = await supabaseAdmin
        .from("expense_templates")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("clinic_id", session.clinicId)
        .select("id")
        .maybeSingle();

      if (error) throw new ApiError(500, `Failed to archive template: ${error.message}`);
      if (!data) throw new ApiError(404, "Template not found");

      return NextResponse.json({ success: true, archivedId: id });
    } catch (error) {
      return toErrorResponse(error, "finance/templates DELETE error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES_DELETE }
);
