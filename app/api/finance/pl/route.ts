import { NextResponse } from "next/server";
import { withSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPiastres } from "@/lib/money";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { wallDate } from "@/lib/schedule/clinicTime";
import { isValidMonthKey, monthBounds, previousMonthKey } from "@/lib/finance/period";
import { computeProfitAndLoss, pnlAlerts, type PlExpenseLine, type PlRevenueLine } from "@/lib/finance/pl";
import { computeBreakEven, DEFAULT_WORKING_DAYS } from "@/lib/finance/breakEven";
import { loadFixedCostBreakdown } from "@/lib/finance/templates";
import { SYSTEM_CATEGORY_BY_CODE, type BehaviorType } from "@/lib/finance/expenseCategories";
import { monthLabel } from "@/lib/finance/invoice";

export const dynamic = "force-dynamic";

const missing = (error: { message?: string } | null): boolean =>
  Boolean(error && /does not exist|PGRST205|42P01|schema cache/i.test(error.message || ""));

const consultationSignal = /(كشف|كشفية|موعد|استشارة|متابعة|consult|visit|appointment|follow)/i;

function revenueGroupFor(typeName: string | null | undefined, typeCode: string | null | undefined): {
  groupEn: string;
  groupAr: string;
  isConsultation: boolean;
} {
  const label = (typeName || "").trim();
  if (!label) {
    return { groupEn: "Consultations", groupAr: "الكشوفات والاستشارات", isConsultation: true };
  }
  const isConsultation = consultationSignal.test(label) || !typeCode;
  return {
    groupEn: label,
    groupAr: label,
    isConsultation,
  };
}

const toEgp = (piastres: number): number => fromPiastres(piastres);

/**
 * GET /api/finance/pl?month=YYYY-MM — the rebuilt P&L (plan §5.4).
 *
 * Every figure below is a sum over rows the clinic actually recorded:
 * appointments → revenue, expenses (by category behavior) → COGS / fixed /
 * variable, invoices → discounts, refunds → refunds. Nothing is interpolated,
 * split by a default percentage, or carried over from a previous version of
 * this screen (E10/E11/E13).
 */
export const GET = withSession(
  async (request: Request, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const clinicId = session.clinicId;
      const timeZone = await getClinicTimezone(clinicId);

      const month = searchParams.get("month") || wallDate(new Date(), timeZone).slice(0, 7);
      if (!isValidMonthKey(month)) {
        return NextResponse.json({ success: false, error: "month must be YYYY-MM" }, { status: 400 });
      }

      const bounds = monthBounds(month, timeZone);
      const previousMonth = previousMonthKey(month);
      const prevBounds = monthBounds(previousMonth, timeZone);

      const [appointmentsRes, expensesRes, invoicesRes, refundsRes, categoriesRes, prevAppointmentsRes, prevExpensesRes] =
        await Promise.all([
          supabaseAdmin
            .from("appointments")
            .select("id, date, fee, amount_paid, type, appointment_type_id, appointment_types(name)")
            .eq("clinic_id", clinicId)
            .gte("date", bounds.start.toISOString())
            .lt("date", bounds.end.toISOString()),
          supabaseAdmin
            .from("expenses")
            .select("id, amount, category, category_id, behavior_type_snapshot, date, period_key")
            .eq("clinic_id", clinicId)
            .gte("date", bounds.start.toISOString())
            .lt("date", bounds.end.toISOString()),
          supabaseAdmin
            .from("invoices")
            .select("id, discount_amount, status, issue_date")
            .eq("clinic_id", clinicId)
            .gte("issue_date", bounds.start.toISOString().slice(0, 10))
            .lt("issue_date", bounds.end.toISOString().slice(0, 10)),
          supabaseAdmin
            .from("refunds")
            .select("id, amount")
            .eq("clinic_id", clinicId)
            .gte("created_at", bounds.start.toISOString())
            .lt("created_at", bounds.end.toISOString()),
          supabaseAdmin
            .from("expense_categories")
            .select("id, code, name_en, name_ar, behavior_type, is_clinical_cost")
            .or(`clinic_id.is.null,clinic_id.eq.${clinicId}`),
          supabaseAdmin
            .from("appointments")
            .select("id, amount_paid")
            .eq("clinic_id", clinicId)
            .gte("date", prevBounds.start.toISOString())
            .lt("date", prevBounds.end.toISOString()),
          supabaseAdmin
            .from("expenses")
            .select("id, amount")
            .eq("clinic_id", clinicId)
            .gte("date", prevBounds.start.toISOString())
            .lt("date", prevBounds.end.toISOString()),
        ]);

      const appointments = appointmentsRes.error ? [] : appointmentsRes.data || [];
      const expenseRows = expensesRes.error ? [] : expensesRes.data || [];
      const invoiceRows = missing(invoicesRes.error) ? [] : invoicesRes.error ? [] : invoicesRes.data || [];
      const refundRows = missing(refundsRes.error) ? [] : refundsRes.error ? [] : refundsRes.data || [];
      const prevAppointments = prevAppointmentsRes.data || [];
      const prevExpenses = prevExpensesRes.data || [];

      if (appointmentsRes.error && !missing(appointmentsRes.error)) {
        console.error("[finance/pl] appointments:", appointmentsRes.error.message);
      }
      if (expensesRes.error && !missing(expensesRes.error)) {
        console.error("[finance/pl] expenses:", expensesRes.error.message);
      }

      const categoryById = new Map<string, { code: string; nameEn: string; nameAr: string; behavior: BehaviorType; isClinical: boolean }>();
      if (!categoriesRes.error) {
        for (const row of categoriesRes.data || []) {
          categoryById.set(String(row.id), {
            code: String(row.code),
            nameEn: String(row.name_en),
            nameAr: String(row.name_ar),
            behavior: (row.behavior_type as BehaviorType) || "VARIABLE",
            isClinical: Boolean(row.is_clinical_cost),
          });
        }
      }

      // --- Revenue -----------------------------------------------------------
      const revenueLines: PlRevenueLine[] = appointments.map((appointment) => {
        const joined = appointment.appointment_types as { name?: string } | null;
        const group = revenueGroupFor(appointment.type || joined?.name || null, appointment.appointment_type_id);
        return {
          id: String(appointment.id),
          amount: Math.max(0, Math.round((Number(appointment.amount_paid) || 0) * 100)),
          ...group,
        };
      });

      const visitCount = revenueLines.filter((line) => line.amount > 0).length || appointments.length;

      // --- Expenses ----------------------------------------------------------
      const expenseLines: PlExpenseLine[] = expenseRows.map((row) => {
        const category = row.category_id ? categoryById.get(String(row.category_id)) : undefined;
        const byCode = category || SYSTEM_CATEGORY_BY_CODE[String(row.category || "")];
        return {
          id: String(row.id),
          amount: Math.abs(Number(row.amount) || 0),
          behavior:
            ((row.behavior_type_snapshot as BehaviorType | null) ?? byCode?.behavior ?? "VARIABLE"),
          isClinicalCost: category?.isClinical ?? SYSTEM_CATEGORY_BY_CODE[String(row.category || "")]?.isClinicalCost ?? false,
          categoryCode: category?.code ?? (row.category as string | null) ?? "MISC",
          labelEn: category?.nameEn ?? String(row.category || "MISC"),
          labelAr: category?.nameAr ?? String(row.category || "متنوع"),
        };
      });

      const discounts = invoiceRows.reduce((sum, row) => sum + (Number(row.discount_amount) || 0), 0);
      const refunds = refundRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

      const pl = computeProfitAndLoss({ revenueLines, expenseLines, discounts, refunds });

      // --- Fixed cost schedule + break-even ----------------------------------
      const fixedCosts = await loadFixedCostBreakdown(clinicId);
      const fixedMonthly =
        fixedCosts.monthlyTotal > 0
          ? fixedCosts.monthlyTotal
          : pl.fixedOverhead.total; // fall back to what was actually posted

      const breakEven = computeBreakEven({
        revenue: pl.revenue.gross,
        visits: visitCount,
        cogs: pl.cogs.total,
        fixedMonthly,
        workingDays: DEFAULT_WORKING_DAYS,
      });

      // --- Month-over-month (same code path, previous month) -----------------
      const prevRevenue = prevAppointments.reduce(
        (sum, row) => sum + Math.max(0, Math.round((Number(row.amount_paid) || 0) * 100)),
        0
      );
      const prevExpenseTotal = prevExpenses.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

      const delta = (current: number, previous: number): number | null =>
        previous > 0 ? Number((((current - previous) / previous) * 100).toFixed(1)) : null;

      const payload = {
        month,
        monthLabel: monthLabel(month),
        monthLabelAr: monthLabel(month, "ar"),
        timeZone,
        currency: "EGP",
        revenue: {
          groups: pl.revenue.groups.map((group) => ({ ...group, amount: toEgp(group.amount) })),
          discounts: toEgp(pl.revenue.discounts),
          refunds: toEgp(pl.revenue.refunds),
          gross: toEgp(pl.revenue.gross),
        },
        cogs: {
          items: pl.cogs.items.map((item) => ({ ...item, amount: toEgp(item.amount) })),
          total: toEgp(pl.cogs.total),
        },
        grossProfit: toEgp(pl.grossProfit),
        grossMarginPct: pl.grossMarginPct,
        fixedOverhead: {
          items: pl.fixedOverhead.items.map((item) => ({ ...item, amount: toEgp(item.amount) })),
          total: toEgp(pl.fixedOverhead.total),
        },
        variableOpex: {
          items: pl.variableOpex.items.map((item) => ({ ...item, amount: toEgp(item.amount) })),
          total: toEgp(pl.variableOpex.total),
        },
        capex: {
          items: pl.capex.items.map((item) => ({ ...item, amount: toEgp(item.amount) })),
          total: toEgp(pl.capex.total),
        },
        totalOperatingExpenses: toEgp(pl.totalOperatingExpenses),
        netProfit: toEgp(pl.netProfit),
        netMarginPct: pl.netMarginPct,
        totalExpensesAll: toEgp(pl.totalExpensesAll),
        analysis: {
          visits: visitCount,
          avgRevenuePerVisit: breakEven.avgRevenuePerVisit === null ? null : toEgp(breakEven.avgRevenuePerVisit),
          directCostPerVisit: breakEven.directCostPerVisit === null ? null : toEgp(breakEven.directCostPerVisit),
          contributionPerVisit: breakEven.contributionPerVisit === null ? null : toEgp(breakEven.contributionPerVisit),
          contributionMarginPct: breakEven.contributionMarginPct,
          fixedMonthly: toEgp(fixedMonthly),
          breakEvenVisits: breakEven.breakEvenVisits,
          breakEvenVisitsPerDay: breakEven.breakEvenVisitsPerDay,
          workingDays: breakEven.workingDays,
          computable: breakEven.computable,
          reason: breakEven.reason ?? null,
          /** Labeled assumption, not a measured figure. */
          basis: "fixed cost schedule (templates) or posted fixed expenses",
        },
        fixedCostTable: fixedCosts.rows.map((row) => ({
          templateId: row.templateId,
          titleEn: row.titleEn,
          titleAr: row.titleAr,
          categoryCode: row.categoryCode,
          behavior: row.behavior,
          frequency: row.frequency,
          amount: toEgp(row.amountPiastres),
          monthly: toEgp(row.monthlyPiastres),
          variabilityPct: row.variabilityPct,
        })),
        comparison: {
          previousMonth,
          revenueGrowthPct: delta(pl.revenue.gross, prevRevenue),
          expenseGrowthPct: delta(pl.totalExpensesAll, prevExpenseTotal),
        },
        alerts: pnlAlerts(pl),
        dataSources: {
          appointments: appointments.length,
          expenseRows: expenseRows.length,
          invoiceRows: invoiceRows.length,
          refundRows: refundRows.length,
          fixedCostTemplates: fixedCosts.rows.length,
        },
      };

      return NextResponse.json({ success: true, pl: payload });
    } catch (error) {
      return toErrorResponse(error, "finance/pl GET error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_PROFIT }
);
