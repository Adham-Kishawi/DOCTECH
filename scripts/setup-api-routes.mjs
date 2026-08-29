import fs from "node:fs";
import path from "node:path";

const roots = ["D:\\FULL-PROJECTS\\DOCTECK", "D:\\FULL-PROJECTS\\DOCTECH"];

// ============================================
// 1. APPOINTMENTS API ROUTE
// ============================================
const appointmentsApi = `import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(name, phone), doctors(name)")
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from("appointments").insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
`;

// ============================================
// 2. PATIENTS API ROUTE
// ============================================
const patientsApi = `import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase.from("patients").insert([body]).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
`;

// ============================================
// 3. REPORTS API ROUTE
// ============================================
const reportsApi = `import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    const { data, error } = await supabase
      .from("reports")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
`;

for (const root of roots) {
  const aptDir = path.join(root, "app", "api", "appointments");
  const patDir = path.join(root, "app", "api", "patients");
  const repDir = path.join(root, "app", "api", "reports");

  fs.mkdirSync(aptDir, { recursive: true });
  fs.mkdirSync(patDir, { recursive: true });
  fs.mkdirSync(repDir, { recursive: true });

  fs.writeFileSync(path.join(aptDir, "route.ts"), appointmentsApi, "utf8");
  fs.writeFileSync(path.join(patDir, "route.ts"), patientsApi, "utf8");
  fs.writeFileSync(path.join(repDir, "route.ts"), reportsApi, "utf8");
}

console.log("API routes for Appointments, Patients, and Reports created successfully in both root folders");
