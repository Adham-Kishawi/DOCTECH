import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

function normalizeWhatsAppBotId(botId: string) {
  return botId
    .trim()
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/\D/g, "");
}

function normalizeDisplayPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phoneNumberId = url.searchParams.get("phoneNumberId")?.trim() ?? "";
    const botId = url.searchParams.get("botId")?.trim() ?? "";

    if (!phoneNumberId && !botId) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumberId or botId is required.",
        },
        { status: 400 }
      );
    }

    if (phoneNumberId) {
      const { data, error } = await supabase
        .from("whatsapp_configs")
        .select("clinic_id")
        .eq("phone_number_id", phoneNumberId)
        .maybeSingle();

      if (error) {
        console.error("WhatsApp clinic resolver error:", error);

        return NextResponse.json(
          { success: false, error: "Failed to resolve clinic." },
          { status: 500 }
        );
      }

      if (data?.clinic_id) {
        return NextResponse.json({
          success: true,
          clinicId: data.clinic_id,
        });
      }
    }

    if (botId) {
      const normalizedBotId = normalizeWhatsAppBotId(botId);

      if (!normalizedBotId) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid WhatsApp bot ID.",
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("whatsapp_configs")
        .select("clinic_id, display_phone_number");

      if (error) {
        console.error("WhatsApp bot clinic resolver error:", error);

        return NextResponse.json(
          { success: false, error: "Failed to resolve clinic." },
          { status: 500 }
        );
      }

      const match = data?.find(
        (config) =>
          normalizeDisplayPhone(config.display_phone_number ?? "") ===
          normalizedBotId
      );

      if (match?.clinic_id) {
        return NextResponse.json({
          success: true,
          clinicId: match.clinic_id,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "WhatsApp number is not linked to a clinic.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("WhatsApp clinic resolver internal error:", error);

    return NextResponse.json(
      { success: false, error: "Internal error." },
      { status: 500 }
    );
  }
}