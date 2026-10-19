import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type { PatientListItem } from "@/types/index";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { formatInClinicZone } from "@/lib/schedule/clinicTime";

const CreatePatientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  email: z.string().email().max(200).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  clinicId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.PATIENTS_VIEW });
    // Last-visit labels are rendered server-side, so they must follow the
    // clinic's calendar rather than the API server's.
    const timeZone = await getClinicTimezone(session.clinicId);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10), 1), 500);

    const query = supabase
      .from("patients")
      .select("*, appointments(id, date, status)")
      .eq("clinic_id", session.clinicId)
      .limit(limit);

    const { data: rawPatients, error } = await query.order("created_at", { ascending: false });

    if (error) {
      // Fallback in case join fails or column mismatch
      const fallbackQuery = supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", session.clinicId)
        .limit(limit);
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.order("created_at", { ascending: false });

      if (fallbackError) {
        console.error("Get patients error:", fallbackError);
        return NextResponse.json({ success: true, data: [] });
      }

      const formatted: PatientListItem[] = (fallbackData || []).map((p) => {
        const birthDate = p.date_of_birth || p.dateOfBirth;
        const age = birthDate ? Math.max(0, new Date().getFullYear() - new Date(birthDate).getFullYear()) : null;
        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email || "",
          gender: p.gender === "FEMALE" ? "Female" : p.gender === "MALE" ? "Male" : "Unknown",
          genderAr: p.gender === "FEMALE" ? "أنثى" : p.gender === "MALE" ? "ذكر" : "غير محدد",
          age: age || 35,
          address: p.address || "",
          notes: p.notes || "",
          totalVisits: 0,
          lastVisit: "No visits yet",
          lastVisitAr: "لا توجد زيارات سابقة",
          createdAt: p.created_at || p.createdAt,
        };
      });

      return NextResponse.json({ success: true, data: formatted });
    }

    const formatted: PatientListItem[] = (rawPatients || []).map((p) => {
      const birthDate = p.date_of_birth || p.dateOfBirth;
      const age = birthDate ? Math.max(0, new Date().getFullYear() - new Date(birthDate).getFullYear()) : null;
      const appointments = Array.isArray(p.appointments) ? p.appointments : [];
      const totalVisits = appointments.length;

      let lastVisit = "No visits yet";
      let lastVisitAr = "لا توجد زيارات سابقة";

      if (appointments.length > 0) {
        const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const rawLast = String(sorted[0].date ?? "");
        lastVisit = formatInClinicZone(
          rawLast,
          timeZone,
          { month: "short", day: "numeric", year: "numeric" },
          "en-US",
          rawLast
        );
        lastVisitAr = formatInClinicZone(
          rawLast,
          timeZone,
          { month: "short", day: "numeric", year: "numeric" },
          "ar-EG",
          rawLast
        );
      }

      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email || "",
        gender: p.gender === "FEMALE" ? "Female" : p.gender === "MALE" ? "Male" : "Unknown",
        genderAr: p.gender === "FEMALE" ? "أنثى" : p.gender === "MALE" ? "ذكر" : "غير محدد",
        age: age || 35,
        address: p.address || "",
        notes: p.notes || "",
        totalVisits,
        lastVisit,
        lastVisitAr,
        createdAt: p.created_at || p.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return toErrorResponse(error, "Patients GET error:");
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession({ permission: PERMISSIONS.PATIENTS_MANAGE });
    const body = await req.json();
    const parsed = CreatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const clinicId = session.clinicId;

    const patientId = crypto.randomUUID();
    const birthDate = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth).toISOString() : null;

    const newPatient = {
      id: patientId,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      email: parsed.data.email?.trim() || null,
      date_of_birth: birthDate,
      gender: parsed.data.gender || "UNKNOWN",
      address: parsed.data.address?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      clinic_id: clinicId,
    };

    const { data, error } = await supabase.from("patients").insert([newPatient]).select();

    if (error) {
            console.error("Patient insert error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save: " + "Patient insert error:" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data?.[0] || newPatient }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Patients POST error:");
  }
}
