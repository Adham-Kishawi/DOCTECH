import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { Client } from "pg";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secretKey = searchParams.get("key");

  // Secure the endpoint with a secret query param
  if (secretKey !== "doctech_setup_secret_2026") {
    return NextResponse.json({ error: "Unauthorized access key" }, { status: 401 });
  }

  const results: Record<string, any> = {
    tablesCreated: [],
    clerkDoctor: null,
    clinic: null,
    doctor: null,
    patients: [],
    appointments: [],
    expenses: [],
  };

  // 1. Create missing tables using pg Client
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const dbUrl =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  let pgClient: Client | null = null;
  if (dbUrl) {
    try {
      pgClient = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      await pgClient.connect();
    } catch (connErr: any) {
      console.error("PG connect error:", connErr);
      results.pgConnectError = connErr.message;
    }
  } else {
    results.pgConnectError = "No database URL found in environment";
  }

  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "reports" (
      "id" TEXT PRIMARY KEY,
      "patient_id" TEXT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
      "doctor_id" TEXT NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
      "clinic_id" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
      "content" TEXT NOT NULL,
      "triage_notes" TEXT,
      "doctor_review" TEXT,
      "reply_method" TEXT,
      "ai_reply" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS "expenses" (
      "id" TEXT PRIMARY KEY,
      "clinic_id" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
      "doctor_id" TEXT REFERENCES "doctors"("id") ON DELETE SET NULL,
      "category" TEXT NOT NULL DEFAULT 'MISC',
      "title" TEXT NOT NULL,
      "title_ar" TEXT,
      "amount" DOUBLE PRECISION NOT NULL,
      "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "payment_method" TEXT NOT NULL DEFAULT 'CASH',
      "paid_to" TEXT,
      "receipt_no" TEXT,
      "notes" TEXT,
      "is_recurring" BOOLEAN NOT NULL DEFAULT false,
      "recorded_by_role" TEXT NOT NULL DEFAULT 'doctor',
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS "payment_transactions" (
      "id" TEXT PRIMARY KEY,
      "clinic_id" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
      "doctor_id" TEXT NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
      "patient_id" TEXT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
      "appointment_id" TEXT REFERENCES "appointments"("id") ON DELETE SET NULL,
      "type" TEXT NOT NULL DEFAULT 'CONSULTATION',
      "amount" DOUBLE PRECISION NOT NULL,
      "payment_method" TEXT NOT NULL DEFAULT 'CASH',
      "status" TEXT NOT NULL DEFAULT 'PAID',
      "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "notes" TEXT,
      "recorded_by_role" TEXT NOT NULL DEFAULT 'secretary',
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS "patient_attachments" (
      "id" TEXT PRIMARY KEY,
      "patient_id" TEXT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
      "appointment_id" TEXT REFERENCES "appointments"("id") ON DELETE SET NULL,
      "clinic_id" TEXT NOT NULL,
      "file_name" TEXT NOT NULL,
      "file_url" TEXT NOT NULL,
      "file_type" TEXT NOT NULL,
      "description" TEXT,
      "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS "notifications" (
      "id" TEXT PRIMARY KEY,
      "clinic_id" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
      "doctor_id" TEXT REFERENCES "doctors"("id") ON DELETE CASCADE,
      "secretary_id" TEXT REFERENCES "secretaries"("id") ON DELETE CASCADE,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "is_read" BOOLEAN NOT NULL DEFAULT false,
      "link" TEXT,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS "whatsapp_conversations" (
      "id" TEXT PRIMARY KEY,
      "patient_id" TEXT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
      "clinic_id" TEXT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
      "wa_id" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "last_message" TEXT,
      "last_message_at" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
      "id" TEXT PRIMARY KEY,
      "conversation_id" TEXT NOT NULL REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE,
      "from" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "wa_message_id" TEXT,
      "status" TEXT NOT NULL DEFAULT 'SENT',
      "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`
  ];

  if (pgClient) {
    try {
      for (const sql of ddlStatements) {
        await pgClient.query(sql);
      }
      results.tablesCreated = [
        "reports",
        "expenses",
        "payment_transactions",
        "patient_attachments",
        "notifications",
        "whatsapp_conversations",
        "whatsapp_messages",
      ];
    } catch (err: any) {
      console.error("PG DDL error:", err);
      results.tableError = err.message;
    } finally {
      await pgClient.end().catch(() => {});
    }
  }

  // 2. Create or sync Clerk Doctor Account: doctech@gmail.com
  const doctorEmail = "doctech@gmail.com";
  const doctorPassword = "DoctorTech@2026!";
  const client = await clerkClient();

  let clerkUserId: string | null = null;
  try {
    const existingUsers = await client.users.getUserList({
      emailAddress: [doctorEmail],
    });

    if (existingUsers.data && existingUsers.data.length > 0) {
      const u = existingUsers.data[0];
      clerkUserId = u.id;
      // Update password
      await client.users.updateUser(u.id, {
        password: doctorPassword,
        firstName: "Dr. DOCTECH Lead",
      });
      results.clerkDoctor = { id: u.id, email: doctorEmail, action: "updated_password" };
    } else {
      const created = await client.users.createUser({
        emailAddress: [doctorEmail],
        password: doctorPassword,
        firstName: "Dr. DOCTECH Lead",
      });
      clerkUserId = created.id;
      results.clerkDoctor = { id: created.id, email: doctorEmail, action: "created" };
    }
  } catch (clerkErr: any) {
    console.error("Clerk user error:", clerkErr);
    results.clerkError = clerkErr.message;
  }

  if (!clerkUserId) {
    return NextResponse.json({ success: false, results, error: "Failed to establish Clerk user" }, { status: 500 });
  }

  // 3. Create isolated Clinic for this doctor
  const clinicId = "cln-doctech-demo";
  const clinicName = "DOCTECH Medical Center";

  const { data: existingClinic } = await supabase
    .from("clinics")
    .select("id")
    .eq("id", clinicId)
    .maybeSingle();

  if (!existingClinic) {
    const { data: createdClinic, error: clinicErr } = await supabase
      .from("clinics")
      .insert({
        id: clinicId,
        name: clinicName,
        phone: "01031445949",
        address: "Zamalek, Cairo, Egypt",
        clerk_org_id: "org_doctech_demo",
      })
      .select()
      .single();

    if (clinicErr) {
      console.error("Clinic create error:", clinicErr);
      results.clinicError = clinicErr.message;
    } else {
      results.clinic = createdClinic;
    }
  } else {
    results.clinic = { id: clinicId, name: clinicName, status: "existing" };
  }

  // 4. Create doctor record in Supabase
  const doctorId = "doc-doctech-demo";
  const { data: existingDoc } = await supabase
    .from("doctors")
    .select("id")
    .eq("email", doctorEmail)
    .maybeSingle();

  if (!existingDoc) {
    const { data: createdDoc, error: docErr } = await supabase
      .from("doctors")
      .insert({
        id: doctorId,
        clerk_user_id: clerkUserId,
        email: doctorEmail,
        name: "Dr. DOCTECH Lead",
        specialty: "General Medicine & Surgery",
        clinic_id: clinicId,
      })
      .select()
      .single();

    if (docErr) {
      console.error("Doctor create error:", docErr);
      results.docError = docErr.message;
    } else {
      results.doctor = createdDoc;
    }
  } else {
    // Update existing doctor with clerk_user_id and clinic_id
    const { data: updatedDoc } = await supabase
      .from("doctors")
      .update({
        clerk_user_id: clerkUserId,
        clinic_id: clinicId,
        name: "Dr. DOCTECH Lead",
        specialty: "General Medicine & Surgery",
      })
      .eq("id", existingDoc.id)
      .select()
      .single();

    results.doctor = updatedDoc;
  }

  // 5. Create doctor schedules for all 7 days
  const actualDocId = results.doctor?.id || doctorId;
  for (let day = 0; day <= 6; day++) {
    await supabase.from("doctor_schedules").upsert({
      doctor_id: actualDocId,
      clinic_id: clinicId,
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      slot_duration: 30,
      is_active: day !== 5, // Friday off
    }, { onConflict: "doctor_id,day_of_week" });
  }

  // 6. Seed sample patients
  const samplePatients = [
    {
      id: "pat-demo-001",
      name: "Omar Khaled",
      phone: "01011112222",
      gender: "MALE",
      clinic_id: clinicId,
      notes: "Hypertension patient on regular monitoring.",
    },
    {
      id: "pat-demo-002",
      name: "Fatima Al-Sayed",
      phone: "01122223333",
      gender: "FEMALE",
      clinic_id: clinicId,
      notes: "Post-op follow-up consultation.",
    },
    {
      id: "pat-demo-003",
      name: "Tarek Mahmoud",
      phone: "01233334444",
      gender: "MALE",
      clinic_id: clinicId,
      notes: "Routine seasonal health screening.",
    },
  ];

  for (const p of samplePatients) {
    const { data: createdP } = await supabase
      .from("patients")
      .upsert(p, { onConflict: "id" })
      .select()
      .single();
    if (createdP) results.patients.push(createdP);
  }

  // 7. Seed today's appointments
  const today = new Date();
  const apt1Date = new Date(today);
  apt1Date.setHours(10, 0, 0, 0);

  const apt2Date = new Date(today);
  apt2Date.setHours(11, 30, 0, 0);

  const apt3Date = new Date(today);
  apt3Date.setHours(13, 0, 0, 0);

  const sampleAppointments = [
    {
      id: "apt-demo-001",
      patient_id: "pat-demo-001",
      doctor_id: actualDocId,
      clinic_id: clinicId,
      date: apt1Date.toISOString(),
      status: "CONFIRMED",
      type: "Consultation",
      fee: 350,
      amount_paid: 350,
      payment_method: "CASH",
      notes: "BP Check & Prescription renewal",
    },
    {
      id: "apt-demo-002",
      patient_id: "pat-demo-002",
      doctor_id: actualDocId,
      clinic_id: clinicId,
      date: apt2Date.toISOString(),
      status: "SCHEDULED",
      type: "Follow-up",
      fee: 200,
      amount_paid: 0,
      payment_method: "CASH",
      notes: "Suture check and recovery assessment",
    },
    {
      id: "apt-demo-003",
      patient_id: "pat-demo-003",
      doctor_id: actualDocId,
      clinic_id: clinicId,
      date: apt3Date.toISOString(),
      status: "SCHEDULED",
      type: "Consultation",
      fee: 350,
      amount_paid: 350,
      payment_method: "CARD",
      notes: "Comprehensive lab results review",
    },
  ];

  for (const a of sampleAppointments) {
    const { data: createdA } = await supabase
      .from("appointments")
      .upsert(a, { onConflict: "id" })
      .select()
      .single();
    if (createdA) results.appointments.push(createdA);
  }

  // 8. Seed sample expenses if table created
  try {
    const sampleExpenses = [
      {
        id: "exp-demo-001",
        clinic_id: clinicId,
        doctor_id: actualDocId,
        category: "SUPPLIES",
        title: "Sterile Medical Supplies & Gloves",
        title_ar: "مستلزمات طبية وقفازات معقمة",
        amount: 450,
        payment_method: "CASH",
        date: today.toISOString(),
      },
      {
        id: "exp-demo-002",
        clinic_id: clinicId,
        doctor_id: actualDocId,
        category: "UTILITIES",
        title: "Clinic High-Speed Fiber Internet",
        title_ar: "فاتورة إنترنت العيادة فايبر",
        amount: 380,
        payment_method: "CARD",
        date: today.toISOString(),
      },
    ];

    for (const exp of sampleExpenses) {
      await supabase.from("expenses").upsert(exp, { onConflict: "id" });
      results.expenses.push(exp);
    }
  } catch (expErr: any) {
    console.warn("Expense seed warning:", expErr);
  }

  // 9. Seed sample report
  try {
    await supabase.from("reports").upsert({
      id: "rep-demo-001",
      patient_id: "pat-demo-001",
      doctor_id: actualDocId,
      clinic_id: clinicId,
      content: "Patient reported occasional dizziness in the morning after taking medication.",
      doctor_review: "Adjusted dosage to half tablet in the morning. Follow up in 14 days.",
      status: "REVIEWED",
    }, { onConflict: "id" });
  } catch (repErr: any) {
    console.warn("Report seed warning:", repErr);
  }

  return NextResponse.json({
    success: true,
    message: "DOCTECH environment, tables, and demo doctor provisioned successfully!",
    credentials: {
      email: doctorEmail,
      password: doctorPassword,
      clinic: clinicName,
      doctorId: actualDocId,
      clinicId,
    },
    results,
  });
}
