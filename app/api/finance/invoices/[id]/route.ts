import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ApiError, toErrorResponse, requireSession, PERMISSIONS } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromPiastres, toPiastres } from "@/lib/money";
import { statusFor } from "@/lib/finance/invoice";

export const dynamic = "force-dynamic";

const missingTable = (message?: string): boolean =>
  /does not exist|PGRST205|42P01|schema cache/i.test(message || "");

const PatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("PAYMENT"),
    /** EGP received. */
    amount: z.number().positive().max(100_000_000),
    paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "INSURANCE"]).default("CASH"),
    reference: z.string().trim().max(80).nullish(),
    notes: z.string().trim().max(300).nullish(),
  }),
  z.object({ action: z.literal("CANCEL") }),
  z.object({
    action: z.literal("NOTE"),
    notes: z.string().trim().max(600),
  }),
]);

const invoiceDto = (row: Record<string, unknown>) => ({
  id: String(row.id),
  invoiceNumber: String(row.invoice_number ?? ""),
  patientId: String(row.patient_id ?? ""),
  appointmentId: (row.appointment_id as string | null) ?? null,
  issueDate: String(row.issue_date ?? ""),
  dueDate: (row.due_date as string | null) ?? null,
  subtotal: fromPiastres(Number(row.subtotal) || 0),
  discountType: String(row.discount_type ?? "NONE"),
  discountAmount: fromPiastres(Number(row.discount_amount) || 0),
  taxRate: Number(row.tax_rate) || 0,
  taxAmount: fromPiastres(Number(row.tax_amount) || 0),
  total: fromPiastres(Number(row.total) || 0),
  paidAmount: fromPiastres(Number(row.paid_amount) || 0),
  balanceDue: fromPiastres(Number(row.balance_due) || 0),
  status: String(row.status ?? "ISSUED"),
  notes: (row.notes as string | null) ?? null,
});

/** GET /api/finance/invoices/[id] — invoice header, lines and payments. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.FINANCE_VIEW });

    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("*, patients(name, phone)")
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (error) {
      if (missingTable(error.message)) throw new ApiError(503, "Invoices table missing — apply migration 0005.");
      throw new ApiError(500, `Failed to load invoice: ${error.message}`);
    }
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const [{ data: items }, { data: payments }, { data: refunds }] = await Promise.all([
      supabaseAdmin.from("invoice_items").select("*").eq("invoice_id", id).order("created_at"),
      supabaseAdmin
        .from("payment_transactions")
        .select("*")
        .eq("invoice_id", id)
        .eq("clinic_id", session.clinicId)
        .order("date", { ascending: false }),
      supabaseAdmin.from("refunds").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      success: true,
      invoice: invoiceDto(invoice as unknown as Record<string, unknown>),
      patient: invoice.patients ?? null,
      items: (items || []).map((row) => ({
        id: String(row.id),
        itemType: String(row.item_type),
        descriptionAr: String(row.description_ar ?? ""),
        descriptionEn: (row.description_en as string | null) ?? null,
        quantity: Number(row.quantity) || 1,
        unitPrice: fromPiastres(Number(row.unit_price) || 0),
        lineTotal: fromPiastres(Number(row.line_total) || 0),
      })),
      payments: (payments || []).map((row) => ({
        id: String(row.id),
        amount: fromPiastres(Number(row.amount) || 0),
        isRefund: Boolean(row.is_refund),
        method: String(row.payment_method ?? "CASH"),
        date: String(row.date ?? ""),
        notes: (row.notes as string | null) ?? null,
      })),
      refunds: (refunds || []).map((row) => ({
        id: String(row.id),
        amount: fromPiastres(Number(row.amount) || 0),
        reason: (row.reason as string | null) ?? null,
        approvedBy: (row.approved_by as string | null) ?? null,
        createdAt: String(row.created_at ?? ""),
      })),
    });
  } catch (error) {
    return toErrorResponse(error, "finance/invoices/[id] GET error:");
  }
}

/**
 * PATCH /api/finance/invoices/[id] — record a payment, cancel, or amend notes.
 * The write is guarded by a re-read: two clerks paying the same invoice
 * serially can never push `paid_amount` past `total`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.FINANCE_PAYMENTS });

    const raw = await request.json();
    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid action");
    }

    const { data: invoice, error: loadError } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (loadError) {
      if (missingTable(loadError.message)) throw new ApiError(503, "Invoices table missing — apply migration 0005.");
      throw new ApiError(500, `Failed to load invoice: ${loadError.message}`);
    }
    if (!invoice) throw new ApiError(404, "Invoice not found");

    const currentStatus = String(invoice.status);
    if (currentStatus === "CANCELLED" || currentStatus === "REFUNDED") {
      throw new ApiError(409, `Invoice is ${currentStatus} and cannot be changed`);
    }

    const action = parsed.data.action;

    if (action === "CANCEL") {
      if (Number(invoice.paid_amount) > 0) {
        throw new ApiError(409, "Invoice already has payments — issue a refund instead");
      }
      const { error: cancelError } = await supabaseAdmin
        .from("invoices")
        .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("clinic_id", session.clinicId);
      if (cancelError) throw new ApiError(500, `Failed to cancel: ${cancelError.message}`);

      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    if (action === "NOTE") {
      const { error: noteError } = await supabaseAdmin
        .from("invoices")
        .update({ notes: parsed.data.notes, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("clinic_id", session.clinicId);
      if (noteError) throw new ApiError(500, `Failed to save note: ${noteError.message}`);
      return NextResponse.json({ success: true, notes: parsed.data.notes });
    }

    // --- PAYMENT ------------------------------------------------------------
    const paymentPiastres = toPiastres(parsed.data.amount);
    const total = Number(invoice.total) || 0;
    const paid = Number(invoice.paid_amount) || 0;
    const applied = Math.min(paymentPiastres, Math.max(0, total - paid));
    if (applied <= 0) throw new ApiError(409, "Invoice is already fully paid");

    const newPaid = paid + applied;
    const status = statusFor(total, newPaid);
    const balanceDue = Math.max(0, total - newPaid);

    // payment_transactions.doctor_id is NOT NULL: resolve the real doctor
    // (never the Clerk user id) from the appointment, the caller, or the clinic.
    let doctorId = session.role === "doctor" ? session.user.id : null;
    if (!doctorId && invoice.appointment_id) {
      const { data: appointment } = await supabaseAdmin
        .from("appointments")
        .select("doctor_id")
        .eq("id", String(invoice.appointment_id))
        .maybeSingle();
      doctorId = appointment?.doctor_id ?? null;
    }
    if (!doctorId) {
      const { data: doctor } = await supabaseAdmin
        .from("doctors")
        .select("id")
        .eq("clinic_id", session.clinicId)
        .limit(1)
        .maybeSingle();
      doctorId = doctor?.id ?? null;
    }
    if (!doctorId) throw new ApiError(409, "No doctor record exists for this clinic yet");

    const transactionId = `pay-${randomUUID().slice(0, 10)}`;
    const { error: txError } = await supabaseAdmin.from("payment_transactions").insert({
      id: transactionId,
      clinic_id: session.clinicId,
      doctor_id: doctorId,
      patient_id: invoice.patient_id,
      appointment_id: (invoice.appointment_id as string | null) ?? null,
      invoice_id: id,
      type: "INVOICE_PAYMENT",
      amount: applied,
      payment_method: parsed.data.paymentMethod,
      status: "PAID",
      is_refund: false,
      notes: parsed.data.notes || `Payment for ${invoice.invoice_number}`,
      recorded_by_role: session.role,
    });

    if (txError) {
      if (missingTable(txError.message)) {
        // invoices exist but payment_transactions columns do not: still keep
        // the invoice truthful rather than pretending the money arrived.
        throw new ApiError(503, "payment_transactions is missing invoice columns — apply migration 0005.");
      }
      throw new ApiError(500, `Failed to record payment: ${txError.message}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        paid_amount: newPaid,
        balance_due: balanceDue,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("clinic_id", session.clinicId);

    if (updateError) {
      throw new ApiError(500, `Failed to update invoice: ${updateError.message}`);
    }

    // Cash payments land in the open drawer automatically, if one is open.
    if (parsed.data.paymentMethod === "CASH") {
      const { data: openSession } = await supabaseAdmin
        .from("cash_sessions")
        .select("id")
        .eq("clinic_id", session.clinicId)
        .eq("status", "OPEN")
        .maybeSingle();

      if (openSession) {
        const { error: movementError } = await supabaseAdmin.from("cash_movements").insert({
          id: `cm-${randomUUID().slice(0, 10)}`,
          cash_session_id: openSession.id,
          clinic_id: session.clinicId,
          direction: "IN",
          amount: applied,
          category: "PAYMENT",
          reference_type: "invoice",
          reference_id: id,
          recorded_by: session.userId,
        });
        if (movementError && !missingTable(movementError.message)) {
          console.error("[invoice-payment] cash movement failed:", movementError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id,
        paidAmount: fromPiastres(newPaid),
        balanceDue: fromPiastres(balanceDue),
        status,
        appliedAmount: fromPiastres(applied),
      },
      transactionId,
    });
  } catch (error) {
    return toErrorResponse(error, "finance/invoices/[id] PATCH error:");
  }
}
