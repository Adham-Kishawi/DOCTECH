import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getClinicSession();

    let query = supabase
      .from("patients")
      .select("*, appointments(*, doctors(name, specialty)), patient_attachments(*)")
      .eq("id", id);

    if (session?.clinicId) {
      query = query.eq("clinic_id", session.clinicId);
    }

    const { data: patient, error } = await query.maybeSingle();

    if (error || !patient) {
      // Fallback simple query in case nested relations are configured differently
      let simpleQuery = supabase.from("patients").select("*").eq("id", id);
      if (session?.clinicId) {
        simpleQuery = simpleQuery.eq("clinic_id", session.clinicId);
      }
      const { data: simplePatient, error: sErr } = await simpleQuery.maybeSingle();

      if (sErr || !simplePatient) {
        return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
      }

      // Fetch appointments separately
      const { data: apts } = await supabase
        .from("appointments")
        .select("*, doctors(name, specialty)")
        .eq("patient_id", id)
        .order("date", { ascending: false });

      // Fetch attachments separately
      const { data: atts } = await supabase
        .from("patient_attachments")
        .select("*")
        .eq("patient_id", id)
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
    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.dateOfBirth !== undefined) {
      updateData.date_of_birth = body.dateOfBirth ? new Date(body.dateOfBirth).toISOString() : null;
    }

    let query = supabase.from("patients").update(updateData).eq("id", id);
    if (session?.clinicId) {
      query = query.eq("clinic_id", session.clinicId);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, patient: data });
  } catch (error) {
    console.error("Patient PATCH [id] error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
