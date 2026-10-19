import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { ApiError, withSession, PERMISSIONS } from "@/lib/apiAuth";
import { isMissingSchema } from "@/lib/schedule/shiftService";

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ExceptionSchema = z.object({
  doctorId: z.string().optional(),
  exceptionDate: z.string().regex(DATE_RE, "exceptionDate must be YYYY-MM-DD"),
  exceptionType: z.enum(["HOLIDAY", "LEAVE", "CONFERENCE", "EXTRA_SHIFT"]),
  reason: z.string().max(200).nullish(),
  startTime: z.string().regex(TIME_RE).nullish(),
  endTime: z.string().regex(TIME_RE).nullish(),
});

const SELECT_FIELDS =
  "id, clinic_id, doctor_id, exception_date, exception_type, reason, start_time, end_time, created_at";

async function resolveDoctorId(
  session: { clinicId: string; role: string; user: { id: string } },
  requested?: string | null
): Promise<string> {
  const target = requested?.trim() || (session.role === "doctor" ? session.user.id : "");
  if (!target) throw new ApiError(400, "doctorId is required");

  const { data, error } = await supabase
    .from("doctors")
    .select("id")
    .eq("id", target)
    .eq("clinic_id", session.clinicId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "Doctor not found in this clinic");
  return data.id;
}

export const GET = withSession(
  async (request, session) => {
    const { searchParams } = new URL(request.url);
    const doctorId = await resolveDoctorId(session, searchParams.get("doctorId"));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
      .from("schedule_exceptions")
      .select(SELECT_FIELDS)
      .eq("doctor_id", doctorId)
      .order("exception_date", { ascending: true });

    if (from && DATE_RE.test(from)) query = query.gte("exception_date", from);
    if (to && DATE_RE.test(to)) query = query.lte("exception_date", to);

    const { data, error } = await query;
    if (error) {
      if (isMissingSchema(error)) return NextResponse.json({ success: true, data: [], unavailable: true });
      throw new ApiError(500, error.message);
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  },
  { permission: PERMISSIONS.APPOINTMENTS_VIEW }
);

export const POST = withSession(
  async (request, session) => {
    const parsed = ExceptionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(422, parsed.error.issues[0]?.message || "Invalid exception");
    }

    const exception = parsed.data;
    const doctorId = await resolveDoctorId(session, exception.doctorId);

    // EXTRA_SHIFT is the only type with hours, and it needs both (the DB CHECK
    // enforces the same rule, so a mismatch would surface as a 500 without this).
    const isExtraShift = exception.exceptionType === "EXTRA_SHIFT";
    if (isExtraShift && (!exception.startTime || !exception.endTime)) {
      throw new ApiError(422, "An extra shift requires startTime and endTime");
    }
    if (isExtraShift && exception.endTime! <= exception.startTime!) {
      throw new ApiError(422, "endTime must be after startTime");
    }

    const { data, error } = await supabase
      .from("schedule_exceptions")
      .insert({
        id: `exc-${crypto.randomUUID()}`,
        clinic_id: session.clinicId,
        doctor_id: doctorId,
        exception_date: exception.exceptionDate,
        exception_type: exception.exceptionType,
        reason: exception.reason ?? null,
        start_time: isExtraShift ? exception.startTime : null,
        end_time: isExtraShift ? exception.endTime : null,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      if (isMissingSchema(error)) throw new ApiError(503, "Scheduling tables are not available yet");
      throw new ApiError(500, error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE }
);

export const DELETE = withSession(
  async (request, session) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new ApiError(400, "id is required");

    const { data, error } = await supabase
      .from("schedule_exceptions")
      .delete()
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select("id")
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Exception not found");

    return NextResponse.json({ success: true, archivedId: id });
  },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE }
);
