import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { ApiError, withSession, PERMISSIONS } from "@/lib/apiAuth";
import { isMissingSchema } from "@/lib/schedule/shiftService";

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const BlockSchema = z.object({
  doctorId: z.string().optional(),
  blockedDate: z.string().regex(DATE_RE, "blockedDate must be YYYY-MM-DD"),
  startTime: z.string().regex(TIME_RE, "startTime must be HH:MM"),
  endTime: z.string().regex(TIME_RE, "endTime must be HH:MM"),
  reason: z.string().max(200).nullish(),
});

const SELECT_FIELDS =
  "id, clinic_id, doctor_id, blocked_date, start_time, end_time, reason, created_by, created_at";

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
    const date = searchParams.get("date");

    let query = supabase
      .from("slot_blocks")
      .select(SELECT_FIELDS)
      .eq("doctor_id", doctorId)
      .order("blocked_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (date && DATE_RE.test(date)) query = query.eq("blocked_date", date);

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
    const parsed = BlockSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(422, parsed.error.issues[0]?.message || "Invalid block");
    }

    const block = parsed.data;
    const doctorId = await resolveDoctorId(session, block.doctorId);

    if (block.endTime <= block.startTime) {
      throw new ApiError(422, "endTime must be after startTime");
    }

    const { data, error } = await supabase
      .from("slot_blocks")
      .insert({
        id: `block-${crypto.randomUUID()}`,
        clinic_id: session.clinicId,
        doctor_id: doctorId,
        blocked_date: block.blockedDate,
        start_time: block.startTime,
        end_time: block.endTime,
        reason: block.reason ?? null,
        created_by: session.user.id,
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
      .from("slot_blocks")
      .delete()
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select("id")
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Block not found");

    return NextResponse.json({ success: true, archivedId: id });
  },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE }
);
