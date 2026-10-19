import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ApiError, withSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPiastres, toPiastres } from "@/lib/money";
import { computeInvoiceTotals, formatInvoiceNumber, type InvoiceItemType } from "@/lib/finance/invoice";
import { isValidMonthKey, monthBounds } from "@/lib/finance/period";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { wallDate } from "@/lib/schedule/clinicTime";

export const dynamic = "force-dynamic";

const ITEM_TYPES = ["CONSULTATION", "PROCEDURE", "LAB_TEST", "MEDICATION", "REPORT", "OTHER"] as const;

const ItemSchema = z.object({
  itemType: z.enum(ITEM_TYPES).default("OTHER"),
  descriptionAr: z.string().trim().min(1).max(240),
  descriptionEn: z.string().trim().max(240).nullish(),
  quantity: z.number().int().min(1).max(9999).default(1),
  /** EGP — converted to piastres at the boundary. */
  unitPrice: z.number().nonnegative().max(100_000_000),
  appointmentTypeId: z.string().nullish(),
});

const CreateInvoiceSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().nullish(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  items: z.array(ItemSchema).min(1).max(200),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  discountValue: z.number().nonnegative().max(1_000_000_000).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().trim().max(600).nullish(),
  status: z.enum(["DRAFT", "ISSUED"]).default("ISSUED"),
});

const missingTable = (message?: string): boolean =>
  /does not exist|PGRST205|42P01|schema cache/i.test(message || "");

const toDto = (row: Record<string, unknown>) => ({
  id: String(row.id),
  invoiceNumber: String(row.invoice_number ?? ""),
  patientId: String(row.patient_id ?? ""),
  appointmentId: (row.appointment_id as string | null) ?? null,
  issueDate: String(row.issue_date ?? ""),
  dueDate: (row.due_date as string | null) ?? null,
  subtotal: fromPiastres(Number(row.subtotal) || 0),
  discountType: String(row.discount_type ?? "NONE"),
  discountValue: fromPiastres(Number(row.discount_value) || 0),
  discountAmount: fromPiastres(Number(row.discount_amount) || 0),
  taxRate: Number(row.tax_rate) || 0,
  taxAmount: fromPiastres(Number(row.tax_amount) || 0),
  total: fromPiastres(Number(row.total) || 0),
  paidAmount: fromPiastres(Number(row.paid_amount) || 0),
  balanceDue: fromPiastres(Number(row.balance_due) || 0),
  status: String(row.status ?? "ISSUED"),
  notes: (row.notes as string | null) ?? null,
  patient: (row.patients as { name?: string; phone?: string } | null) ?? null,
});

/** GET /api/finance/invoices?month=YYYY-MM — the clinic's invoices. */
export const GET = withSession(
  async (request: Request, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const month = searchParams.get("month");
      const patientId = searchParams.get("patientId");

      let query = supabaseAdmin
        .from("invoices")
        .select("*, patients(name, phone)")
        .eq("clinic_id", session.clinicId)
        .order("issue_date", { ascending: false })
        .limit(200);

      if (patientId) query = query.eq("patient_id", patientId);

      if (month && isValidMonthKey(month)) {
        const timeZone = await getClinicTimezone(session.clinicId);
        const bounds = monthBounds(month, timeZone);
        query = query
          .gte("issue_date", bounds.start.toISOString().slice(0, 10))
          .lt("issue_date", bounds.end.toISOString().slice(0, 10));
      }

      const { data, error } = await query;

      if (error) {
        if (missingTable(error.message)) {
          return NextResponse.json({ success: true, invoices: [], unavailable: true });
        }
        throw new ApiError(500, `Failed to load invoices: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        invoices: ((data as Record<string, unknown>[] | null) || []).map((row) => toDto(row)),
      });
    } catch (error) {
      return toErrorResponse(error, "finance/invoices GET error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_VIEW }
);

/**
 * POST /api/finance/invoices — issue an invoice.
 *
 * Totals are recomputed server-side from the line items: a client that sends
 * its own `total` is ignored, so a forged payload cannot undercharge.
 */
export const POST = withSession(
  async (request: Request, session) => {
    try {
      const body = await request.json();
      const parsed = CreateInvoiceSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid invoice");
      }
      const input = parsed.data;

      const { data: patient, error: patientError } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("id", input.patientId)
        .eq("clinic_id", session.clinicId)
        .maybeSingle();

      if (patientError && !missingTable(patientError.message)) {
        throw new ApiError(500, `Patient lookup failed: ${patientError.message}`);
      }
      if (!patient) throw new ApiError(404, "Patient not found in this clinic");

      const timeZone = await getClinicTimezone(session.clinicId);
      const issueDate =
        input.issueDate || wallDate(new Date(), timeZone);
      const periodKey = issueDate.slice(0, 7);

      const { data: sequence, error: counterError } = await supabaseAdmin.rpc(
        "next_counter_value",
        { p_clinic_id: session.clinicId, p_kind: "INVOICE", p_period_key: periodKey }
      );
      if (counterError) {
        throw new ApiError(
          503,
          "Invoice numbering is unavailable — apply the Phase 2 migration (supabase/migrations/0005_billing_and_finance.sql)."
        );
      }

      const items = input.items.map((item) => ({
        itemType: item.itemType as InvoiceItemType,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn ?? null,
        quantity: item.quantity,
        unitPrice: toPiastres(item.unitPrice),
        appointmentTypeId: item.appointmentTypeId ?? null,
      }));

      const totals = computeInvoiceTotals({
        items,
        discountType: input.discountType,
        discountValue: input.discountType === "FIXED" ? toPiastres(input.discountValue) : input.discountValue,
        taxRate: input.taxRate,
      });

      const invoiceId = `inv-${randomUUID().slice(0, 10)}`;
      const invoiceNumber = formatInvoiceNumber(periodKey, Number(sequence) || 1);

      const { data: invoice, error: insertError } = await supabaseAdmin
        .from("invoices")
        .insert({
          id: invoiceId,
          clinic_id: session.clinicId,
          patient_id: input.patientId,
          appointment_id: input.appointmentId ?? null,
          invoice_number: invoiceNumber,
          issue_date: issueDate,
          due_date: input.dueDate ?? null,
          subtotal: totals.subtotal,
          discount_type: input.discountType,
          discount_value: input.discountType === "FIXED" ? toPiastres(input.discountValue) : input.discountValue,
          discount_amount: totals.discountAmount,
          tax_rate: input.taxRate,
          tax_amount: totals.taxAmount,
          total: totals.total,
          paid_amount: 0,
          balance_due: totals.total,
          status: input.status,
          notes: input.notes ?? null,
          created_by: session.userId,
        })
        .select()
        .single();

      if (insertError) {
        if (missingTable(insertError.message)) {
          throw new ApiError(503, "Invoices table missing — apply migration 0005.");
        }
        throw new ApiError(500, `Failed to create invoice: ${insertError.message}`);
      }

      const itemRows = items.map((item) => ({
        id: `invitem-${randomUUID().slice(0, 8)}`,
        invoice_id: invoiceId,
        clinic_id: session.clinicId,
        item_type: item.itemType,
        description_ar: item.descriptionAr,
        description_en: item.descriptionEn,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.unitPrice * item.quantity,
        appointment_type_id: item.appointmentTypeId,
      }));

      const { error: itemsError } = await supabaseAdmin.from("invoice_items").insert(itemRows);
      if (itemsError && !missingTable(itemsError.message)) {
        // Roll back: an invoice without lines would understate everything.
        await supabaseAdmin.from("invoices").delete().eq("id", invoiceId);
        throw new ApiError(500, `Failed to save invoice lines: ${itemsError.message}`);
      }

      return NextResponse.json({
        success: true,
        invoice: toDto(invoice as unknown as Record<string, unknown>),
        itemsSaved: itemsError ? 0 : itemRows.length,
      });
    } catch (error) {
      return toErrorResponse(error, "finance/invoices POST error:");
    }
  },
  { permission: PERMISSIONS.FINANCE_COLLECT }
);
