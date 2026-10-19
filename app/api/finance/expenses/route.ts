import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { withSession, PERMISSIONS } from "@/lib/apiAuth";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { clinicCalendarDate, formatInClinicZone } from "@/lib/schedule/clinicTime";
import { fromPiastres, toPiastres } from "@/lib/money";

export const dynamic = "force-dynamic";

/** True when a stored value carries a clock time rather than being a date. */
const isInstant = (v: unknown) =>
  typeof v === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(v.trim());

export const GET = withSession(
  async (request: Request, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const month = searchParams.get("month"); // "YYYY-MM"

      // Tenant comes from the session ONLY — never from the query string.
      const clinicId = session.clinicId;
      const timeZone = await getClinicTimezone(clinicId);

      let query = supabase
        .from("expenses")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("date", { ascending: false });

      if (month) {
        const startOfMonth = `${month}-01T00:00:00.000Z`;
        // Calculate end of month
        const [yearStr, monthStr] = month.split("-");
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10);
        const nextMonth = m === 12 ? new Date(year + 1, 0, 1) : new Date(year, m, 1);
        const endOfMonth = nextMonth.toISOString();

        query = query.gte("date", startOfMonth).lt("date", endOfMonth);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Expenses query failed:", error.message);
        return NextResponse.json({ success: false, error: "Failed to load expenses" }, { status: 500 });
      }

      // A date-only value ("2026-10-06") carries no time. Treating it as a UTC
      // instant and rendering in the clinic's zone would surface 02:00 as the
      // expense time, so date-only rows keep the route's existing default.
      const formatted = (data || []).map((e: any) => ({
        id: e.id,
        category: e.category,
        categoryNameEn: e.category,
        categoryNameAr: e.category,
        titleEn: e.title,
        titleAr: e.title_ar || e.title,
        // Stored as integer piastres; the UI works in EGP.
        amount: fromPiastres(Number(e.amount) || 0),
        date: clinicCalendarDate(e.date, timeZone, e.date || ""),
        time:
          e.date && isInstant(e.date)
            ? formatInClinicZone(
                e.date,
                timeZone,
                { hour: "2-digit", minute: "2-digit" },
                "en-US",
                "12:00 PM"
              )
            : "12:00 PM",
        paymentMethod: e.payment_method || "CASH",
        paidTo: e.paid_to || "",
        receiptNo: e.receipt_no || "",
        notes: e.notes || "",
        isRecurring: Boolean(e.is_recurring),
        recordedByRole: e.recorded_by_role || "doctor",
      }));

      return NextResponse.json({ success: true, expenses: formatted });
    } catch (error) {
      console.error("GET /api/finance/expenses error:", error);
      return NextResponse.json({ success: false, error: "Failed to load expenses" }, { status: 500 });
    }
  },
  { permission: PERMISSIONS.FINANCE_VIEW }
);

export const POST = withSession(
  async (request: Request, session) => {
    try {
      const body = await request.json();

      const clinicId = session.clinicId;
      const timeZone = await getClinicTimezone(clinicId);

      const id = body.id || `EXP-${Date.now().toString().slice(-6)}`;
      const date = body.date ? new Date(body.date).toISOString() : new Date().toISOString();

      const expensePayload = {
        id,
        clinic_id: clinicId,
        doctor_id: session.role === "doctor" ? session.user.id : null,
        category: body.category || "MISC",
        title: body.title || body.titleEn || "Expense",
        title_ar: body.titleAr || body.title || "مصروف",
        amount: toPiastres(Number(body.amount) || 0),
        date,
        payment_method: body.paymentMethod || "CASH",
        paid_to: body.paidTo || null,
        receipt_no: body.receiptNo || null,
        notes: body.notes || null,
        is_recurring: Boolean(body.isRecurring),
        recorded_by_role: session.role,
      };

      const { data, error } = await supabase
        .from("expenses")
        .insert(expensePayload)
        .select()
        .single();

      // Never report success for a write that did not persist: the client would
      // cache an expense that vanishes on the next reload.
      if (error) {
        console.error("Insert expense failed:", error.message);
        return NextResponse.json(
          { success: false, error: "Failed to record expense" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        expense: {
          id: data.id,
          category: data.category,
          categoryNameEn: data.category,
          categoryNameAr: data.category,
          titleEn: data.title,
          titleAr: data.title_ar,
          amount: fromPiastres(Number(data.amount) || 0),
          date: clinicCalendarDate(data.date, timeZone),
          time:
            data.date && isInstant(data.date)
              ? formatInClinicZone(
                  data.date,
                  timeZone,
                  { hour: "2-digit", minute: "2-digit" },
                  "en-US",
                  "12:00 PM"
                )
              : "12:00 PM",
          paymentMethod: data.payment_method,
          paidTo: data.paid_to,
          receiptNo: data.receipt_no,
          notes: data.notes,
          isRecurring: data.is_recurring,
          recordedByRole: data.recorded_by_role,
        },
      });
    } catch (error) {
      console.error("POST /api/finance/expenses error:", error);
      return NextResponse.json({ success: false, error: "Failed to record expense" }, { status: 500 });
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES }
);

export const DELETE = withSession(
  async (request: Request, session) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Expense ID required" }, { status: 400 });
      }

      // Scope the delete to the caller's own clinic so one tenant can never
      // delete another tenant's records by guessing an id.
      const { data, error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("clinic_id", session.clinicId)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Delete expense failed:", error.message);
        return NextResponse.json({ success: false, error: "Failed to delete expense" }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, deletedId: id });
    } catch (error) {
      console.error("DELETE /api/finance/expenses error:", error);
      return NextResponse.json({ success: false, error: "Failed to delete expense" }, { status: 500 });
    }
  },
  { permission: PERMISSIONS.FINANCE_EXPENSES_DELETE }
);
