import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

const PatchPatientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(30).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  address: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const { data: patient, error } = await supabase
      .from("patients")
      .select("*, appointments(*, doctors(name, specialty)), patient_attachments(*)")
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (error || !patient) {
      // Fallback simple query
      const { data: simplePatient, error: sErr } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .eq("clinic_id", session.clinicId)
        .maybeSingle();

      if (sErr || !simplePatient) {
        return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
      }

      // Fetch appointments separately
      const { data: apts } = await supabase
        .from("appointments")
        .select("*, doctors(name, specialty)")
        .eq("patient_id", id)
        .eq("clinic_id", session.clinicId)
        .order("date", { ascending: false });

      // Fetch attachments separately
      const { data: atts } = await supabase
        .from("patient_attachments")
        .select("*")
        .eq("patient_id", id)
        .eq("clinic_id", session.clinicId)
        .order("uploaded_at", { ascending: false });

      return NextResponse.json({
        success: true,
        patient: {
          ...simplePatient,
          appointments: apts || [],
          patient_attachments: atts || [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error("Patient GET [id] error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const parsed = PatchPatientSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.email !== undefined) updateData.email = body.email ? body.email.trim() : null;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.address !== undefined) updateData.address = body.address ? body.address.trim() : null;
    if (body.notes !== undefined) updateData.notes = body.notes ? body.notes.trim() : null;
    if (body.dateOfBirth !== undefined) {
      updateData.date_of_birth = body.dateOfBirth ? new Date(body.dateOfBirth).toISOString() : null;
    }

    const { data, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, patient: data });
  } catch (error) {
    console.error("Patient PATCH [id] error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
