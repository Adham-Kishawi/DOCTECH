import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getClinicSession } from "@/lib/clinicAuth";

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
      .select("*, patients(name, phone)")
      .eq("clinic_id", session.clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Reports GET error:", error);
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
