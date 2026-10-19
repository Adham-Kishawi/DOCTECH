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

const RefundSchema = z.object({
  /** EGP to return. Always positive. */
  amount: z.number().positive().max(100_000_000),
  reason: z.string().trim().max(300).optional(),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "INSURANCE"]).default("CASH"),
  reference: z.string().trim().max(80).optional(),
});

/**
 * POST /api/finance/invoices/[id]/refund — issue a refund (plan §5.5.3).
 *
 * Three invariants: the amount can never exceed what was actually paid, the
 * refund row and the negative-direction transaction are written together, and
 * the invoice status follows the remaining balance instead of being typed in.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.FINANCE_PAYMENTS });

    const raw = await request.json();
    const parsed = RefundSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid refund");
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

    const total = Number(invoice.total) || 0;
    const paid = Number(invoice.paid_amount) || 0;
    const refundPiastres = toPiastres(parsed.data.amount);

    if (refundPiastres > paid) {
      throw new ApiError(409, "Refund exceeds the amount already paid on this invoice");
    }

    let doctorId = session.role === "doctor" ? session.user.id : null;
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

    const now = new Date().toISOString();
    const newPaid = paid - refundPiastres;
    const newStatus = newPaid <= 0 ? "REFUNDED" : statusFor(total, newPaid);

    const refundId = `ref-${randomUUID().slice(0, 10)}`;
    const { error: refundError } = await supabaseAdmin.from("refunds").insert({
      id: refundId,
      clinic_id: session.clinicId,
      invoice_id: id,
      patient_id: invoice.patient_id,
      amount: refundPiastres,
      reason: parsed.data.reason ?? null,
      method: parsed.data.method,
      refund_reference: parsed.data.reference ?? null,
      approved_by: session.userId,
      approved_at: now,
      created_by: session.userId,
    });

    if (refundError) {
      if (missingTable(refundError.message)) {
        throw new ApiError(503, "Refunds table missing — apply migration 0005.");
      }
      throw new ApiError(500, `Failed to record refund: ${refundError.message}`);
    }

    const { error: txError } = await supabaseAdmin.from("payment_transactions").insert({
      id: `txref-${randomUUID().slice(0, 10)}`,
      clinic_id: session.clinicId,
      doctor_id: doctorId,
      patient_id: invoice.patient_id,
      appointment_id: (invoice.appointment_id as string | null) ?? null,
      invoice_id: id,
      type: "REFUND",
      // Positive amount + is_refund: direction lives in the flag (§5.5.3),
      // so SUM(amount) keeps a single meaning everywhere.
      amount: refundPiastres,
      payment_method: parsed.data.method,
      status: "REFUNDED",
      is_refund: true,
      notes: parsed.data.reason || `Refund for ${invoice.invoice_number}`,
      recorded_by_role: session.role,
    });
    if (txError && !missingTable(txError.message)) {
      await supabaseAdmin.from("refunds").delete().eq("id", refundId);
      throw new ApiError(500, `Failed to record refund transaction: ${txError.message}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        paid_amount: newPaid,
        balance_due: Math.max(0, total - newPaid),
        status: newStatus,
        updated_at: now,
      })
      .eq("id", id)
      .eq("clinic_id", session.clinicId);
    if (updateError) {
      throw new ApiError(500, `Failed to update invoice: ${updateError.message}`);
    }

    // Money leaving the drawer must show up in the open session.
    if (parsed.data.method === "CASH") {
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
          direction: "OUT",
          amount: refundPiastres,
          category: "REFUND",
          reference_type: "invoice",
          reference_id: id,
          recorded_by: session.userId,
        });
        if (movementError && !missingTable(movementError.message)) {
          console.error("[refund] cash movement failed:", movementError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refundId,
        amount: fromPiastres(refundPiastres),
        approvedBy: session.userId,
        createdAt: now,
      },
      invoice: {
        id,
        paidAmount: fromPiastres(newPaid),
        balanceDue: fromPiastres(Math.max(0, total - newPaid)),
        status: newStatus,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "invoice refund error:");
  }
}
