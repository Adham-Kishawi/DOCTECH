import { createHmac, timingSafeEqual } from "node:crypto";

export type SignatureResult = { valid: true } | { valid: false; reason: string };

/**
 * Validates Meta's `X-Hub-Signature-256` header.
 *
 * Meta computes: `sha256=` + HMAC_SHA256(app_secret, raw_request_body)
 * The signature must be computed over the RAW body, so callers must read the
 * request with `request.text()` and never `request.json()`.
 *
 * Fails closed: without `WHATSAPP_APP_SECRET` every message is rejected rather
 * than trusted.
 */
export function verifyMetaSignature(rawBody: string, signature: string | null): SignatureResult {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    return {
      valid: false,
      reason: "WHATSAPP_APP_SECRET is not configured — refusing to trust any message",
    };
  }

  if (!signature) {
    return { valid: false, reason: "missing x-hub-signature-256 header" };
  }

  if (!signature.startsWith("sha256=")) {
    return { valid: false, reason: "unsupported signature algorithm" };
  }

  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

  const providedBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  // timingSafeEqual throws on length mismatch, so guard first.
  if (providedBuf.length !== expectedBuf.length) {
    return { valid: false, reason: "signature length mismatch" };
  }

  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, reason: "signature mismatch" };
  }

  return { valid: true };
}