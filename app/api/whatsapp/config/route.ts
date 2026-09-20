import { NextResponse } from "next/server";
import { testWhatsAppConnection } from "@/lib/whatsapp";
import { getClinicSession } from "@/lib/clinicAuth";

const mask = (value: string) => {
  if (value.length <= 8) return "••••••";
  return `${value.slice(0, 4)}••••••${value.slice(-2)}`;
};

export async function GET() {
  try {
    const session = await getClinicSession();

    if (!session || session.role !== "doctor") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Doctor access required" },
        { status: 401 }
      );
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
    const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "";

    const configured = Boolean(phoneNumberId && accessToken);

    return NextResponse.json({
      success: true,
      configured,
      phoneNumberIdMasked: phoneNumberId ? mask(phoneNumberId) : null,
      accessTokenSet: Boolean(accessToken),
      webhookVerifyTokenSet: Boolean(webhookVerifyToken),
    });
  } catch (error) {
    console.error("WhatsApp config GET error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const phoneNumberId = body.phoneNumberId?.trim();
    const accessToken = body.accessToken?.trim();

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: "phoneNumberId and accessToken are required." },
        { status: 400 }
      );
    }

    // Verify the credentials live against the Meta Graph API before confirming
    const test = await testWhatsAppConnection(phoneNumberId, accessToken);
    if (!test.success) {
      return NextResponse.json(
        { success: false, error: test.error, verified: false },
        { status: 400 }
      );
    }

    // Set process environment for current runtime safely
    process.env.WHATSAPP_PHONE_NUMBER_ID = phoneNumberId;
    process.env.WHATSAPP_ACCESS_TOKEN = accessToken;

    return NextResponse.json({
      success: true,
      verified: true,
      info: test.info,
      message: "Credentials verified successfully. Set them in your environment variables for production persistence.",
    });
  } catch (error) {
    console.error("WhatsApp config POST error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}