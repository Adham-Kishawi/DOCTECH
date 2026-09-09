import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

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
    const { data, error } = await supabase
      .from("reports")
      .select("*, patients(name, phone)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
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
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
