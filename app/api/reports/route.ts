import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

const CreateReportSchema = z.object({
  patientId: z.string().optional(),
  newPatient: z
    .object({
      name: z.string().min(1).max(200),
      phone: z.string().min(1).max(30),
      gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
      age: z.number().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  type: z.enum(["CONSULTATION", "PRESCRIPTION", "TRIAGE_REPORT"]).default("CONSULTATION"),
  title: z.string().optional(),
  content: z.string().min(1).max(10000),
  diagnosis: z.string().max(5000).optional(),
  doctorReview: z.string().max(5000).optional(),
  triageNotes: z.string().max(5000).optional(),
  vitals: z
    .object({
      bp: z.string().optional(),
      pulse: z.string().optional(),
      temp: z.string().optional(),
      sugar: z.string().optional(),
      weight: z.string().optional(),
    })
    .optional(),
  medicines: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string().default("image"),
        description: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(["PENDING", "TRIAGED", "REVIEWED", "REPLIED", "CLOSED"]).default("REVIEWED"),
  replyMethod: z.enum(["HUMAN", "AI"]).default("HUMAN"),
});

const PatchReportSchema = z.object({
  id: z.string().min(1),
  triageNotes: z.string().max(5000).optional(),
  doctorReview: z.string().max(5000).optional(),
  replyMethod: z.enum(["HUMAN", "AI"]).optional(),
  aiReply: z.string().max(10000).optional(),
  status: z.enum(["PENDING", "TRIAGED", "REVIEWED", "REPLIED", "CLOSED"]).optional(),
});

export async function GET() {
  try {
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("reports")
      .select("*, patients(id, name, phone, gender, notes, date_of_birth, patient_attachments(*))")
      .eq("clinic_id", session.clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Reports join query warning, falling back to simple select:", error.message);
      const { data: fallbackData } = await supabase
        .from("reports")
        .select("*, patients(name, phone)")
        .eq("clinic_id", session.clinicId)
        .order("created_at", { ascending: false });

      return NextResponse.json({ success: true, data: fallbackData || [] });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = CreateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      patientId: providedPatientId,
      newPatient,
      type,
      title,
      content,
      diagnosis,
      doctorReview,
      triageNotes,
      vitals,
      medicines,
      attachments,
      status,
      replyMethod,
    } = parsed.data;

    let targetPatientId = providedPatientId;

    // 1. Create patient if newPatient was passed
    if ((!targetPatientId || targetPatientId === "new") && newPatient) {
      const newId = `pat-${Date.now()}`;
      const { data: createdPatient, error: pErr } = await supabase
        .from("patients")
        .insert({
          id: newId,
          clinic_id: session.clinicId,
          name: newPatient.name.trim(),
          phone: newPatient.phone.trim(),
          gender: newPatient.gender || "UNKNOWN",
          notes: newPatient.notes?.trim() || null,
        })
        .select()
        .single();

      if (pErr || !createdPatient) {
        console.error("Failed to create new patient:", pErr);
        return NextResponse.json(
          { success: false, error: "Failed to create new patient record" },
          { status: 400 }
        );
      }
      targetPatientId = createdPatient.id;
    }

    if (!targetPatientId) {
      return NextResponse.json(
        { success: false, error: "Patient ID or New Patient details required" },
        { status: 400 }
      );
    }

    // 2. Resolve doctor for this report
    let doctorId = "doc-default";
    const { data: currentDoc } = await supabase
      .from("doctors")
      .select("id")
      .eq("clinic_id", session.clinicId)
      .limit(1)
      .maybeSingle();

    if (currentDoc?.id) {
      doctorId = currentDoc.id;
    }

    // 3. Prepare structured notes
    const metadataPayload: Record<string, any> = {};
    if (type) metadataPayload.type = type;
    if (title) metadataPayload.title = title;
    if (diagnosis) metadataPayload.diagnosis = diagnosis;
    if (vitals && Object.keys(vitals).length > 0) metadataPayload.vitals = vitals;
    if (medicines && medicines.length > 0) metadataPayload.medicines = medicines;

    let finalDoctorReview = doctorReview || diagnosis || "";
    let finalTriageNotes = triageNotes || "";

    // Embed structured metadata if medicines or vitals exist
    if (Object.keys(metadataPayload).length > 0) {
      finalDoctorReview = `${finalDoctorReview}\n\n<!-- CLINICAL_META: ${JSON.stringify(metadataPayload)} -->`.trim();
    }

    // 4. Insert into reports table
    const reportId = `rep-${Date.now()}`;
    const { data: createdReport, error: repErr } = await supabase
      .from("reports")
      .insert({
        id: reportId,
        patient_id: targetPatientId,
        doctor_id: doctorId,
        clinic_id: session.clinicId,
        content: content.trim(),
        doctor_review: finalDoctorReview,
        triage_notes: finalTriageNotes,
        status: status || "REVIEWED",
        reply_method: replyMethod || "HUMAN",
      })
      .select("*, patients(id, name, phone, gender, notes, patient_attachments(*))")
      .single();

    if (repErr) {
      console.error("Report insert error:", repErr);
      return NextResponse.json({ success: false, error: repErr.message }, { status: 400 });
    }

    // 5. Insert attachments if provided
    const savedAttachments = [];
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const { data: savedAtt, error: attErr } = await supabase
          .from("patient_attachments")
          .insert({
            id: attId,
            patient_id: targetPatientId,
            clinic_id: session.clinicId,
            file_name: att.fileName || "Medical Attachment",
            file_url: att.fileUrl,
            file_type: att.fileType || "image",
            description: att.description || null,
          })
          .select()
          .single();

        if (!attErr && savedAtt) {
          savedAttachments.push(savedAtt);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        report: createdReport,
        attachments: savedAttachments,
        message: "Clinical history record and attachments saved successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reports POST error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getClinicSession();

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = PatchReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const { data, error } = await supabase
      .from("reports")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", session.clinicId)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Reports PATCH error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

