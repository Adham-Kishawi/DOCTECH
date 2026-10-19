import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { verifyMetaSignature } from "@/lib/whatsapp/verifySignature";

const RAW_BODY = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
const sign = (secret: string, body = RAW_BODY) =>
  "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");

const originalSecret = process.env.WHATSAPP_APP_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.WHATSAPP_APP_SECRET;
  else process.env.WHATSAPP_APP_SECRET = originalSecret;
});

describe("verifyMetaSignature", () => {
  it("accepts a signature computed over the raw body", () => {
    expect(verifyMetaSignature(RAW_BODY, sign("vitest_app_secret"))).toEqual({
      valid: true,
    });
  });

  it("rejects a signature computed over a different body", () => {
    expect(verifyMetaSignature(RAW_BODY, sign("vitest_app_secret", "{}")).valid).toBe(
      false
    );
  });

  it("rejects a signature from a different app secret", () => {
    const result = verifyMetaSignature(RAW_BODY, sign("attacker_secret"));
    expect(result).toEqual({ valid: false, reason: "signature mismatch" });
  });

  it("rejects a truncated signature without throwing", () => {
    const result = verifyMetaSignature(RAW_BODY, "sha256=abc");
    expect(result).toEqual({ valid: false, reason: "signature length mismatch" });
  });

  it("rejects a missing header", () => {
    expect(verifyMetaSignature(RAW_BODY, null)).toEqual({
      valid: false,
      reason: "missing x-hub-signature-256 header",
    });
  });

  it("rejects a non-sha256 algorithm", () => {
    expect(verifyMetaSignature(RAW_BODY, "sha1=deadbeef")).toEqual({
      valid: false,
      reason: "unsupported signature algorithm",
    });
  });

  it("fails closed when the app secret is not configured", () => {
    delete process.env.WHATSAPP_APP_SECRET;
    const result = verifyMetaSignature(RAW_BODY, sign("vitest_app_secret"));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain("WHATSAPP_APP_SECRET is not configured");
    }
  });
});
