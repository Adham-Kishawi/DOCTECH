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

    if (!session?.clinicId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Clinic authentication required" },
        { status: 401 }
      );
    }

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
      uploadedAt: att.uploaded_at ? new Date(att.uploaded_at).toISOString().split("T")[0] : "",
      fileSize: "2.1 MB",
      description: att.description || "",
    }));

    return NextResponse.json({ success: true, patientId: id, attachments: mapped });
  } catch (error) {
    console.error("Fetch attachments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attachments" }, { status: 500 });
  }
}

export async function POST(
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
      console.error("Save attachment error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      attachment: {
        id: data.id,
        patientId: data.patient_id,
        fileName: data.file_name,
        fileUrl: data.file_url,
        fileType: data.file_type,
        uploadedAt: data.uploaded_at ? new Date(data.uploaded_at).toISOString().split("T")[0] : "",
        fileSize: "2.1 MB",
        description: data.description,
      },
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    return NextResponse.json({ success: false, error: "Failed to save attachment metadata" }, { status: 500 });
  }
}

