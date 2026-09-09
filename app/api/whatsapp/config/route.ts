import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { testWhatsAppConnection } from "@/lib/whatsapp";

const mask = (value: string) => {
  if (value.length <= 8) return "••••••";
  return `${value.slice(0, 4)}••••••${value.slice(-2)}`;
};

export async function GET() {
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
}

const WHATSAPP_ENV_COMMENTS = "// WhatsApp Business Cloud API (Meta)";

// Applies a key=value pair into an existing .env content, preserving comments.
function upsertEnv(content: string, key: string, value: string): string {
  const linePattern = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}=${value}`;
  return content.match(linePattern)
    ? content.replace(linePattern, newLine)
    : `${content.trimEnd()}\n${newLine}`;
}

export async function POST(req: Request) {
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

  // ALWAYS verify the credentials live against the Meta Graph API before saving.
  const test = await testWhatsAppConnection(phoneNumberId, accessToken);
  if (!test.success) {
    return NextResponse.json(
      { success: false, error: test.error, verified: false },
      { status: 400 }
    );
  }

  // Persist to .env.local in development so the doctor can go live iteratively.
  if (process.env.NODE_ENV !== "production") {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      let content = "";
      try {
        content = await fs.readFile(envPath, "utf8");
      } catch {
        content = "";
      }
      if (!content.includes(WHATSAPP_ENV_COMMENTS)) {
        content = content.trimEnd()
          ? `${content.trimEnd()}\n\n${WHATSAPP_ENV_COMMENTS}`
          : WHATSAPP_ENV_COMMENTS;
      }
      content = upsertEnv(content, "WHATSAPP_PHONE_NUMBER_ID", phoneNumberId);
      content = upsertEnv(content, "WHATSAPP_ACCESS_TOKEN", accessToken);
      await fs.writeFile(envPath, `${content.trimEnd()}\n`, "utf8");
      process.env.WHATSAPP_PHONE_NUMBER_ID = phoneNumberId;
      process.env.WHATSAPP_ACCESS_TOKEN = accessToken;
    } catch (e) {
      return NextResponse.json(
        {
          success: true,
          verified: true,
          info: test.info,
          error:
            "Connection verified, but failed to write .env.local. Add the credentials manually.",
          persisted: false,
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    verified: true,
    info: test.info,
    persisted: process.env.NODE_ENV !== "production",
  });
}