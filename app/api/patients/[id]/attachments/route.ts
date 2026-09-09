import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mockAttachments = [
      {
        id: "att-1",
        patientId: id,
        fileName: "Chest_XRay_PA_View.jpg",
        fileUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
        fileType: "xray",
        uploadedAt: "2026-08-20",
        fileSize: "3.2 MB",
        description: "Bilateral lung fields clear. Cardiac silhouette within normal limits.",
      },
      {
        id: "att-2",
        patientId: id,
        fileName: "Prescription_DrAhmed_Aug2026.pdf",
        fileUrl: "#",
        fileType: "prescription",
        uploadedAt: "2026-08-20",
        fileSize: "450 KB",
        description: "Prescribed Amlodipine 5mg OD, Concor 2.5mg.",
      },
      {
        id: "att-3",
        patientId: id,
        fileName: "HbA1c_Lipid_Profile_Results.jpg",
        fileUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
        fileType: "image",
        uploadedAt: "2026-07-15",
        fileSize: "1.8 MB",
        description: "Fasting Blood Sugar: 110 mg/dL, HbA1c: 6.2%",
      },
    ];

    return NextResponse.json({ success: true, patientId: id, attachments: mockAttachments });
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
    const body = await request.json();
    const { fileName, fileUrl, fileType, description } = body;

    const newAttachment = {
      id: `att-${Date.now()}`,
      patientId: id,
      fileName,
      fileUrl: fileUrl || "#",
      fileType: fileType || "image",
      uploadedAt: new Date().toISOString().split("T")[0],
      fileSize: "2.1 MB",
      description,
    };

    return NextResponse.json({ success: true, attachment: newAttachment });
  } catch (error) {
    console.error("Upload attachment error:", error);
    return NextResponse.json({ success: false, error: "Failed to save attachment metadata" }, { status: 500 });
  }
}
