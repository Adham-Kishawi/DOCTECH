import { describe, expect, it, vi, beforeEach } from "vitest";

interface ChainState {
  table: string;
  op: string;
  payload?: unknown;
  opts?: unknown;
  filters: [string, unknown][];
}

type Handler = (state: ChainState) => { data?: unknown; error?: { message: string; code?: string } | null };

const h = vi.hoisted(() => ({
  handler: (() => ({ data: null, error: null })) as Handler,
}));

vi.mock("@/lib/supabaseAdmin", () => {
  const builder = (table: string) => {
    const state: ChainState = { table, op: "select", filters: [] };
    const chain: Record<string, unknown> = {};
    chain.select = () => {
      state.op = "select";
      return chain;
    };
    chain.eq = (col: string, val: unknown) => {
      state.filters.push([col, val]);
      return chain;
    };
    chain.order = () => chain;
    chain.insert = (payload: unknown) => {
      state.op = "insert";
      state.payload = payload;
      return chain;
    };
    chain.update = (payload: unknown) => {
      state.op = "update";
      state.payload = payload;
      return chain;
    };
    chain.upsert = (payload: unknown, opts: unknown) => {
      state.op = "upsert";
      state.payload = payload;
      state.opts = opts;
      return chain;
    };
    chain.single = () => chain;
    chain.maybeSingle = () => chain;
    chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(h.handler(state)).then(resolve, reject);
    return chain;
  };

  return {
    supabaseAdmin: {
      from: (table: string) => builder(table),
      rpc: (fn: string, args: unknown) => ({
        then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(h.handler({ table: "rpc", op: fn, payload: args, filters: [] })).then(resolve, reject),
      }),
    },
  };
});

import { runExpenseTemplates, loadFixedCostBreakdown } from "@/lib/finance/templates";

const baseTemplate = (over: Record<string, unknown> = {}) => ({
  id: "t1",
  clinic_id: "clinic-1",
  category_id: null,
  title_en: "Clinic Rent",
  title_ar: "إيجار العيادة",
  amount: 500_000,
  frequency: "MONTHLY",
  due_day_of_month: 1,
  weekday: null,
  start_date: null,
  end_date: null,
  payment_method: "BANK_TRANSFER",
  payee: null,
  contract_ref: null,
  posting_mode: "AUTO",
  accounting_basis: "CASH",
  last_posted_period: null,
  next_due_at: null,
  is_active: true,
  ...over,
});

let inserted: Record<string, unknown>[] = [];
let updated: Record<string, unknown>[] = [];

beforeEach(() => {
  inserted = [];
  updated = [];
  h.handler = () => ({ data: null, error: null });
});

describe("finance/templates — idempotent recurring-expense runner", () => {
  it("posts due AUTO templates once and records the period on the template", async () => {
    let rpcCalled = false;
    h.handler = (s) => {
      if (s.table === "expense_templates" && s.op === "select") return { data: [baseTemplate({ id: "t1" })], error: null };
      if (s.table === "rpc") {
        rpcCalled = true;
        return { data: 7, error: null };
      }
      if (s.table === "expenses") {
        inserted.push(s.payload as Record<string, unknown>);
        return { error: null };
      }
      if (s.table === "expense_templates" && s.op === "update") {
        updated.push(s.payload as Record<string, unknown>);
        return { error: null };
      }
      return { data: null, error: null };
    };

    const result = await runExpenseTemplates({ clinicId: "clinic-1", periodKey: "2026-10" });

    expect(rpcCalled).toBe(true);
    expect(result.posted).toHaveLength(1);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      source_template_id: "t1",
      period_key: "2026-10",
      amount: 500_000,
      category: "MISC",
      expense_number: "EXP-2026-10-00007",
      recorded_by_role: "system",
    });
    expect(updated[0]).toMatchObject({ last_posted_period: "2026-10" });
    expect(typeof updated[0].next_due_at).toBe("string");
  });

  it("skips a template already posted for the period (idempotent, no writes)", async () => {
    let wrote = false;
    h.handler = (s) => {
      if (s.table === "expense_templates" && s.op === "select")
        return { data: [baseTemplate({ id: "t1", last_posted_period: "2026-10" })], error: null };
      wrote = true;
      return { data: null, error: null };
    };

    const result = await runExpenseTemplates({ clinicId: "clinic-1", periodKey: "2026-10" });

    expect(result.posted).toHaveLength(0);
    expect(result.skipped).toEqual([{ templateId: "t1", reason: "ALREADY_POSTED" }]);
    expect(wrote).toBe(false);
  });

  it("classifies inactive, manual and not-due templates", async () => {
    h.handler = (s) => {
      if (s.table === "expense_templates" && s.op === "select")
        return {
          data: [
            baseTemplate({ id: "inactive", is_active: false }),
            baseTemplate({ id: "manual", posting_mode: "MANUAL" }),
            baseTemplate({ id: "quarterly", frequency: "QUARTERLY" }),
          ],
          error: null,
        };
      return { data: null, error: null };
    };

    const result = await runExpenseTemplates({ clinicId: "clinic-1", periodKey: "2026-11" });

    expect(result.skipped).toEqual(
      expect.arrayContaining([
        { templateId: "inactive", reason: "INACTIVE" },
        { templateId: "manual", reason: "MANUAL" },
        { templateId: "quarterly", reason: "NOT_DUE" }, // Nov: month 11 % 3 !== 1
      ])
    );
    expect(result.posted).toHaveLength(0);
  });

  it("queues CONFIRM-mode templates as pending instead of posting", async () => {
    let pendingPayload: Record<string, unknown> | null = null;
    h.handler = (s) => {
      if (s.table === "expense_templates" && s.op === "select")
        return { data: [baseTemplate({ id: "t1", posting_mode: "CONFIRM" })], error: null };
      if (s.table === "pending_expenses") {
        pendingPayload = s.payload as Record<string, unknown>;
        return { error: null };
      }
      return { data: null, error: null };
    };

    const result = await runExpenseTemplates({ clinicId: "clinic-1", periodKey: "2026-10" });

    expect(result.posted).toHaveLength(0);
    expect(result.pending).toEqual([{ templateId: "t1", amount: 500_000 }]);
    expect(pendingPayload).toMatchObject({ template_id: "t1", period_key: "2026-10", status: "PENDING" });
  });

  it("reports unavailable when the migration has not been applied", async () => {
    h.handler = (s) => {
      if (s.table === "expense_templates" && s.op === "select")
        return { data: null, error: { code: "42P01", message: "relation \"expense_templates\" does not exist" } };
      return { data: null, error: null };
    };

    const result = await runExpenseTemplates({ clinicId: "clinic-1", periodKey: "2026-10" });

    expect(result.unavailable).toBe(true);
    expect(result.posted).toHaveLength(0);
  });
});

describe("finance/templates — amortized fixed-cost schedule", () => {
  it("converts each cadence to a monthly figure and sorts by weight", async () => {
    h.handler = (s) => {
      if (s.table === "expense_templates" && s.op === "select")
        return {
          data: [
            baseTemplate({ id: "annual", frequency: "ANNUAL", amount: 1_200_000 }),
            baseTemplate({ id: "quarterly", frequency: "QUARTERLY", amount: 300_000 }),
            baseTemplate({ id: "monthly", frequency: "MONTHLY", amount: 50_000 }),
            baseTemplate({ id: "weekly", frequency: "WEEKLY", amount: 40_000 }),
          ],
          error: null,
        };
      if (s.table === "fixed_cost_breakdown")
        return { data: [{ template_id: "annual", variability_pct: 15 }], error: null };
      return { data: null, error: null };
    };

    const { rows, monthlyTotal } = await loadFixedCostBreakdown("clinic-1");

    const byId = Object.fromEntries(rows.map((r) => [r.templateId, r]));
    expect(byId.annual.monthlyPiastres).toBe(100_000); // 1.2M ÷ 12
    expect(byId.quarterly.monthlyPiastres).toBe(100_000); // 300k ÷ 3
    expect(byId.monthly.monthlyPiastres).toBe(50_000);
    expect(byId.weekly.monthlyPiastres).toBe(10_000); // 40k ÷ 4
    expect(byId.annual.variabilityPct).toBe(15);
    expect(monthlyTotal).toBe(260_000);
    expect(rows[0].monthlyPiastres).toBeGreaterThanOrEqual(rows[rows.length - 1].monthlyPiastres);
  });

  it("degrades to an unavailable empty schedule before the migration runs", async () => {
    h.handler = (s) => {
      if (s.table === "expense_templates")
        return { data: null, error: { code: "PGRST205", message: "Could not find the table" } };
      return { data: null, error: null };
    };

    const result = await loadFixedCostBreakdown("clinic-1");
    expect(result.unavailable).toBe(true);
    expect(result.rows).toHaveLength(0);
    expect(result.monthlyTotal).toBe(0);
  });
});
