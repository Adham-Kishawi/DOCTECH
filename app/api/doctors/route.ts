import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import {
  ApiError,
  PERMISSIONS,
  canAny,
  requireSession,
  toErrorResponse,
} from "@/lib/apiAuth";
import type { DoctorListItem, DoctorScheduleRow } from "@/types/index";

export const dynamic = "force-dynamic";

/** Deterministic avatar chips — the DB has no colour field, so it derives from the id. */
const AVATAR_TONES = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-purple-600 text-white",
  "bg-cyan-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${parts[0][0]}${last}`.toUpperCase();
}

function toneFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100003;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/**
 * GET /api/doctors — every doctor in the caller's clinic, with their weekly
 * shifts and real workload counters used by the profile banners.
 *
 * Any signed-in clinic user may read the staff directory, but the caller still
 * needs at least one clinical view permission so a bare account cannot map the
 * clinic's staff.
 */
export async function GET() {
  try {
    const session = await requireSession();

    if (
      !canAny(session, [
        PERMISSIONS.APPOINTMENTS_VIEW,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.PATIENTS_VIEW,
      ])
    ) {
      throw new ApiError(403, "Forbidden: missing permission to view clinic staff");
    }

    const clinicId = session.clinicId;

    const [doctorsRes, schedulesRes, appointmentsRes, reportsRes] = await Promise.all([
      supabase
        .from("doctors")
        .select("id, name, specialty")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true }),
      supabase.from("doctor_schedules").select("*").eq("clinic_id", clinicId),
      supabase.from("appointments").select("doctor_id, status").eq("clinic_id", clinicId),
      supabase.from("reports").select("doctor_id, status").eq("clinic_id", clinicId),
    ]);

    if (doctorsRes.error || schedulesRes.error || appointmentsRes.error || reportsRes.error) {
      const firstError =
        doctorsRes.error ||
        schedulesRes.error ||
        appointmentsRes.error ||
        reportsRes.error;
      console.error("GET /api/doctors query failed:", firstError?.message);
      throw new ApiError(500, "Failed to load clinic doctors");
    }

    const schedulesByDoctor = new Map<string, DoctorScheduleRow[]>();
    for (const row of schedulesRes.data ?? []) {
      const list = schedulesByDoctor.get(row.doctor_id) ?? [];
      list.push(row as DoctorScheduleRow);
      schedulesByDoctor.set(row.doctor_id, list);
    }

    const casesByDoctor = new Map<string, number>();
    for (const row of appointmentsRes.data ?? []) {
      if (row.status === "CANCELLED") continue;
      casesByDoctor.set(row.doctor_id, (casesByDoctor.get(row.doctor_id) ?? 0) + 1);
    }

    const reportsByDoctor = new Map<string, { total: number; pending: number }>();
    for (const row of reportsRes.data ?? []) {
      const bucket = reportsByDoctor.get(row.doctor_id) ?? { total: 0, pending: 0 };
      bucket.total += 1;
      if (row.status !== "REVIEWED" && row.status !== "CLOSED") bucket.pending += 1;
      reportsByDoctor.set(row.doctor_id, bucket);
    }

    const data: DoctorListItem[] = (doctorsRes.data ?? []).map((doctor) => {
      const reports = reportsByDoctor.get(doctor.id) ?? { total: 0, pending: 0 };
      const name = doctor.name || "Doctor";
      const specialty = doctor.specialty || "";

      return {
        id: doctor.id,
        name,
        // No Arabic name column yet: Arabic views fall back to the stored name.
        nameAr: name,
        specialty,
        specialtyAr: specialty,
        initials: initialsFor(name),
        avatarBg: toneFor(doctor.id),
        totalCases: casesByDoctor.get(doctor.id) ?? 0,
        totalReports: reports.total,
        pendingReviews: reports.pending,
        schedules: schedulesByDoctor.get(doctor.id) ?? [],
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toErrorResponse(error, "GET /api/doctors");
  }
}
