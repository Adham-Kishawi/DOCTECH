import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getClinicSession();
    const { searchParams } = new URL(request.url);
    const clinicIdParam = searchParams.get("clinicId");
    const dateFilter = searchParams.get("date"); // "today" | "all" | "YYYY-MM-DD"

    const clinicId = session?.clinicId || clinicIdParam;

    // 1. Fetch appointments that have fees or payments
    let aptQuery = supabase
      .from("appointments")
      .select("*, patients(id, name, phone), doctors(id, name, specialty)")
      .order("date", { ascending: false });

    if (clinicId) {
      aptQuery = aptQuery.eq("clinic_id", clinicId);
    }

    const { data: appointments, error: aptError } = await aptQuery;
    if (aptError) {
      console.warn("Fetch appointments in transactions route warning:", aptError.message);
    }

    // 2. Fetch standalone payment transactions
    let txQuery = supabase
      .from("payment_transactions")
      .select("*, patients(id, name, phone), doctors(id, name, specialty)")
      .order("date", { ascending: false });

    if (clinicId) {
      txQuery = txQuery.eq("clinic_id", clinicId);
    }

    const { data: standaloneTx, error: txError } = await txQuery;
    if (txError) {
      console.warn("Fetch payment_transactions warning (table might be empty or unmigrated):", txError.message);
    }

    // 3. Format appointments into PaymentRecords
    const recordsFromApts = (appointments || []).map((apt: any) => {
      const aptDate = apt.date ? new Date(apt.date) : new Date();
      const isValid = !Number.isNaN(aptDate.getTime());
      const timeStr = isValid
        ? aptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "10:00 AM";
      const dateStr = isValid
        ? aptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Today";

      const totalDue = Number(apt.fee) || 400; // default fee if unassigned
      const amountPaid = Number(apt.amount_paid) || 0;

      return {
        id: apt.id,
        appointmentId: apt.id,
        patientId: apt.patient_id || apt.patients?.id,
        patientName: apt.patients?.name || "Patient",
        patientNameAr: apt.patients?.name || "مريض",
        doctorName: apt.doctors?.name || "Dr. Medical Lead",
        type: apt.type || "Consultation",
        typeAr: apt.type || "كشف",
        date: dateStr,
        time: timeStr,
        rawDate: apt.date,
        totalDue,
        amountPaid,
        paymentMethod: apt.payment_method || "CASH",
        hasBooking: true,
        status: amountPaid >= totalDue ? "PAID" : amountPaid > 0 ? "PARTIAL" : "PENDING",
      };
    });

    // 4. Combine with standalone transactions
    const recordsFromTx = (standaloneTx || []).map((tx: any) => {
      const txDate = tx.date ? new Date(tx.date) : new Date();
      const isValid = !Number.isNaN(txDate.getTime());
      const timeStr = isValid
        ? txDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "12:00 PM";
      const dateStr = isValid
        ? txDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Today";

      return {
        id: tx.id,
        appointmentId: tx.appointment_id,
        patientId: tx.patient_id || tx.patients?.id,
        patientName: tx.patients?.name || "Patient",
        patientNameAr: tx.patients?.name || "مريض",
        doctorName: tx.doctors?.name || "Dr. Medical Lead",
        type: tx.type || "Service",
        typeAr: tx.type || "خدمة طبية",
        date: dateStr,
        time: timeStr,
        rawDate: tx.date,
        totalDue: Number(tx.amount) || 0,
        amountPaid: Number(tx.amount) || 0,
        paymentMethod: tx.payment_method || "CASH",
        hasBooking: Boolean(tx.appointment_id),
        status: tx.status || "PAID",
      };
    });

    // Merge and avoid duplicate IDs
    const seenIds = new Set<string>();
    const allRecords: any[] = [];

    for (const r of [...recordsFromApts, ...recordsFromTx]) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        allRecords.push(r);
      }
    }

    return NextResponse.json({ success: true, transactions: allRecords });
  } catch (error) {
    console.error("GET /api/finance/transactions error:", error);
    return NextResponse.json({ success: true, transactions: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getClinicSession();
    const body = await request.json();

    const clinicId = session?.clinicId || body.clinicId;
    const { appointmentId, patientId, doctorId, amount, paymentMethod, notes } = body;

    const numAmount = Number(amount) || 0;
    const method = paymentMethod || "CASH";

    // 1. If linked to an appointment, update appointment's amount_paid and payment info
    if (appointmentId) {
      const { data: apt } = await supabase
        .from("appointments")
        .select("amount_paid, fee")
        .eq("id", appointmentId)
        .maybeSingle();

      const currentPaid = Number(apt?.amount_paid) || 0;
      const totalDue = Number(apt?.fee) || numAmount;
      const newPaid = Math.min(totalDue, currentPaid + numAmount);

      await supabase
        .from("appointments")
        .update({
          amount_paid: newPaid,
          payment_method: method,
          payment_date: new Date().toISOString(),
          payment_notes: notes || null,
        })
        .eq("id", appointmentId);
    }

    // 2. Also try recording in payment_transactions table
    const txId = `TX-${Date.now().toString().slice(-6)}`;
    const txPayload = {
      id: txId,
      clinic_id: clinicId,
      doctor_id: doctorId || session?.user?.id,
      patient_id: patientId,
      appointment_id: appointmentId || null,
      type: body.type || "CONSULTATION",
      amount: numAmount,
      payment_method: method,
      status: "PAID",
      date: new Date().toISOString(),
      notes: notes || null,
      recorded_by_role: session?.role || "secretary",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("payment_transactions")
      .insert(txPayload)
      .select()
      .single();

    if (insertError) {
      console.warn("payment_transactions insert notice/fallback:", insertError.message);
    }

    return NextResponse.json({
      success: true,
      transaction: inserted || txPayload,
    });
  } catch (error) {
    console.error("POST /api/finance/transactions error:", error);
    return NextResponse.json({ success: false, error: "Failed to record transaction" }, { status: 500 });
  }
}
