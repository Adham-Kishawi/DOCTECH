import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { ApiError, withSession, PERMISSIONS } from "@/lib/apiAuth";
import { isMissingSchema } from "@/lib/schedule/shiftService";

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const ShiftSchema = z.object({
  id: z.string().optional(),
  doctorId: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_RE, "startTime must be HH:MM"),
  endTime: z.string().regex(TIME_RE, "endTime must be HH:MM"),
  slotDuration: z.number().int().min(5).max(240).default(30),
  shiftName: z.string().max(40).nullish(),
  isActive: z.boolean().default(true),
});

const SELECT_FIELDS =
  "id, clinic_id, doctor_id, day_of_week, start_time, end_time, slot_duration, shift_name, is_active, max_overflow";

/**
 * Resolves which doctor a request targets. A doctor manages their own schedule;
 * a secretary may only pass a doctorId that belongs to their clinic.
 */
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

    const { data, error } = await supabase
      .from("doctor_shifts")
      .select(SELECT_FIELDS)
      .eq("doctor_id", doctorId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

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
    const body = await request.json().catch(() => null);
    const parsed = ShiftSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, parsed.error.issues[0]?.message || "Invalid shift");
    }

    const shift = parsed.data;
    const doctorId = await resolveDoctorId(session, shift.doctorId);

    if (shift.endTime <= shift.startTime) {
      throw new ApiError(422, "endTime must be after startTime");
    }

    const { data, error } = await supabase
      .from("doctor_shifts")
      .insert({
        id: `shift-${crypto.randomUUID()}`,
        clinic_id: session.clinicId,
        doctor_id: doctorId,
        day_of_week: shift.dayOfWeek,
        start_time: shift.startTime,
        end_time: shift.endTime,
        slot_duration: shift.slotDuration,
        shift_name: shift.shiftName ?? null,
        is_active: shift.isActive,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      if (isMissingSchema(error)) throw new ApiError(503, "Scheduling tables are not available yet");
      if (error.code === "23505") throw new ApiError(409, "A shift with that name already exists for this day");
      throw new ApiError(500, error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE }
);

export const PUT = withSession(
  async (request, session) => {
    const body = await request.json().catch(() => null);
    const parsed = ShiftSchema.partial({ dayOfWeek: true, startTime: true, endTime: true }).safeParse(body);
    if (!parsed.success || !body?.id) {
      throw new ApiError(422, "id and a valid shift payload are required");
    }

    const shift = parsed.data;
    await resolveDoctorId(session, shift.doctorId);

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (shift.dayOfWeek !== undefined) payload.day_of_week = shift.dayOfWeek;
    if (shift.startTime !== undefined) payload.start_time = shift.startTime;
    if (shift.endTime !== undefined) payload.end_time = shift.endTime;
    if (shift.slotDuration !== undefined) payload.slot_duration = shift.slotDuration;
    if (shift.shiftName !== undefined) payload.shift_name = shift.shiftName ?? null;
    if (shift.isActive !== undefined) payload.is_active = shift.isActive;

    const { data, error } = await supabase
      .from("doctor_shifts")
      .update(payload)
      .eq("id", body.id)
      .eq("clinic_id", session.clinicId)
      .select(SELECT_FIELDS)
      .maybeSingle();

    if (error) {
      if (error.code === "23505") throw new ApiError(409, "A shift with that name already exists for this day");
      throw new ApiError(500, error.message);
    }
    if (!data) throw new ApiError(404, "Shift not found");

    return NextResponse.json({ success: true, data });
  },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE }
);

export const DELETE = withSession(
  async (request, session) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new ApiError(400, "id is required");

    const { data, error } = await supabase
      .from("doctor_shifts")
      .delete()
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select("id")
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Shift not found");

    return NextResponse.json({ success: true, archivedId: id });
  },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE }
);
