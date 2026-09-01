import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const CreatePatientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  email: z.string().email().max(200).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  clinicId: z.string().min(1),
});

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from("patients").insert([parsed.data]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
