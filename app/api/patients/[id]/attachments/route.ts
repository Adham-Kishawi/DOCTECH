import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { requireSession, toErrorResponse, PERMISSIONS } from "@/lib/apiAuth";
import { getClinicTimezone } from "@/lib/schedule/availabilityService";
import { clinicCalendarDate } from "@/lib/schedule/clinicTime";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.PATIENTS_VIEW });
    const timeZone = await getClinicTimezone(session.clinicId);

    const { data: attachments, error } = await supabase
      .from("patient_attachments")
      .select("*")
      .eq("patient_id", id)
      .eq("clinic_id", session.clinicId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Fetch attachments error:", error);
      return NextResponse.json({ success: true, patientId: id, attachments: [] });
    }

    const mapped = (attachments || []).map((att) => ({
      id: att.id,
      patientId: att.patient_id,
      fileName: att.file_name,
      fileUrl: att.file_url,
      fileType: att.file_type,
      uploadedAt: clinicCalendarDate(att.uploaded_at, timeZone),
      fileSize: "2.1 MB",
      description: att.description || "",
    }));

    return NextResponse.json({ success: true, patientId: id, attachments: mapped });
  } catch (error) {
    return toErrorResponse(error, "Fetch attachments error:");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession({ permission: PERMISSIONS.PATIENTS_MANAGE });
    const timeZone = await getClinicTimezone(session.clinicId);

    const body = await request.json();
    const { fileName, fileUrl, fileType, description } = body;

    const newId = `att-${Date.now()}`;
    const { data, error } = await supabase
      .from("patient_attachments")
      .insert({
        id: newId,
        patient_id: id,
        clinic_id: session.clinicId,
        file_name: fileName || "unnamed_document",
        file_url: fileUrl || "#",
        file_type: fileType || "image",
        description: description || null,
      })
      .select()
      .single();

if (error) {
      console.error("Save attachment error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to save attachment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: data.id,
        patientId: data.patient_id,
        fileName: data.file_name,
        fileUrl: data.file_url,
        fileType: data.file_type,
        uploadedAt: clinicCalendarDate(data.uploaded_at, timeZone),
        fileSize: "2.1 MB",
        description: data.description,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "Upload attachment error:");
  }
}

