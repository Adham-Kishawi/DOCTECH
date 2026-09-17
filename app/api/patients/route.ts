import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

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

export async function GET() {
  try {
    const session = await getClinicSession();

    let query = supabase.from("patients").select("*, appointments(id, date, status)");

    // If authenticated with a clinic, enforce multi-tenant isolation
    if (session?.clinicId) {
      query = query.eq("clinic_id", session.clinicId);
    }

    const { data: rawPatients, error } = await query.order("created_at", { ascending: false });

    if (error) {
      // Fallback in case join fails or column mismatch
      let fallbackQuery = supabase.from("patients").select("*");
      if (session?.clinicId) {
        fallbackQuery = fallbackQuery.eq("clinic_id", session.clinicId);
      }
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.order("created_at", { ascending: false });

      if (fallbackError) {
        console.error("Get patients error:", fallbackError);
        return NextResponse.json({ success: true, data: [] });
      }

      const formatted = (fallbackData || []).map((p) => {
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

    const formatted = (rawPatients || []).map((p) => {
      const birthDate = p.date_of_birth || p.dateOfBirth;
      const age = birthDate ? Math.max(0, new Date().getFullYear() - new Date(birthDate).getFullYear()) : null;
      const appointments = Array.isArray(p.appointments) ? p.appointments : [];
      const totalVisits = appointments.length;

      let lastVisit = "No visits yet";
      let lastVisitAr = "لا توجد زيارات سابقة";

      if (appointments.length > 0) {
        const sorted = [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastDate = new Date(sorted[0].date);
        lastVisit = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        lastVisitAr = lastDate.toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });
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
    console.error("Patients GET error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getClinicSession();
    const body = await req.json();
    const parsed = CreatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const clinicId = parsed.data.clinicId || session?.clinicId;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: "Missing clinic context for patient registration" },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] || newPatient }, { status: 201 });
  } catch (error) {
    console.error("Patients POST error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
