


import { NextResponse } from "next/server";
import { testWhatsAppConnection } from "@/lib/whatsapp";
import { getClinicSession } from "@/lib/clinicAuth";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const session = await getClinicSession();

    if (!session || session.role !== "doctor") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Doctor access required" },
        { status: 401 }
      );
    }

    const { data: config, error } = await supabase
      .from("whatsapp_configs")
      // .select("phone_number_id, access_token")
      .select("phone_number_id, display_phone_number, access_token")
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (error) {
      console.error("WhatsApp config lookup error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to load WhatsApp configuration.",
        },
        { status: 500 }
      );
    }

    const phoneNumberId = config?.phone_number_id ?? "";
    const accessToken = config?.access_token ?? "";
    const displayPhoneNumber = config?.display_phone_number ?? "";
    const configured = Boolean(phoneNumberId && accessToken);

    return NextResponse.json({
      success: true,
      configured,
      phoneNumberId,
      displayPhoneNumber,
      accessTokenSet: Boolean(accessToken),
      webhookVerifyTokenSet: Boolean(
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      ),
    });
  } catch (error) {
    console.error("WhatsApp config GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getClinicSession();

    if (!session || session.role !== "doctor") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Doctor access required" },
        { status: 401 }
      );
    }

    let body: { phoneNumberId?: string; accessToken?: string };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const phoneNumberId = body.phoneNumberId?.trim() ?? "";
    const submittedAccessToken = body.accessToken?.trim() ?? "";

    // Load the existing config so an empty token can reuse the saved token
    const { data: existingConfig, error: configError } = await supabase
      .from("whatsapp_configs")
      .select("access_token, display_phone_number")
      .eq("clinic_id", session.clinicId)
      .maybeSingle();

    if (configError) {
      console.error("WhatsApp existing config lookup error:", configError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load existing WhatsApp configuration.",
        },
        { status: 500 }
      );
    }

    const accessToken =
      submittedAccessToken || existingConfig?.access_token || "";

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumberId and accessToken are required.",
        },
        { status: 400 }
      );
    }

    // Verify credentials against Meta before saving them
    const test = await testWhatsAppConnection(
      phoneNumberId,
      accessToken
    );

    if (!test.success) {
      return NextResponse.json(
        {
          success: false,
          error: test.error,
          verified: false,
        },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase
      .from("whatsapp_configs")
      .upsert(
        {
          id: `wa-config-${session.clinicId}`,
          clinic_id: session.clinicId,
          phone_number_id: phoneNumberId,
          display_phone_number: test.info.display_phone_number,
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clinic_id" }
      );

    if (upsertError) {
      console.error("WhatsApp config save error:", upsertError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to save WhatsApp configuration.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      info: test.info,
      message: "WhatsApp credentials verified and saved successfully.",
    });
  } catch (error) {
    console.error("WhatsApp config POST error:", error);

    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}